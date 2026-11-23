// ============================================================
// AIE1101 作业：致敬 Tiny Thief 面包店风车关卡（剧情版）
// 只用原生 p5.js，不加载任何外部图片 / 音频
//
// 功能总览：
//   1. 开始界面 -> 点击进入游戏；失败界面 -> 点击重置（原有逻辑保留）
//   2. 小偷：点击可行走区域平滑移动，不能穿墙（原有逻辑保留）
//   3. 门：一键进门——点关着的门板，小偷走到门前自动开门走进去（原有逻辑保留）
//   4. 木箱躲藏：场景最左边一个木箱，开局小偷就藏在木箱里；
//      点击木箱进入/退出躲藏，躲藏时厨师看不见
//   5. 左边房子（面包店）有一扇开着的窗户；
//      开局厨师在房子里（画面中不出现），房子里看不见屋外的小偷
//   6. 剧情状态机：
//      开局 5 秒 -> 厨师上半身出现在窗户里放一个派 -> 离开窗户（仍被房子挡住）
//      窗台上的派被小偷拿走 -> 5 秒后厨师经过窗户（可见）停 1 秒
//        -> 走出门 -> 左右巡逻各两次（范围 = 房子左端到右端）
//        -> 走回屋里的门 -> 2 秒后又在窗户里放派 -> 循环
//      只要窗台上的派消失，就触发完全一样的行为
//      注意：每一个派都是独立对象（pies 数组），厨师放新派不会让
//      小偷手里 / 地上 / 小男孩手里的旧派消失
//   7. 派的交互：点派走近，再点派拾取；点小偷把派放到身前（地上）；
//      小偷拿着派靠近小男孩时，小男孩头顶出现白色实心圆（内含派图案），
//      点击圆圈 -> 小偷走到小男孩身前，把派交给他（派从小偷胸前移动到小男孩胸前）
//   8. 所有点击都有底部文字反馈
// ============================================================

// ---------------- 全局常量 ----------------
var CANVAS_W = 900;    // 画布宽度（像素）
var CANVAS_H = 600;    // 画布高度（像素）
var GROUND_TOP = 120;  // 地面开始的 y 坐标（上面是天空）
var THIEF_SPEED = 3;   // 小偷每帧移动速度（像素/帧）
var BAKER_SPEED = 1.5; // 厨师移动速度
var THIEF_R = 14;      // 小偷的碰撞半径（当作圆形处理）

// ---------------- 游戏状态 ----------------
// "start"  = 开始界面
// "play"   = 正在游戏
// "caught" = 被厨师抓住（失败界面）
var gameState = "start";

// 记录上一次鼠标按下的时间和位置，用来过滤"双击的第二次按下"
var lastPressTime = 0;
var lastPressX = 0;
var lastPressY = 0;

// ---------------- 点击反馈 ----------------
// 每次点击都会显示一句提示，2.2 秒后消失
var feedbackText = "";
var feedbackUntil = 0;

function showFeedback(msg) {
  feedbackText = msg;
  feedbackUntil = millis() + 2200;
}

// ---------------- 小偷对象 ----------------
var thief = {
  x: 50,          // 开局位置 = 木箱中心（配合 hidingInCrate 表现为藏在木箱里）
  y: 542,
  targetX: 50,
  targetY: 542,
  moving: false,
  hiding: false,  // 最终躲藏状态（木桶 或 木箱，每帧重算）
  inHouse: false, // 是否在房子门洞里（厨师看不见，原有机制保留）
  hidingInCrate: false // 是否躲在木箱里（由点击木箱切换）
};

// ---------------- 厨师对象 ----------------
// state 是剧情状态机的当前阶段（详见 updateBaker 的注释）
var baker = {
  x: 320,         // 开局藏在房子内部（被房子挡住，不画出来）
  y: 300,
  facing: 0,      // 面朝方向（弧度），巡逻时用于视野判定
  state: "hidden",     // 剧情阶段：hidden / toWindow / placing / leavingWindow /
                       // waitingPickup / waitingExit / passWindow / pausing /
                       // exiting / patrol / entering
  wp: [],              // 当前阶段的路径点队列（依次走过去）
  wpIndex: 0,          // 正在走向第几个路径点
  stateTimer: 0,       // 停顿类阶段的截止时间（毫秒时间戳）
  hiddenUntil: 5000,   // 藏在房子里的截止时间（开局 5 秒后去窗户，resetLevel 会重设）
  pendingExit: false   // 窗台上的派被拿走后置为 true，触发"出门巡逻"剧情
};

// ---------------- 剧情用常量（关键坐标） ----------------
// 厨师在房子内部移动用的几个点（画不出来，只用于状态机）
var BAKER_HIDE_X = 320;      // 屋内藏身处（远离窗户，被墙挡住）
var BAKER_WALK_Y = 300;      // 屋内水平移动的高度
var BAKER_DOOR_IN  = { x: 240, y: 345 }; // 面包店门洞内侧中心
var BAKER_DOOR_OUT = { x: 240, y: 402 }; // 门外落脚点（墙外）

// 巡逻参数：范围 = 左边房子左端到右端，在墙前 y=480 的高度走
var PATROL_Y = 480;
var PATROL_LEFT = 100;
var PATROL_RIGHT = 400;

// 剧情计时（毫秒）
var FIRST_PIE_DELAY = 5000;   // 开局到第一次窗口放派
var EXIT_DELAY = 5000;        // 派被拿走到厨师经过窗户
var WINDOW_PAUSE = 1000;      // 经过窗户时的停顿（1 秒）
var REENTER_DELAY = 2000;     // 进门到再次窗口放派
var PLACE_TIME = 1400;        // 在窗口放派停留的时间

// ---------------- 小男孩（新增） ----------------
// 开局 15 秒后从风车里走出来，站到风车最左侧，之后一直站在那里。
// 纯剧情角色：不和小偷、厨师发生任何交互（不算墙、不算躲藏点、不参与判定）
var BOY_DELAY = 15000; // 开局到小男孩出现的时间

var boy = {
  x: 705,             // 开局位置 = 风车门洞内侧中心（隐藏状态，不画出来）
  y: 360,
  state: "hidden",    // hidden = 藏在风车里 / exiting = 正在走出来 / standing = 站定
  wp: [],             // 走出来的路径点队列
  wpIndex: 0,
  appearAt: 15000     // 什么时候走出来（resetLevel 会重设为开局时间 + 15 秒）
};

var BOY_SPEED = 1.2; // 小男孩走得比大人慢一点
// 走出来的三个关键点：门洞内侧 -> 门外落脚点 -> 风车最左侧的站位
var BOY_DOOR_IN  = { x: 705, y: 360 }; // 风车门洞内侧（门洞是 690~720 x 340~380）
var BOY_DOOR_OUT = { x: 705, y: 402 }; // 门外落脚点（风车墙底边 y=380 之外）
var BOY_STAND    = { x: 650, y: 430 }; // 站位：风车塔身最左边缘（塔底左角 x=650）

// ---------------- 小偷把派交给小男孩（新增） ----------------
// 前提：小偷已经拾取过派（hasCarriedPie，即某个派处于 carried 状态）
// 触发：小偷靠近小男孩一定距离 -> 小男孩头顶出现白色实心圆（内含派图案）
//       点击圆圈 -> 小偷走到小男孩身前 -> 派从小偷胸前移动到小男孩胸前
var BOY_GIVE_DIST   = 90;  // 小偷离小男孩多近时，头顶圆圈才会出现
var BOY_GIVE_CLICK_R = 26; // 点击头顶圆圈的判定半径（圆本身画直径 44）
var PIE_HAND_SPEED  = 2;   // 交派动画：派每帧移动的速度
var BOY_GIVE_SPOT   = { x: BOY_STAND.x - 34, y: BOY_STAND.y + 6 }; // 小偷交派站位（男孩身前左侧）

// 是否处于"点了圆圈、小偷正走去交派"的状态
var pendingGive = false;

// ---------------- 窗户、木箱、派 ----------------
// 开着的窗户（ replaces 原来左边的小窗户，就是厨师放派的窗口）
var openWindow = { x: 100, y: 240, w: 70, h: 100 };
var WINDOW_CX = openWindow.x + openWindow.w / 2; // 窗户中心 x = 135
var WINDOW_SILL_Y = openWindow.y + openWindow.h; // 窗台 y = 340

// 木箱（场景最左边，小偷的藏身处之一）
var crate = { x: 25, y: 520, w: 50, h: 44 };
var crateCX = crate.x + crate.w / 2; // 木箱中心 x = 50
var crateCY = crate.y + crate.h / 2; // 木箱中心 y = 542
var CRATE_TOUCH_DIST = 70; // 小偷离木箱多近才能直接钻进去/出来
var CRATE_OUT_X = 88;      // 从木箱出来后站的位置（木箱右侧）
var CRATE_OUT_Y = 548;

// ---------------- 派 ----------------
// 每一个派都是独立对象，存放在 pies 数组里（厨师每次放到窗台的派都保留，永不覆盖）
// 单个派的 location 取值：
//   "sill"     = 在窗台上（厨师放的）
//   "carried"  = 小偷口袋里（看不见；同一时间小偷最多拿一个）
//   "ground"   = 在地上（小偷身前，可再次拾取）
//   "handing"  = 正在从小偷胸前移动到小男孩胸前（交派动画中）
//   "boy"      = 已经交给小男孩（画在小男孩胸前，不可再拾取）
var pies = []; // 场上所有派，只有 resetLevel 才清空

// 小偷当前拿着的派（最多一个），没有就返回 null
function getCarriedPie() {
  for (var i = 0; i < pies.length; i++) {
    if (pies[i].location === "carried") {
      return pies[i];
    }
  }
  return null;
}

// 小偷手里是否有派
function hasCarriedPie() {
  return getCarriedPie() !== null;
}

// 窗台上现有的派有几个（放新派时错开位置用）
function countSillPies() {
  var n = 0;
  for (var i = 0; i < pies.length; i++) {
    if (pies[i].location === "sill") {
      n = n + 1;
    }
  }
  return n;
}

// 地上现有的派有几个（放新派时错开位置用）
function countGroundPies() {
  var n = 0;
  for (var i = 0; i < pies.length; i++) {
    if (pies[i].location === "ground") {
      n = n + 1;
    }
  }
  return n;
}
var PIE_SILL_X = WINDOW_CX;          // 窗台上的派的位置
var PIE_SILL_Y = WINDOW_SILL_Y + 6;  // = 346，正好坐在窗台上
var PIE_REACH = 65;       // 小偷离派多近才能拾取
var PIE_CLICK_R = 24;     // 点击派的判定半径
var THIEF_CLICK_R = 26;   // 点击小偷的判定半径

// ---------------- 门（可开关，原有逻辑保留） ----------------
var bakeryDoor   = { x: 210, y: 310, w: 60, h: 70, open: false }; // 面包店的门
var windmillDoor = { x: 690, y: 340, w: 30, h: 40, open: false }; // 风车的门
var doors = [bakeryDoor, windmillDoor];

// "待进门"的门编号：点了关着的门后先记住，等小偷走到门前再自动开门
var pendingDoorIndex = -1;

// 每扇门背后的"房子内部"区域（小偷中心走进去 = 进房子，厨师看不见）
var houseInteriors = [
  { x: 210, y: 310, w: 60, h: 70 }, // 面包店门洞内部
  { x: 690, y: 340, w: 30, h: 40 }  // 风车门洞内部
];

var DOOR_TOUCH_DIST = 70; // 门开着时，小偷离门多近才响应点击

// ---------------- 视野说明 ----------------
// 厨师面朝哪边，那一侧的整个半屏都能看见（原有规则不变）：
// 以厨师所在位置的竖直线为分界，背后那一侧永远看不见，没有距离限制。
// 新增：厨师只有在屋外巡逻（state == "patrol"）时才看得见小偷；
// 藏在房子里/窗口里时，看不见屋外的小偷。
// 小偷这边不变：躲藏（木桶/木箱）或在房子门洞里，厨师都看不见。

// ---------------- 场景物体 ----------------
var walls = [];       // 墙体列表：{ x, y, w, h }
var hidingSpots = []; // 木桶躲藏点列表：{ x, y, r }

// ============================================================
// p5.js 核心函数
// ============================================================

function setup() {
  createCanvas(CANVAS_W, CANVAS_H);
  buildLevel();
}

function draw() {
  if (gameState === "start") {
    drawStartScreen();
  } else if (gameState === "play") {
    updateGame();
    drawGame();
  } else if (gameState === "caught") {
    drawCaughtScreen();
  }
}

// ============================================================
// 关卡搭建
// ============================================================

function buildLevel() {
  walls = [];
  hidingSpots = [];

  // 面包店墙体：门口（210~270 x 310~380）留门洞
  walls.push({ x: 80,  y: 200, w: 130, h: 180 }); // 门左边的墙
  walls.push({ x: 270, y: 200, w: 150, h: 180 }); // 门右边的墙
  walls.push({ x: 210, y: 200, w: 60,  h: 110 }); // 门上方的墙

  // 风车塔墙体：风车门（690~720 x 340~380）留门洞
  walls.push({ x: 660, y: 260, w: 30, h: 120 }); // 门左边的墙
  walls.push({ x: 720, y: 260, w: 30, h: 120 }); // 门右边的墙
  walls.push({ x: 660, y: 260, w: 90, h: 80 });  // 门上方的墙

  // 画面底部栅栏，防止小偷走出画面
  walls.push({ x: 0, y: 580, w: CANVAS_W, h: 20 });

  // 木桶躲藏点（面包店门口，原有）
  hidingSpots.push({ x: 430, y: 540, r: 30 });
}

// ============================================================
// 鼠标点击分发
// ============================================================

function handleGameClick(mx, my) {
  // 过滤双击的第二次按下（全屏切换由 dblclick 事件负责）
  var now = millis();
  var isSecondPress = (now - lastPressTime < 400) &&
                      (abs(mx - lastPressX) < 15) &&
                      (abs(my - lastPressY) < 15);
  lastPressTime = now;
  lastPressX = mx;
  lastPressY = my;

  if (gameState === "start") {
    // 开始界面：点击进入游戏，并重置出全新的开局状态
    resetLevel();
    gameState = "play";
    showFeedback("游戏开始！小偷藏在左边的木箱里");
  } else if (gameState === "play") {
    if (isSecondPress) {
      return;
    }
    // 点击优先级：木箱 -> 派/小偷 -> 交派圆圈 -> 门 -> 普通移动
    if (tryCrateClick(mx, my)) {
      return;
    }
    if (tryPieClick(mx, my)) {
      return;
    }
    if (tryThiefClick(mx, my)) {
      return;
    }
    if (tryGivePieClick(mx, my)) {
      return;
    }
    if (tryDoorInteraction(mx, my)) {
      return;
    }
    setThiefTarget(mx, my);
  } else if (gameState === "caught") {
    if (isSecondPress) {
      return;
    }
    // 失败界面：点击重置关卡
    resetLevel();
    gameState = "play";
    showFeedback("重新开始！");
  }
}

// ============================================================
// 小偷移动（原有逻辑，仅加了"取消木箱躲藏"）
// ============================================================

function setThiefTarget(mx, my) {
  // 任何新的移动指令都会让小偷离开木箱躲藏状态
  cancelCrateHiding();
  // 玩家改点别的地方了：取消之前"点了门正在走过去"的进门流程
  pendingDoorIndex = -1;
  // 同时取消"走去给小男孩送派"的流程
  pendingGive = false;

  var tx = constrain(mx, THIEF_R, CANVAS_W - THIEF_R);
  var ty = constrain(my, GROUND_TOP + THIEF_R, CANVAS_H - THIEF_R);
  thief.targetX = tx;
  thief.targetY = ty;
  thief.moving = true;
  showFeedback("小偷走向目标位置");
}

// 取消木箱躲藏（只清标记，移动由各调用方自己决定）
function cancelCrateHiding() {
  thief.hidingInCrate = false;
}

function moveThief() {
  var dx = thief.targetX - thief.x;
  var dy = thief.targetY - thief.y;
  var dist = sqrt(dx * dx + dy * dy);

  if (dist < THIEF_SPEED) {
    thief.x = thief.targetX;
    thief.y = thief.targetY;
    thief.moving = false;
  } else {
    var stepX = (dx / dist) * THIEF_SPEED;
    var stepY = (dy / dist) * THIEF_SPEED;
    tryMoveThief(stepX, 0); // 先左右
    tryMoveThief(0, stepY); // 再上下（撞墙会贴墙滑动）
  }
}

function tryMoveThief(stepX, stepY) {
  var newX = thief.x + stepX;
  var newY = thief.y + stepY;
  if (!isHittingWall(newX, newY)) {
    thief.x = newX;
    thief.y = newY;
  }
}

// 圆形小偷 vs 矩形墙/关着的门 的碰撞检测（原有逻辑）
function isHittingWall(px, py) {
  for (var i = 0; i < walls.length; i++) {
    var w = walls[i];
    var closestX = constrain(px, w.x, w.x + w.w);
    var closestY = constrain(py, w.y, w.y + w.h);
    var dx = px - closestX;
    var dy = py - closestY;
    if (dx * dx + dy * dy < THIEF_R * THIEF_R) {
      return true;
    }
  }
  // 关闭状态的门也算墙
  for (var j = 0; j < doors.length; j++) {
    var d = doors[j];
    if (!d.open) {
      var dClosestX = constrain(px, d.x, d.x + d.w);
      var dClosestY = constrain(py, d.y, d.y + d.h);
      var ddx = px - dClosestX;
      var ddy = py - dClosestY;
      if (ddx * ddx + ddy * ddy < THIEF_R * THIEF_R) {
        return true;
      }
    }
  }
  return false;
}

// ============================================================
// 木箱躲藏（新增）
// ============================================================

// 处理点击木箱。返回 true 表示这次点击被木箱消费了
function tryCrateClick(mx, my) {
  // 点的不是木箱区域 -> 不拦截
  if (!pointInRect(mx, my, crate)) {
    return false;
  }

  // 小偷离木箱很远：让他先走过去（走到木箱右侧的落脚点）
  var dx = thief.x - crateCX;
  var dy = thief.y - crateCY;
  if (dx * dx + dy * dy > CRATE_TOUCH_DIST * CRATE_TOUCH_DIST) {
    cancelCrateHiding();
    pendingDoorIndex = -1;
    pendingGive = false;
    thief.targetX = CRATE_OUT_X;
    thief.targetY = CRATE_OUT_Y;
    thief.moving = true;
    showFeedback("小偷走向木箱");
    return true;
  }

  // 小偷就在木箱旁：切换躲藏 / 出来
  if (thief.hidingInCrate) {
    // 从木箱出来：走到木箱右侧站好
    thief.hidingInCrate = false;
    thief.targetX = CRATE_OUT_X;
    thief.targetY = CRATE_OUT_Y;
    thief.moving = true;
    showFeedback("小偷从木箱里出来了");
  } else {
    // 钻进木箱：位置吸附到箱子中心，原地停住，进入躲藏
    thief.hidingInCrate = true;
    thief.x = crateCX;
    thief.y = crateCY;
    thief.targetX = crateCX;
    thief.targetY = crateCY;
    thief.moving = false;
    pendingDoorIndex = -1;
    showFeedback("小偷躲进了木箱");
  }
  return true;
}

// ============================================================
// 门：一键进门（原有逻辑保留，加了点击反馈）
// ============================================================

function tryDoorInteraction(mx, my) {
  for (var i = 0; i < doors.length; i++) {
    if (handleOneDoor(doors[i], houseInteriors[i], mx, my, i)) {
      return true;
    }
  }
  return false;
}

function handleOneDoor(d, interior, mx, my, doorIndex) {
  // ---- 门关着：点门板 = 触发一键进门（不限距离，小偷会自己走过去） ----
  if (!d.open) {
    if (pointInRect(mx, my, d)) {
      startDoorEntry(d, doorIndex);
      return true;
    }
    return false;
  }

  // ---- 门开着：小偷要站得够近才响应 ----
  var doorCX = d.x + d.w / 2;
  var doorCY = d.y + d.h / 2;
  var thiefDx = thief.x - doorCX;
  var thiefDy = thief.y - doorCY;
  if (thiefDx * thiefDx + thiefDy * thiefDy > DOOR_TOUCH_DIST * DOOR_TOUCH_DIST) {
    return false;
  }

  // 点在歪出去的门板竖条上 -> 关门（小偷在门洞里时不允许关）
  var leafLeft = d.x + d.w;
  if (mx >= leafLeft && mx <= leafLeft + 20 && my >= d.y && my <= d.y + d.h) {
    if (!isThiefInRect(interior)) {
      d.open = false;
      showFeedback("门关上了");
      return true;
    }
    return false;
  }

  // 点在门洞阴影里 -> 直接走进房子
  if (pointInRect(mx, my, d)) {
    cancelCrateHiding();
    pendingGive = false;
    thief.targetX = doorCX;
    thief.targetY = doorCY;
    thief.moving = true;
    showFeedback("小偷走进了房子");
    return true;
  }

  return false;
}

// 一键进门第一步：记住这扇门，让小偷先走到门前落脚点
function startDoorEntry(d, doorIndex) {
  pendingDoorIndex = doorIndex;
  pendingGive = false;
  cancelCrateHiding();
  thief.targetX = d.x + d.w / 2;
  thief.targetY = d.y + d.h + 22;
  thief.moving = true;
  showFeedback("小偷走向门前，到达后会自动开门进屋");
}

// 一键进门第二步：到达门前 -> 自动开门 -> 走进门洞
function checkDoorEntry() {
  if (pendingDoorIndex < 0) {
    return;
  }
  if (thief.moving) {
    return;
  }
  var d = doors[pendingDoorIndex];
  d.open = true;
  thief.targetX = d.x + d.w / 2;
  thief.targetY = d.y + d.h / 2;
  thief.moving = true;
  pendingDoorIndex = -1;
  showFeedback("门自动打开了，小偷走进房子");
}

function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w &&
         py >= r.y && py <= r.y + r.h;
}

function isThiefInRect(r) {
  return pointInRect(thief.x, thief.y, r);
}

// ============================================================
// 厨师剧情状态机（新增，替代原来的固定路线巡逻）
// 移动方式与原来的巡逻一致：朝目标点匀速直线走，视野规则不变
// ============================================================

// 每帧更新厨师。各阶段含义：
//   hidden        藏在房子里（画面上看不到），等 hiddenUntil 到点
//   toWindow      在屋内水平移动到窗户位置（经过窗户时上半身可见）
//   placing       在窗户里放派（上半身可见），停留 PLACE_TIME 后离开
//   leavingWindow 屋内移回藏身处，离开窗户视野
//   waitingPickup 藏在屋里，等窗台上的派被拿走
//   waitingExit   派被拿走了，等 EXIT_DELAY 后出来
//   passWindow    屋内走向窗户（"经过窗户"，可见）
//   pausing       在窗户处停 WINDOW_PAUSE 秒
//   exiting       从窗户走到门洞再走出房门（路过门洞时可见）
//   patrol        在房前左右巡逻（左右各两次），此时能看见小偷
//   entering      巡逻完走回房门进屋，然后等 REENTER_DELAY 再去窗户放派
function updateBaker() {
  var now = millis();

  if (baker.state === "hidden") {
    // 藏在屋里等时间到（开局 5 秒 / 进门后 2 秒）
    if (now >= baker.hiddenUntil) {
      beginToWindow();
    }
  } else if (baker.state === "toWindow") {
    if (moveAlongWaypoints()) {
      beginPlacing();
    }
  } else if (baker.state === "placing") {
    // 放派停留一会儿
    if (now >= baker.stateTimer) {
      beginLeavingWindow();
    }
  } else if (baker.state === "leavingWindow") {
    if (moveAlongWaypoints()) {
      if (baker.pendingExit) {
        // 放派过程中派就被拿走了：直接进入"准备出门"的等待
        beginWaitingExit();
      } else {
        // 正常：藏在屋里，等派被拿走
        baker.state = "waitingPickup";
      }
    }
  } else if (baker.state === "waitingPickup") {
    // 什么都不做，等 tryPieClick 里的 onSillPieTaken() 触发
  } else if (baker.state === "waitingExit") {
    if (now >= baker.stateTimer) {
      beginPassWindow();
    }
  } else if (baker.state === "passWindow") {
    if (moveAlongWaypoints()) {
      beginPausing();
    }
  } else if (baker.state === "pausing") {
    if (now >= baker.stateTimer) {
      beginExiting();
    }
  } else if (baker.state === "exiting") {
    if (moveAlongWaypoints()) {
      beginPatrol();
    }
  } else if (baker.state === "patrol") {
    if (moveAlongWaypoints()) {
      beginEntering();
    }
  } else if (baker.state === "entering") {
    if (moveAlongWaypoints()) {
      beginHiddenAfterPatrol();
    }
  }
}

// 通用移动：依次走 baker.wp 里的路径点，全部走完返回 true
// （和原来的巡逻移动一样：朝目标点匀速直线走，facing 跟随移动方向）
function moveAlongWaypoints() {
  var t = baker.wp[baker.wpIndex];
  var dx = t.x - baker.x;
  var dy = t.y - baker.y;
  var dist = sqrt(dx * dx + dy * dy);

  if (dist < BAKER_SPEED) {
    baker.x = t.x;
    baker.y = t.y;
    baker.wpIndex = baker.wpIndex + 1;
    if (baker.wpIndex >= baker.wp.length) {
      return true; // 这一阶段的路走完了
    }
    return false;
  }
  baker.facing = atan2(dy, dx);
  baker.x = baker.x + (dx / dist) * BAKER_SPEED;
  baker.y = baker.y + (dy / dist) * BAKER_SPEED;
  return false;
}

// ---- 各阶段的开始函数 ----

function beginToWindow() {
  baker.state = "toWindow";
  baker.wp = [{ x: WINDOW_CX, y: BAKER_WALK_Y }];
  baker.wpIndex = 0;
}

function beginPlacing() {
  baker.state = "placing";
  baker.stateTimer = millis() + PLACE_TIME;
  // 放下一个全新的派（每个派独立，旧的派不会被覆盖、不会消失）
  // 如果窗台上已经有派没被拿走，新派往右错开一点，避免完全叠在一起
  var offset = countSillPies() * 18;
  pies.push({
    location: "sill",
    x: PIE_SILL_X + offset,
    y: PIE_SILL_Y
  });
}

function beginLeavingWindow() {
  baker.state = "leavingWindow";
  baker.wp = [{ x: BAKER_HIDE_X, y: BAKER_WALK_Y }];
  baker.wpIndex = 0;
}

function beginWaitingExit() {
  baker.state = "waitingExit";
  baker.stateTimer = millis() + EXIT_DELAY;
  baker.pendingExit = false;
}

function beginPassWindow() {
  baker.state = "passWindow";
  baker.wp = [{ x: WINDOW_CX, y: BAKER_WALK_Y }];
  baker.wpIndex = 0;
}

function beginPausing() {
  baker.state = "pausing";
  baker.stateTimer = millis() + WINDOW_PAUSE;
}

function beginExiting() {
  baker.state = "exiting";
  // 厨师是店主，出门前自己把门打开
  bakeryDoor.open = true;
  // 先在屋内走到门洞内侧，再走出房门
  baker.wp = [BAKER_DOOR_IN, BAKER_DOOR_OUT];
  baker.wpIndex = 0;
}

function beginPatrol() {
  baker.state = "patrol";
  // 左右巡逻各两次：右 -> 左 -> 右 -> 左
  baker.wp = [
    { x: PATROL_RIGHT, y: PATROL_Y },
    { x: PATROL_LEFT,  y: PATROL_Y },
    { x: PATROL_RIGHT, y: PATROL_Y },
    { x: PATROL_LEFT,  y: PATROL_Y }
  ];
  baker.wpIndex = 0;
}

function beginEntering() {
  baker.state = "entering";
  // 回屋前自己把门打开（也许被小偷关上了）
  bakeryDoor.open = true;
  // 从巡逻线走回门口，再走进门洞
  baker.wp = [BAKER_DOOR_OUT, BAKER_DOOR_IN];
  baker.wpIndex = 0;
}

function beginHiddenAfterPatrol() {
  // 回到屋内藏身处
  baker.x = BAKER_HIDE_X;
  baker.y = BAKER_WALK_Y;
  baker.state = "hidden";
  baker.hiddenUntil = millis() + REENTER_DELAY; // 2 秒后再去窗户放派
  // 顺手关门（小偷在门洞里就不关，免得把人关进墙里）
  if (!isThiefInRect(houseInteriors[0])) {
    bakeryDoor.open = false;
  }
}

// 窗台上的派被拿走时调用（从 tryPieClick 里触发）
function onSillPieTaken() {
  baker.pendingExit = true;
  if (baker.state === "waitingPickup") {
    // 正常情况：藏在屋里等 5 秒再出来
    beginWaitingExit();
  }
  // 如果厨师还在窗户边/移动中，pendingExit 会在 leavingWindow 结束时生效
}

// ============================================================
// 小男孩剧情（新增）：开局 15 秒后走出风车，站到风车最左侧
// 和厨师一样用"路径点队列"的方式走路，但流程简单得多
// ============================================================

// 每帧更新小男孩
function updateBoy() {
  if (boy.state === "hidden") {
    // 藏在风车里，等开局 15 秒
    if (millis() >= boy.appearAt) {
      beginBoyExit();
    }
  } else if (boy.state === "exiting") {
    // 正在走出门：依次走完路径点
    if (moveBoyAlongWaypoints()) {
      // 走完了：站定在风车最左侧，之后不再移动
      boy.state = "standing";
    }
  }
  // standing 状态：站定不动（唯一的交互是小偷送派给他，见"交派"部分）
}

// 小男孩开始走出风车
function beginBoyExit() {
  boy.state = "exiting";
  // 风车门是男孩自己家的，出门前把门打开
  windmillDoor.open = true;
  // 路径：门洞内侧 -> 门外落脚点 -> 风车最左侧站位
  boy.wp = [BOY_DOOR_OUT, BOY_STAND];
  boy.wpIndex = 0;
  showFeedback("风车的门开了，小男孩走了出来");
}

// 通用移动：依次走 boy.wp 里的路径点，全部走完返回 true
// （和厨师的 moveAlongWaypoints 同样的写法，只是速度更慢）
function moveBoyAlongWaypoints() {
  var t = boy.wp[boy.wpIndex];
  var dx = t.x - boy.x;
  var dy = t.y - boy.y;
  var dist = sqrt(dx * dx + dy * dy);

  if (dist < BOY_SPEED) {
    boy.x = t.x;
    boy.y = t.y;
    boy.wpIndex = boy.wpIndex + 1;
    if (boy.wpIndex >= boy.wp.length) {
      return true; // 走完了
    }
    return false;
  }
  boy.x = boy.x + (dx / dist) * BOY_SPEED;
  boy.y = boy.y + (dy / dist) * BOY_SPEED;
  return false;
}

// 小男孩的绘制：站在门外之后一直画出来
function drawBoy() {
  // 藏在风车里时被房子挡住，不画
  if (boy.state === "hidden") {
    return;
  }

  // 小小的一段身体（蓝色小褂）
  fill(70, 130, 180);
  rect(boy.x - 8, boy.y - 6, 16, 18);

  // 头（比大人小一圈）
  fill(240, 200, 160);
  circle(boy.x, boy.y - 14, 14);

  // 头发（棕色的帽子形头发）
  fill(110, 70, 40);
  ellipse(boy.x, boy.y - 19, 15, 9);

  // 短裤
  fill(80, 80, 95);
  rect(boy.x - 8, boy.y + 8, 16, 6);
}

// ============================================================
// 派的交互（新增）
// ============================================================

// 处理点击派（窗台上 / 地上的，每个派独立）。返回 true 表示点击被消费
function tryPieClick(mx, my) {
  // 遍历所有派，找到被点中的那一个
  for (var i = 0; i < pies.length; i++) {
    var p = pies[i];
    // 只有窗台上和地上的派可以点击（手里的/递送中的/男孩的都不行）
    if (p.location !== "sill" && p.location !== "ground") {
      continue;
    }
    // 点得不够准 -> 看下一个派
    if (dist(mx, my, p.x, p.y) >= PIE_CLICK_R) {
      continue;
    }

    var dx = thief.x - p.x;
    var dy = thief.y - p.y;
    if (dx * dx + dy * dy < PIE_REACH * PIE_REACH) {
      // 够得着：拾取。小偷同一时间只能拿一个派
      if (hasCarriedPie()) {
        showFeedback("小偷手里已经拿着一个派了，先放下或送出去");
        return true;
      }
      var wasOnSill = (p.location === "sill");
      p.location = "carried";
      showFeedback("小偷拿到了派！");
      if (wasOnSill) {
        onSillPieTaken(); // 窗台上的派消失 -> 触发厨师剧情
      }
    } else {
      // 够不着：先走过去（第二次点击再拾取）
      cancelCrateHiding();
      pendingDoorIndex = -1;
      pendingGive = false;
      if (p.location === "sill") {
        // 窗台比较高，走到窗户正下方的墙脚
        thief.targetX = p.x;
        thief.targetY = 398;
      } else {
        thief.targetX = p.x;
        thief.targetY = constrain(p.y + 16, GROUND_TOP, 566);
      }
      thief.moving = true;
      showFeedback("小偷走向派");
    }
    return true;
  }
  return false;
}

// 处理点击小偷本体（把口袋里的派直接放到身前地上）。返回 true 表示点击被消费
function tryThiefClick(mx, my) {
  if (thief.hidingInCrate || thief.inHouse) {
    return false; // 藏起来/在屋里时不响应"点小偷"
  }
  if (dist(mx, my, thief.x, thief.y - 10) < THIEF_CLICK_R) {
    if (hasCarriedPie()) {
      // 直接把派放到身前（右手边地上），不再经过"头顶"环节
      // 地上已经有派时往右错开一点，避免完全叠在一起
      var carried = getCarriedPie();
      carried.location = "ground";
      carried.x = constrain(thief.x + 28 + countGroundPies() * 18, 20, CANVAS_W - 20);
      carried.y = thief.y;
      pendingGive = false;
      showFeedback("小偷把派放在了身前");
    } else {
      showFeedback("小偷看了看自己：身上没有派");
    }
    return true;
  }
  return false;
}

// ============================================================
// 把派交给小男孩（新增）
// ============================================================

// 处理点击小男孩头顶的白色实心圆。返回 true 表示点击被消费
// 圆圈出现的条件：小偷手里有派 + 小男孩已站定 + 小偷离小男孩足够近
function tryGivePieClick(mx, my) {
  if (!canShowGiveBubble()) {
    return false;
  }
  // 圆心在小男孩头顶上方
  var bx = boy.x;
  var by = boy.y - 40;
  if (dist(mx, my, bx, by) < BOY_GIVE_CLICK_R) {
    // 让小偷走到小男孩身前的交派站位
    pendingGive = true;
    cancelCrateHiding();
    pendingDoorIndex = -1;
    thief.targetX = BOY_GIVE_SPOT.x;
    thief.targetY = BOY_GIVE_SPOT.y;
    thief.moving = true;
    showFeedback("小偷走过去把派交给小男孩");
    return true;
  }
  return false;
}

// 头顶圆圈能不能出现（点击判定和绘制共用这一个判断）
function canShowGiveBubble() {
  if (!hasCarriedPie()) {
    return false; // 小偷手里没派
  }
  if (boy.state !== "standing") {
    return false; // 小男孩还没走出来 / 还没站定
  }
  if (thief.hidingInCrate || thief.inHouse) {
    return false; // 小偷藏着或在屋里，没法送派
  }
  var dx = thief.x - boy.x;
  var dy = thief.y - boy.y;
  return dx * dx + dy * dy < BOY_GIVE_DIST * BOY_GIVE_DIST;
}

// 交派流程的每帧更新（在 updateGame 里调用）
function updatePieGive() {
  // 阶段一：小偷正走向小男孩身前，到站后开始交派动画
  if (pendingGive && !thief.moving) {
    pendingGive = false;
    var carried = getCarriedPie();
    if (carried !== null) {
      // 派出现在小偷胸前，之后每帧向小男孩胸前移动
      carried.location = "handing";
      carried.x = thief.x;
      carried.y = thief.y - 2;
      showFeedback("小偷把派递给了小男孩");
    }
  }

  // 阶段二：所有"递送中"的派都向小男孩胸前移动（互不影响，各自独立）
  for (var i = 0; i < pies.length; i++) {
    var p = pies[i];
    if (p.location !== "handing") {
      continue;
    }
    var tx = boy.x;
    var ty = boy.y; // 小男孩胸口的高度
    var dx = tx - p.x;
    var dy = ty - p.y;
    var d = sqrt(dx * dx + dy * dy);
    if (d < PIE_HAND_SPEED) {
      // 到达：这个派正式交给小男孩（其他派不受影响）
      p.location = "boy";
      p.x = tx;
      p.y = ty;
      showFeedback("派交给了小男孩！");
    } else {
      p.x = p.x + (dx / d) * PIE_HAND_SPEED;
      p.y = p.y + (dy / d) * PIE_HAND_SPEED;
    }
  }
}

// ============================================================
// 每帧更新（play 状态）
// ============================================================

function updateGame() {
  moveThief();      // 小偷移动 + 碰撞
  checkDoorEntry(); // 一键进门：到门前自动开门走进去
  updatePieGive();  // 送派给小男孩的流程（走到位 + 交派动画）
  updateBaker();    // 厨师剧情状态机
  updateBoy();      // 小男孩剧情（走出风车）
  checkHiding();    // 小偷躲藏判定（木桶 + 木箱）
  checkInHouse();   // 小偷是否在房子门洞里
  checkCaught();    // 是否被发现
}

// ---------------- 躲藏判定 ----------------

function checkHiding() {
  thief.hiding = false;

  // 木桶（原有）：中心在桶的圆里就算躲藏
  for (var i = 0; i < hidingSpots.length; i++) {
    var s = hidingSpots[i];
    var dx = thief.x - s.x;
    var dy = thief.y - s.y;
    if (dx * dx + dy * dy < s.r * s.r) {
      thief.hiding = true;
    }
  }

  // 木箱（新增）：只要处于"躲在木箱里"的标记状态就算躲藏
  if (thief.hidingInCrate) {
    thief.hiding = true;
  }
}

// ---------------- 进房子判定（原有逻辑保留） ----------------

function checkInHouse() {
  thief.inHouse = false;
  for (var i = 0; i < houseInteriors.length; i++) {
    if (isThiefInRect(houseInteriors[i])) {
      thief.inHouse = true;
    }
  }
}

// ---------------- 被发现判定（视野规则保留 + 新增厨师在屋内看不见） ----------------

function checkCaught() {
  // 小偷躲藏中 -> 看不见
  if (thief.hiding) {
    return;
  }
  // 小偷在房子门洞里 -> 看不见（原有机制）
  if (thief.inHouse) {
    return;
  }
  // 新增：厨师只有在屋外巡逻时才看得见小偷。
  // 藏在房子里 / 在窗户里 / 进出门的过程中，都看不见屋外的小偷
  if (baker.state !== "patrol") {
    return;
  }

  // 左右半平面检查（原有规则：面朝哪边哪边全可见，背后看不见）
  var facingX = cos(baker.facing);
  if (facingX < 0) {
    if (thief.x >= baker.x) {
      return;
    }
  } else {
    if (thief.x <= baker.x) {
      return;
    }
  }

  // 木桶遮挡检查（原有规则）
  if (isBlockedByBarrel(baker.x, baker.y, thief.x, thief.y)) {
    return;
  }

  gameState = "caught";
}

// 视线是否被木桶挡住（原有逻辑）
function isBlockedByBarrel(x1, y1, x2, y2) {
  for (var i = 0; i < hidingSpots.length; i++) {
    var s = hidingSpots[i];
    var d = distPointToSegment(s.x, s.y, x1, y1, x2, y2);
    if (d < s.r) {
      return true;
    }
  }
  return false;
}

// 点到线段的最短距离（原有逻辑）
function distPointToSegment(px, py, x1, y1, x2, y2) {
  var segX = x2 - x1;
  var segY = y2 - y1;
  var pointX = px - x1;
  var pointY = py - y1;
  var segLenSq = segX * segX + segY * segY;
  if (segLenSq === 0) {
    return sqrt(pointX * pointX + pointY * pointY);
  }
  var t = (pointX * segX + pointY * segY) / segLenSq;
  t = constrain(t, 0, 1);
  var projX = x1 + segX * t;
  var projY = y1 + segY * t;
  var dx = px - projX;
  var dy = py - projY;
  return sqrt(dx * dx + dy * dy);
}

// ============================================================
// 重置关卡：回到全新的开局状态
// ============================================================

function resetLevel() {
  // 小偷：回到木箱里，直接处于躲藏状态
  thief.x = crateCX;
  thief.y = crateCY;
  thief.targetX = crateCX;
  thief.targetY = crateCY;
  thief.moving = false;
  thief.hiding = false;
  thief.inHouse = false;
  thief.hidingInCrate = true;

  // 厨师：藏回房子里，开局 5 秒后去窗户放派
  baker.x = BAKER_HIDE_X;
  baker.y = BAKER_WALK_Y;
  baker.facing = 0;
  baker.state = "hidden";
  baker.wp = [];
  baker.wpIndex = 0;
  baker.pendingExit = false;
  baker.hiddenUntil = millis() + FIRST_PIE_DELAY;

  // 派：全部清空（每个派都是独立的，重开一局才是全新的一批）
  pies = [];
  pendingGive = false; // 取消未完成的送派流程

  // 门全部关闭、清空待进门记录
  pendingDoorIndex = -1;
  for (var i = 0; i < doors.length; i++) {
    doors[i].open = false;
  }

  // 小男孩：藏回风车里，重新等 15 秒再出来
  boy.x = BOY_DOOR_IN.x;
  boy.y = BOY_DOOR_IN.y;
  boy.state = "hidden";
  boy.wp = [];
  boy.wpIndex = 0;
  boy.appearAt = millis() + BOY_DELAY;

  buildLevel();
}

// ============================================================
// 绘制函数（只画画，不改逻辑）
// ============================================================

// ---------------- 开始界面 ----------------

function drawStartScreen() {
  background(30, 35, 60);

  fill(255, 210, 120);
  textAlign(CENTER, CENTER);
  textSize(48);
  text("小小窃贼：面包店之夜", CANVAS_W / 2, 150);

  fill(200, 200, 220);
  textSize(20);
  text("—— 致敬 Tiny Thief 面包店风车关卡 ——", CANVAS_W / 2, 205);

  fill(255);
  textSize(22);
  text("点击画布任意位置开始游戏", CANVAS_W / 2, 300);

  fill(180, 180, 200);
  textSize(16);
  text("开局：小偷藏在最左边的木箱里，厨师在左边房子的窗户里放派", CANVAS_W / 2, 370);
  text("点派走近再点一次拾取；点小偷把派放到身前；点小偷也可再拾起", CANVAS_W / 2, 400);
  text("拿着派靠近小男孩，点他头顶的白色圆圈可以把派送给他", CANVAS_W / 2, 430);
  text("偷走窗台上的派，厨师会出门巡逻——躲进木箱、木桶或房子里保命", CANVAS_W / 2, 460);
  text("点击关着的门：小偷会自动走过去开门进屋躲藏", CANVAS_W / 2, 490);
  text("双击画布进入 / 退出全屏", CANVAS_W / 2, 515);
}

// ---------------- 游戏画面 ----------------

function drawGame() {
  drawSkyAndGround();
  drawWindmill();
  drawBakery();      // 含开着的窗户 + 窗台
  drawHidingSpots(); // 木桶
  drawCrate();       // 木箱
  drawDoors();
  drawPie();         // 窗台上的派 / 地上的派
  drawBaker();       // 厨师（屋内自动被"挡住"，窗口只露上半身）
  drawThief();
  drawBoy();         // 小男孩（走出风车后一直站在风车最左侧）
  drawGivePie();     // 交派相关：头顶白色圆圈 + 胸前移动的派（画在人物之后，盖在上面）
  drawHintText();
  drawFeedback();
}

// 天空 + 地面（原有）
function drawSkyAndGround() {
  noStroke();
  fill(110, 160, 220);
  rect(0, 0, CANVAS_W, GROUND_TOP);

  fill(180, 140, 90);
  rect(0, GROUND_TOP, CANVAS_W, CANVAS_H - GROUND_TOP);

  stroke(120, 90, 55);
  strokeWeight(3);
  line(0, GROUND_TOP, CANVAS_W, GROUND_TOP);
  noStroke();
}

// 面包店：墙体 + 屋顶 + 窗户 + 招牌
function drawBakery() {
  // 屋顶
  fill(160, 70, 60);
  triangle(60, 200, 440, 200, 250, 120);

  // 墙体
  fill(225, 200, 160);
  rect(80, 200, 340, 180);

  // 右边的小窗户（原有样式保留）
  fill(140, 190, 220);
  rect(340, 240, 50, 40);
  stroke(90, 60, 40);
  strokeWeight(2);
  line(365, 240, 365, 280);
  line(340, 260, 390, 260);
  noStroke();

  // 开着的窗户（新增：厨师放派的窗口）
  drawOpenWindow();

  // 招牌
  fill(250, 245, 230);
  rect(190, 205, 120, 26);
  fill(200, 150, 90);
  ellipse(250, 218, 34, 16);
}

// 开着的窗户：深色洞口 + 向外张开的两扇窗板 + 窗台
function drawOpenWindow() {
  // 深色的窗洞（里面是屋内，暗暗的）
  fill(60, 45, 35);
  rect(openWindow.x, openWindow.y, openWindow.w, openWindow.h);

  // 向外张开的两扇窗板（斜着的四边形，表示"开着"）
  stroke(90, 60, 40);
  strokeWeight(2);
  fill(210, 180, 140);
  // 左扇
  quad(openWindow.x, openWindow.y + 4,
       openWindow.x - 22, openWindow.y + 10,
       openWindow.x - 22, openWindow.y + openWindow.h - 14,
       openWindow.x, openWindow.y + openWindow.h - 4);
  // 右扇
  quad(openWindow.x + openWindow.w, openWindow.y + 4,
       openWindow.x + openWindow.w + 22, openWindow.y + 10,
       openWindow.x + openWindow.w + 22, openWindow.y + openWindow.h - 14,
       openWindow.x + openWindow.w, openWindow.y + openWindow.h - 4);
  noStroke();

  // 窗框
  noFill();
  stroke(120, 85, 55);
  strokeWeight(3);
  rect(openWindow.x, openWindow.y, openWindow.w, openWindow.h);
  noStroke();

  // 窗台（派会放在这里）
  fill(150, 110, 70);
  rect(openWindow.x - 6, WINDOW_SILL_Y, openWindow.w + 12, 10);
}

// 静态风车（原有）
function drawWindmill() {
  fill(210, 195, 170);
  quad(650, 380, 760, 380, 745, 250, 665, 250);

  fill(150, 90, 70);
  arc(705, 250, 100, 40, PI, TWO_PI);

  var cx = 705;
  var cy = 240;

  stroke(90, 60, 40);
  strokeWeight(4);
  for (var i = 0; i < 4; i++) {
    var a = i * HALF_PI + 0.4;
    var len = 70;
    line(cx, cy, cx + cos(a) * len, cy + sin(a) * len);
    noStroke();
    fill(230, 220, 200);
    var ex = cx + cos(a) * len;
    var ey = cy + sin(a) * len;
    rect(ex - 5, ey - 5, 10, 18);
    stroke(90, 60, 40);
    strokeWeight(4);
  }
  noStroke();

  fill(70, 50, 35);
  circle(cx, cy, 12);
}

// 木桶躲藏点（原有）
function drawHidingSpots() {
  for (var i = 0; i < hidingSpots.length; i++) {
    var s = hidingSpots[i];
    fill(150, 100, 55);
    ellipse(s.x, s.y, s.r * 2, s.r * 1.6);
    fill(70, 45, 25);
    ellipse(s.x, s.y - s.r * 0.5, s.r * 1.5, s.r * 0.6);
    stroke(90, 60, 35);
    strokeWeight(2);
    noFill();
    ellipse(s.x, s.y, s.r * 2, s.r * 1.6);
    noStroke();
  }
}

// 木箱（新增）：最左边的藏身处
function drawCrate() {
  // 箱体
  fill(165, 115, 60);
  rect(crate.x, crate.y, crate.w, crate.h);
  // 箱板横纹
  stroke(120, 80, 40);
  strokeWeight(2);
  line(crate.x, crate.y + 14, crate.x + crate.w, crate.y + 14);
  line(crate.x, crate.y + 30, crate.x + crate.w, crate.y + 30);
  // 交叉加固条
  line(crate.x + 4, crate.y + 4, crate.x + crate.w - 4, crate.y + crate.h - 4);
  line(crate.x + crate.w - 4, crate.y + 4, crate.x + 4, crate.y + crate.h - 4);
  noStroke();
  // 外框
  noFill();
  stroke(100, 65, 32);
  strokeWeight(3);
  rect(crate.x, crate.y, crate.w, crate.h);
  noStroke();
}

// 门的绘制（原有）
function drawDoors() {
  for (var i = 0; i < doors.length; i++) {
    drawOneDoor(doors[i]);
  }
}

function drawOneDoor(d) {
  if (!d.open) {
    fill(120, 80, 50);
    rect(d.x, d.y, d.w, d.h);
    stroke(90, 55, 35);
    strokeWeight(2);
    line(d.x + d.w / 3, d.y, d.x + d.w / 3, d.y + d.h);
    line(d.x + d.w * 2 / 3, d.y, d.x + d.w * 2 / 3, d.y + d.h);
    noStroke();
    fill(240, 210, 120);
    circle(d.x + d.w - d.w / 4, d.y + d.h / 2, 7);
  } else {
    fill(40, 28, 20);
    rect(d.x, d.y, d.w, d.h);
    fill(120, 80, 50);
    rect(d.x + d.w, d.y, 12, d.h);
    fill(240, 210, 120);
    circle(d.x + d.w + 6, d.y + d.h / 2, 6);
  }
}

// 派的绘制：窗台上的 / 地上的（每个派独立画出，交派相关的派在 drawGivePie 里画）
function drawPie() {
  for (var i = 0; i < pies.length; i++) {
    var p = pies[i];
    if (p.location === "sill" || p.location === "ground") {
      drawPieAt(p.x, p.y);
    }
  }
}

// 交派相关的绘制（画在人物之后，保证盖在身上）：
//   1) 小偷拿着派靠近小男孩时 -> 小男孩头顶白色实心圆（比派大一点点，内含派图案）
//   2) 派在 handing / boy 状态 -> 派画在当前位置（小偷/小男孩胸前）
function drawGivePie() {
  // 先数一下已经交给小男孩的派有几个，用来把它们横向错开摆成一排
  var boyTotal = 0;
  for (var i = 0; i < pies.length; i++) {
    if (pies[i].location === "boy") {
      boyTotal = boyTotal + 1;
    }
  }

  // 逐个画出递送中的派和小男孩收下的派（互不影响）
  var boyIndex = 0;
  for (var j = 0; j < pies.length; j++) {
    var p = pies[j];
    if (p.location === "handing") {
      drawPieAt(p.x, p.y); // 正在飞过去的派，画在当前位置
    } else if (p.location === "boy") {
      // 已交给小男孩：以胸口为中心横向错开，每个派间隔 12 像素
      var ox = (boyIndex - (boyTotal - 1) / 2) * 12;
      drawPieAt(p.x + ox, p.y);
      boyIndex = boyIndex + 1;
    }
  }

  // 白色实心圆提示：圆心在小男孩头顶上方
  if (canShowGiveBubble()) {
    var bx = boy.x;
    var by = boy.y - 40;
    // 白色实心圆（直径 44，只比派大一圈）
    noStroke();
    fill(255);
    circle(bx, by, 44);
    // 圆里画一个派图案（复用画派的函数，稍小一号）
    drawPieAt(bx, by - 1);
    // 细描边让圆更醒目
    noFill();
    stroke(120, 90, 60);
    strokeWeight(2);
    circle(bx, by, 44);
    noStroke();
  }
}

// 画一个派
function drawPieAt(px, py) {
  // 派皮边缘
  fill(205, 140, 70);
  ellipse(px, py, 30, 16);
  // 派面
  fill(235, 185, 100);
  ellipse(px, py - 3, 24, 11);
  // 格子酥皮纹
  stroke(180, 120, 60);
  strokeWeight(1.5);
  line(px - 9, py - 6, px + 3, py - 2);
  line(px - 3, py - 8, px + 9, py - 4);
  noStroke();
}

// 厨师绘制：根据位置判断他此刻"能不能被看见"
// 在屋内远离窗户/门洞时被房子挡住，不画；
// 在窗户范围内只画上半身；在门洞或屋外画全身
function drawBaker() {
  var inDoorX = baker.x >= 210 && baker.x <= 270;
  if (baker.y >= 380 || inDoorX) {
    drawFullBaker();
    return;
  }
  if (abs(baker.x - WINDOW_CX) <= 38) {
    drawWindowBaker();
    return;
  }
  // 其余情况：被房子挡住，什么都不画
}

// 厨师全身（巡逻 / 门洞里时）
function drawFullBaker() {
  fill(245, 245, 245);
  rect(baker.x - 12, baker.y - 10, 24, 28);

  fill(240, 200, 160);
  circle(baker.x, baker.y - 20, 20);

  fill(255);
  rect(baker.x - 10, baker.y - 36, 20, 10);
  ellipse(baker.x, baker.y - 36, 24, 12);
}

// 厨师上半身（在窗户里时）：头 + 帽子 + 白围裙肩膀，下半身被窗台/房子挡住
function drawWindowBaker() {
  var bx = baker.x;
  // 肩膀/围裙（上半身）
  fill(245, 245, 245);
  rect(bx - 13, 302, 26, 30);
  // 头
  fill(240, 200, 160);
  circle(bx, 290, 22);
  // 厨师帽
  fill(255);
  rect(bx - 11, 278, 22, 9);
  ellipse(bx, 278, 26, 11);
}

// 小偷绘制（原有逻辑 + 木箱里的脑袋）
function drawThief() {
  // 躲在木箱里：只从箱口露出一个小脑袋
  if (thief.hidingInCrate) {
    fill(60, 60, 70);
    circle(thief.x, crate.y - 2, 14);
    fill(30, 30, 40);
    rect(thief.x - 6, crate.y - 4, 12, 4); // 眼罩
    return;
  }

  // 在房子里：图标完全消失（原有机制）
  if (thief.inHouse) {
    return;
  }

  // 木桶躲藏：只露一小截（原有机制）
  if (thief.hiding) {
    fill(60, 60, 70);
    circle(thief.x, thief.y - 4, 12);
    return;
  }

  // 正常状态：全身
  fill(50, 50, 65);
  rect(thief.x - 10, thief.y - 8, 20, 24);

  fill(230, 190, 150);
  circle(thief.x, thief.y - 18, 18);

  fill(30, 30, 40);
  rect(thief.x - 9, thief.y - 20, 18, 5);

  // 移动目标点标记
  if (thief.moving) {
    noFill();
    stroke(255, 255, 255, 120);
    strokeWeight(2);
    circle(thief.targetX, thief.targetY, 14);
    noStroke();
  }
}

// 顶部状态提示（含派的状态，新增）
function drawHintText() {
  fill(255);
  textAlign(LEFT, TOP);
  textSize(14);

  var stateText;
  if (thief.hidingInCrate) {
    stateText = "状态：藏在木箱里（厨师看不到你）";
  } else if (thief.inHouse) {
    stateText = "状态：躲在房子里（厨师看不到你，点击屋外可走出）";
  } else if (thief.hiding) {
    stateText = "状态：躲藏中（厨师看不到你）";
  } else {
    stateText = "状态：暴露中（小心厨师的巡逻视野！）";
  }
  text(stateText, 10, 8);

  // 厨师当前动态
  var bakerText;
  if (baker.state === "hidden" || baker.state === "waitingPickup" || baker.state === "waitingExit") {
    bakerText = "厨师：在房子里";
  } else if (baker.state === "toWindow" || baker.state === "passWindow" || baker.state === "leavingWindow") {
    bakerText = "厨师：在屋内走动";
  } else if (baker.state === "placing" || baker.state === "pausing") {
    bakerText = "厨师：在窗户边";
  } else if (baker.state === "exiting" || baker.state === "entering") {
    bakerText = "厨师：在门口";
  } else {
    bakerText = "厨师：巡逻中（小心！）";
  }
  text(bakerText, 10, 28);

  // 派的统计：每个派都是独立的，这里按位置分类计数展示
  var sillN = 0;    // 窗台上的
  var groundN = 0;  // 地上的
  var handN = 0;    // 递送中的
  var boyN = 0;     // 小男孩收下的
  for (var k = 0; k < pies.length; k++) {
    if (pies[k].location === "sill") {
      sillN = sillN + 1;
    } else if (pies[k].location === "ground") {
      groundN = groundN + 1;
    } else if (pies[k].location === "handing") {
      handN = handN + 1;
    } else if (pies[k].location === "boy") {
      boyN = boyN + 1;
    }
  }
  var pieText;
  if (hasCarriedPie()) {
    pieText = "派：小偷手里 1 个（点小偷放到身前；靠近小男孩可送给他）";
  } else {
    pieText = "派：小偷手里 0 个";
  }
  pieText = pieText + " ｜ 窗台 " + sillN +
            " ｜ 地上 " + groundN +
            " ｜ 递送中 " + handN +
            " ｜ 小男孩 " + boyN;
  text(pieText, 10, 48);

  // 小男孩的状态（新增）
  var boyText;
  if (boy.state === "hidden") {
    boyText = "小男孩：在风车里";
  } else if (boy.state === "exiting") {
    boyText = "小男孩：正走出风车";
  } else {
    boyText = "小男孩：站在风车左边";
  }
  text(boyText, 10, 68);
}

// 底部点击反馈文字（新增）：所有点击都会给出一句提示
function drawFeedback() {
  if (feedbackText === "" || millis() >= feedbackUntil) {
    return;
  }
  // 半透明深色底条，保证文字在地面颜色上也看得清
  fill(40, 30, 20, 180);
  rect(CANVAS_W / 2 - 170, 550, 340, 26, 6);
  fill(255, 240, 200);
  textAlign(CENTER, CENTER);
  textSize(14);
  text(feedbackText, CANVAS_W / 2, 563);
  textAlign(LEFT, TOP);
}

// ---------------- 失败界面（原有逻辑保留） ----------------

function drawCaughtScreen() {
  background(120, 30, 30);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(52);
  text("被抓住了！", CANVAS_W / 2, 240);

  fill(255, 220, 220);
  textSize(22);
  text("小偷被厨师发现了...", CANVAS_W / 2, 310);

  var alpha = 150 + sin(millis() / 300) * 100;
  fill(255, 255, 255, alpha);
  textSize(20);
  text("点击画布任意位置重试", CANVAS_W / 2, 390);
}

// ============================================================
// AIE1101 作业：致敬 Tiny Thief 面包店风车关卡（剧情版）
// 只用原生 p5.js，不加载任何外部图片 / 音频
//
// 功能总览：
//   1. 开始界面 -> 点击进入游戏；失败界面 -> 点击重置（原有逻辑保留）
//   2. 小偷：点击可行走区域平滑移动，不能穿墙（原有逻辑保留）；
//      路线固定成"竖直 -> 水平 -> 竖直"三段折线——先竖直走到小男孩所在的
//      那条水平线，再沿它左/右走到点击处所在的竖线，最后竖直走到点击处，
//      全程不会出现斜线（详细规则见 buildThiefPath）
//   3. 门：一键进门——点关着的门板，小偷走到门前自动开门走进去（原有逻辑保留）
//   4. 木箱躲藏：场景最左边一个木箱，开局小偷就藏在木箱里；
//      点击木箱进入/退出躲藏，躲藏时厨师看不见
//   4b. 草丛（新）：两栋房子之间那条长长的灌木丛（绿色云朵形状），
//      左沿是面包店右墙、右沿是风车左沿，比小偷稍微矮一点点。
//      点草丛 -> 小偷走过去钻进去；已经在里面时点草丛 = 在草丛里左右挪。
//      草丛画在小偷之后（盖在他上面），所以站在草丛里的部分全被遮住，
//      只从草丛顶上露出一小撮脑袋；人在草丛里时厨师看不见（等同躲藏）。
//      原来画面中间那个木桶（那个"洞"）已经删掉了。
//   5. 左边房子（面包店）有一扇开着的窗户；门右边有一个蓝色玻璃橱窗
//      （高脚托盘 + 三层蛋糕的深蓝色剪影）；
//      开局厨师在房子里（画面中不出现），房子里看不见屋外的小偷；
//      厨师在屋内走动时，只有经过放派的窗户或橱窗时才能被看到，
//      其他位置（包括门洞里）默认被房子遮挡；
//      被看到时按窗口矩形裁剪——走到窗边/离开窗边时，身体越过窗口边缘的
//      部分立刻被墙遮住，剩下的部分继续露在窗户里（不是整个人突然消失）
//   6. 剧情状态机：
//      开局 5 秒 -> 厨师上半身出现在窗户里放一个派 -> 离开窗户（仍被房子挡住）
//      窗台上的派被小偷拿走 -> 3 秒后厨师经过窗户（可见）停 1 秒
//        -> 走出门，直走到与小男孩同高的水平线
//        -> 沿这条线左右巡逻各两次（范围 = 房子左端到右端）
//        -> 走回屋里的门 -> 2 秒后又在窗户里放派 -> 循环
//      只要窗台上的派消失，就触发完全一样的行为
//      注意：每一个派都是独立对象（pies 数组），厨师放新派不会让
//      小偷手里 / 地上 / 小男孩手里的旧派消失
//   7. 派的交互：点派走近，再点派拾取；点小偷把派放到身前（地上）；
//      小偷拿着派靠近小男孩时，小男孩头顶出现白色实心圆（内含派图案），
//      点击圆圈 -> 小偷走到小男孩身前，把派交给他（派从小偷胸前移动到小男孩胸前）
//   8. 责骂结束：小男孩把怀里的派放到脚边地上，跑回风车，风车门在身后关上
//      （放下的派变回"地上"的派，小偷可以再捡走）
//   9. 偷橱窗蛋糕（新剧情）：厨师出门后、正往小男孩那边走（或已经骂起来）时，
//      点橱窗里的三层蛋糕 ->
//      小偷走到面包店门口、开门进屋、穿墙走到橱窗后面，
//      踮脚 + 轻微前倾 + 从身体里伸出两条很短的细手臂（只是示意，不必够到蛋糕），
//      手伸到的一刻蛋糕消失（托盘留在原地），
//      随后溜出店门。全过程只要厨师回到屋内（y < 380）就当场被抓
//  10. 发现蛋糕不见（新剧情）：厨师骂完人回到店里，如果橱窗里的蛋糕已经被偷，
//      他就不再回窗台放派了 —— 先走到橱窗玻璃后面看着空托盘，
//      头右上角冒 2 秒红色感叹号，然后直接出门，
//      在"面包店左墙 80 ~ 风车塔底右角 760"这整条街上来回不断巡逻，永不回家
//  11. 老鼠（新剧情）：小男孩把派丢在地上 3 秒后，一只老鼠从画面最右侧、
//      沿着小男孩那条水平线溜过来，停在派旁边啃派（身体轻微震动）；
//      点老鼠 -> 小偷走过去，伸出一只手臂把它连尾巴提起来，
//      老鼠在手里左右简谐摆动 1 秒（正好一个完整来回），
//      随后手臂和老鼠一起消失 —— 老鼠就到小偷手里了
//  12. 把老鼠放到窗台（新剧情）：小偷手里提着老鼠、走到左边房子那扇开着的
//      窗户附近时，窗户正上方冒出一个和小男孩头顶一样的白色实心圆，
//      只是圆里画的是老鼠；点它 -> 小偷走到窗下、抬手拎着老鼠的尾巴，
//      抬起手臂 -> 老鼠被甩出去、落到窗台上（从此坐在窗台上）
//  13. 厨师追老鼠（新剧情）：老鼠被甩到窗台上之后，只要厨师正在街上巡逻
//      （patrol / patrolAll）并且老鼠落在他面朝那一侧、距离 300px 内，
//      他就放弃水平巡逻，用更快的速度（2.6 px/帧）沿斜线直冲窗台；
//      冲到近处（60px）老鼠吓得从窗台跳下、贴着街面往左逃，
//      厨师也追着它一路跑出画面 —— 离开 15 秒后从画面左边走回来，继续巡逻
//  14. 所有点击都有底部文字反馈
//  15. 视野判定（被发现）：厨师在街上巡逻（patrol / patrolAll）时能看见小偷；
//      骂完小男孩转身回房子的路上（entering 的前半截、还在街面上平着走时）
//      也会回头张望 —— 此时小偷出现在他面朝的那一侧就同样被抓；
//      追老鼠的那段时间（chasingRat / chasingOut / offscreen / comingBack）
//      他眼里只有老鼠，不会顺带抓小偷
// ============================================================

// ---------------- 全局常量 ----------------
var CANVAS_W = 900;    // 画布宽度（像素）
var CANVAS_H = 600;    // 画布高度（像素）
var GROUND_TOP = 120;  // 地面开始的 y 坐标（上面是天空）
// 小偷每帧移动速度（像素/帧）。60fps 下 1 帧 = 16.67ms。
// 现在定成 3.23：从木箱 (50,542) 跑到"窗口前的落脚点"(135,398) 实测正好 72 帧 = 1.20 秒。
// 走的是"竖直 -> 水平 -> 竖直"的折线（见 buildThiefPath），实际路程
// 112 + 85 + 32 = 229px；理论值 229 / 70 帧 ≈ 3.27，但两个拐角各会"吸附"掉小半帧，
// 实测 3.23 刚好落在 72 帧上，所以取 3.23。
// 历史：1.33（按直线 167px / 2.10 秒算的）、1.45（和厨师同速）、1.2（和小男孩同速）。
var THIEF_SPEED = 3.23;
// 厨师移动速度（像素/帧）。原来 1.5，后调慢到 1.45。
// 现在小偷比厨师快得多（3.27 vs 1.45）—— 被发现时靠腿就能甩掉，
// 厨师的威胁变成"视野/突然转身"，而不是速度压制。
var BAKER_SPEED = 1.45;
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
  hiding: false,  // 最终躲藏状态（木箱 或 草丛，每帧重算）
  inHouse: false, // 是否在房子门洞里（厨师看不见，原有机制保留）
  hidingInCrate: false, // 是否躲在木箱里（由点击木箱切换）
  inBakery: false, // 是否正站在面包店里（偷蛋糕时，走到橱窗后面）
  inBush: false,   // 是否站在草丛里（草丛内可左右移动，且被草丛挡住 = 看不见）

  // 走路路径（全都是轴对齐的折线，见 buildThiefPath）：
  // path 是 {x,y} 队列，pathIndex 是当前要走的那个点
  path: [],
  pathIndex: 0,
  pathTx: null,   // 这条路径是走向哪个目标算出来的（目标一变就重算；null = 需要重算）
  pathTy: null,
  blockedFrames: 0 // 当前这段被墙挡住连续多少帧（挡住太久就放弃这一段）
};

// ---------------- 厨师对象 ----------------
// state 是剧情状态机的当前阶段（详见 updateBaker 的注释）
var baker = {
  x: 320,         // 开局藏在房子内部（被房子挡住，不画出来）
  y: 300,
  facing: 0,      // 面朝方向（弧度），巡逻时用于视野判定
  state: "hidden",     // 剧情阶段：hidden / toWindow / placing / leavingWindow /
                       // waitingPickup / waitingExit / passWindow / pausing /
                       // exiting / patrol / entering /
                       // noticing（发现蛋糕不见了，站橱窗前冒感叹号）/
                       // patrolAll（整条街无限来回巡逻，不再回家放派）
  wp: [],              // 当前阶段的路径点队列（依次走过去）
  wpIndex: 0,          // 正在走向第几个路径点
  stateTimer: 0,       // 停顿类阶段的截止时间（毫秒时间戳）；noticing 里 0 = 还没开始计时
  hiddenUntil: 5000,   // 藏在房子里的截止时间（开局 5 秒后去窗户，resetLevel 会重设）
  pendingExit: false,  // 窗台上的派被拿走后置为 true，触发"出门巡逻"剧情
  alerted: false,      // 是否已经为"蛋糕被偷"冒过感叹号（只冒一次，之后回屋直接出门）
  allRangePatrol: false // 出门后走的是"整条街"的无限巡逻（而不是原来那四段）
};

// ---------------- 剧情用常量（关键坐标） ----------------
// 厨师在房子内部移动用的几个点（画不出来，只用于状态机）
var BAKER_HIDE_X = 320;      // 屋内藏身处（房子深处，靠 state==="hidden" 不绘制来隐身）
var BAKER_WALK_Y = 300;      // 屋内水平移动的高度
var BAKER_DOOR_IN  = { x: 240, y: 345 }; // 面包店门洞内侧中心
var BAKER_DOOR_OUT = { x: 240, y: 402 }; // 门外落脚点（墙外）

// 巡逻参数：范围 = 左边房子左端到右端
// 巡逻高度不再写死，而是跟着小男孩的站立高度（见下方 PATROL_Y）
var PATROL_LEFT = 100;
var PATROL_RIGHT = 400;

// 全图巡逻范围（橱窗蛋糕被偷后进入）：从左边房子（面包店）的左墙外沿，
// 到右边房子（风车）塔底的右角，整条街来回不停。
// 数据源：drawBakery 的墙体 rect(80, 200, 340, 180) 左沿 = 80
//         drawWindmill 的塔底 quad(650, 380, 760, 380, ...) 右角 = 760
var FULL_PATROL_LEFT = 80;
var FULL_PATROL_RIGHT = 760;

// 发现橱窗蛋糕不见后，站在橱窗前冒红色感叹号的时长（毫秒）
var NOTICE_TIME = 2000;

// 剧情计时（毫秒）
var FIRST_PIE_DELAY = 5000;   // 开局到第一次窗口放派
var EXIT_DELAY = 3000;        // 派被拿走 -> 厨师出现在窗前（可见）的总时长（3 秒）
var WINDOW_PAUSE = 1000;      // 经过窗户时的停顿（1 秒）
var REENTER_DELAY = 2000;     // 进门到再次窗口放派
var PLACE_TIME = 1400;        // 在窗口放派停留的时间
var SCOLD_TIME = 15000;       // 责骂小男孩持续的时长（15 秒）
var SCOLD_TIME = 15000;       // 责骂小男孩的持续时间（15 秒）
var SCOLD_SWING_SPEED = 400;  // 锯齿线张角摆动的周期控制（毫秒）

// ---------------- 小男孩（新增） ----------------
// 开局 15 秒后从风车里走出来，站到风车最左侧，之后一直站在那里。
// 纯剧情角色：不和小偷、厨师发生任何交互（不算墙、不算躲藏点、不参与判定）
var BOY_DELAY = 15000; // 开局到小男孩出现的时间

var boy = {
  x: 705,             // 开局位置 = 风车门洞内侧中心（隐藏状态，不画出来）
  y: 360,
  state: "hidden",    // hidden = 藏在风车里 / exiting = 正在走出来 / standing = 站定
                      // returning = 被责骂后跑回风车 / inside = 已回到风车里（门已关）
  wp: [],             // 走出来的路径点队列
  wpIndex: 0,
  appearAt: 15000     // 什么时候走出来（resetLevel 会重设为开局时间 + 15 秒）
};

var BOY_SPEED = 1.2;     // 小男孩走得比大人慢一点
var BOY_RUN_SPEED = 2.8; // 被责骂后跑回风车的速度（比走路快得多）
// 走出来的三个关键点：门洞内侧 -> 门外落脚点 -> 风车最左侧的站位
var BOY_DOOR_IN  = { x: 705, y: 360 }; // 风车门洞内侧（门洞是 690~720 x 340~380）
var BOY_DOOR_OUT = { x: 705, y: 402 }; // 门外落脚点（风车墙底边 y=380 之外）
var BOY_STAND    = { x: 650, y: 430 }; // 站位：风车塔身最左边缘（塔底左角 x=650）

// 厨师巡逻的高度 = 小男孩站立的水平线（唯一数据源，改小男孩位置这里自动跟随）
// 出门后先沿门洞的竖直方向直下走到这条线，再在这条线上左右平行走动
var PATROL_Y = BOY_STAND.y;

// 小偷走路时先竖直对齐的那条水平线：和小男孩同高（与厨师巡逻线是同一个高度）
// 走法固定成「竖直 -> 水平 -> 竖直」，全程不出斜线
var THIEF_LANE_Y = BOY_STAND.y;

// ---------------- 小偷把派交给小男孩（新增） ----------------
// 前提：小偷已经拾取过派（hasCarriedPie，即某个派处于 carried 状态）
// 触发：小偷靠近小男孩一定距离 -> 小男孩头顶出现白色实心圆（内含派图案）
//       点击圆圈 -> 小偷走到小男孩身前 -> 派从小偷胸前移动到小男孩胸前
var BOY_GIVE_DIST   = 90;  // 小偷离小男孩多近时，头顶圆圈才会出现
var BOY_GIVE_CLICK_R = 26; // 点击头顶圆圈的判定半径（圆本身画直径 44）
var PIE_HAND_SPEED  = 2;   // 交派动画：派每帧移动的速度
var BOY_GIVE_SPOT   = { x: BOY_STAND.x - 34, y: BOY_STAND.y + 6 }; // 小偷交派站位（男孩身前左侧）
// 责骂时厨师站的位置：小男孩身前（左侧）一点（必须在 BOY_STAND 之后定义）
var BOY_SCOLD_SPOT  = { x: BOY_STAND.x - 42, y: BOY_STAND.y + 6 };

// 是否处于"点了圆圈、小偷正走去交派"的状态
var pendingGive = false;

// ---------------- 窗户、木箱、派 ----------------
// 开着的窗户（ replaces 原来左边的小窗户，就是厨师放派的窗口）
var openWindow = { x: 100, y: 240, w: 70, h: 100 };
var WINDOW_CX = openWindow.x + openWindow.w / 2; // 窗户中心 x = 135
var WINDOW_SILL_Y = openWindow.y + openWindow.h; // 窗台 y = 340

// 蓝色玻璃橱窗：在面包店门的右边，纯装饰
// 里面画着高脚托盘 + 托盘上三层蛋糕的深蓝色剪影，暂无任何交互
//
// 形状：横长方形（104 × 78，原来是 80 × 82 的近正方形，面积 6560 -> 8112）
// 位置：由两条"等距"要求推出来，不写死坐标 ——
//   水平：门右边沿(270) 到房子最右边界(420) 之间居中
//         -> 左右各留 (420-270-104)/2 = 23px
//   竖直：上方小窗户底边(280) 到房子底座/地面线(380) 之间居中
//         -> 上下各留 (380-280-78)/2 = 11px
// 注意：橱窗现在盖住了厨师的屋内藏身处（BAKER_HIDE_X = 320），
// 所以"藏在屋里"时由 drawBaker 按剧情状态直接不画，不再依赖 x 避开
var DISP_W = 104;           // 橱窗宽度
var DISP_H = 78;            // 橱窗高度
var DISP_GAP_LEFT   = 270;  // 左侧参照：面包店门洞右边缘（门洞 210~270）
var DISP_GAP_RIGHT  = 420;  // 右侧参照：房子（面包店墙体 80~420）最右边界
var DISP_GAP_TOP    = 280;  // 上侧参照：上方小窗户底边（小窗 340,240,50,40）
var DISP_GAP_BOTTOM = 380;  // 下侧参照：房子底座 = 地面线（墙体 200~380 的底边）
var displayWindow = {
  x: (DISP_GAP_LEFT + DISP_GAP_RIGHT) / 2 - DISP_W / 2,   // 293
  y: (DISP_GAP_TOP + DISP_GAP_BOTTOM) / 2 - DISP_H / 2,   // 291
  w: DISP_W,
  h: DISP_H
};
var DISP_CX = displayWindow.x + displayWindow.w / 2; // 橱窗中心 x = 345
var DISP_CY = displayWindow.y + displayWindow.h / 2; // 橱窗中心 y = 330

// ---------------- 橱窗里的三层蛋糕（新剧情道具） ----------------
// 厨师走到屋外、正往小男孩那边去的时候（出门中 / 走向男孩 / 正在骂），
// 玩家就可以点橱窗里的蛋糕：
// 小偷溜进店里、踮脚伸手把三层蛋糕拿走（蛋糕消失，托盘留在橱窗里）。
// 偷的过程中如果厨师回到屋内，他会看见小偷 —— 被抓。
var cake = { stolen: false };        // 蛋糕是否已经被偷走
var CAKE_STEAL_SPOT = { x: 378, y: 350 }; // 店里站位（蛋糕右侧，坐标=小偷胯部高度）
var CAKE_ANIM_TIME  = 1400;          // 踮脚 + 伸手的动画总时长（毫秒）
var CAKE_CATCH_RATIO = 0.7;          // 动画走到 70% 时蛋糕消失（手正好伸到）
var CAKE_TIPTOE_RISE = 4;            // 踮脚抬高多少像素
var CAKE_LEAN       = 5;             // 前倾（向左）多少像素
var CAKE_REACH      = 14;            // 双臂伸出多远（像素）：只是示意，不需要真的够到蛋糕

// 偷蛋糕的流程状态机
//   none      没在偷
//   toDoor    走向面包店门前
//   entering  门开了，走进门洞（门洞内侧）
//   walkIn    店里穿墙走到橱窗后面（这一段不能用碰撞，直接走）
//   stealing  踮脚 + 前倾 + 伸双臂（蛋糕在 70% 时消失）
//   leave     从橱窗后面走回门洞内侧
//   out       走出店门，站在门外
var cakeSteal = {
  phase: "none",
  startAt: 0,     // stealing 阶段的开始时间（毫秒时间戳）
  caughtAt: 0     // 蛋糕被拿走的时刻（用于反馈文字）
};

// ---------------- 老鼠（新剧情道具） ----------------
// 小男孩把派丢在地上 3 秒后，一只老鼠从画面最右侧、沿着小男孩那条水平线溜过来，
// 停在派旁边啃派（身体轻微震动）；这时点老鼠，小偷会走过去，
// 伸出一只手臂把老鼠连尾巴提起来，老鼠在手里左右简谐摆动 1 秒（一个完整来回），
// 随后手臂和老鼠一起消失 —— 老鼠就算到了小偷手里。
var RAT_DELAY      = 3000;  // 小男孩丢下派之后多久老鼠出现（毫秒）
var RAT_RUN_SPEED  = 2;     // 老鼠溜过来的速度（像素/帧）
var RAT_SIDE_GAP   = 24;    // 停在派右边多远开始啃（像素）
var RAT_CLICK_R    = 22;    // 点老鼠的判定半径
var RAT_STAND_GAP  = 34;    // 小偷去抓老鼠时站的位置（在老鼠右边这么远）
var RAT_REACH      = 62;    // 小偷离老鼠多近就能直接抓（否则先走过去）
var RAT_TAIL_LEN   = 16;    // 尾巴长度（手里到身体中心的距离）
var RAT_TAIL_TIP_DY = 6.2;  // 尾巴尖比尾巴根部高这么多（尾巴往上翘），提起来时用来对齐手
var RAT_SWING_AMP  = 0.5;   // 摆动幅度（弧度，约 29°）
var LIFT_TIME      = 1000;  // 提老鼠的动画时长 = 一个完整摆动周期（毫秒）

// 新剧情：把老鼠放到窗台上
// 小偷手里提着老鼠、靠近左边房子那扇开着的窗户时，窗户上方会冒出
// 和小男孩头顶一模一样的白色圆圈，只不过里面画的是老鼠而不是派；
// 点它 -> 小偷走到窗下、把手臂抬到水平，然后把老鼠甩上窗台。
var WINDOW_RAT_DIST     = 130;  // 小偷离窗户多近，圆圈才出现（像素）
var WINDOW_RAT_CLICK_R  = 26;   // 点圆圈的判定半径（圆圈直径 44，和小男孩那个一样）
var WINDOW_RAT_SPOT     = { x: WINDOW_CX, y: 398 }; // 窗下落脚点（和拿窗台派同一个位置）
var RAT_SILL_LIFT_TIME  = 420;  // 站在窗下把手臂抬到与身体垂直（90°）
var RAT_SILL_MOVE_TIME  = 520;  // 甩出去之后，老鼠飞向窗台落下的时间
var THIEF_BODY_W        = 20;   // 小偷躯干宽度（drawThief 里 rect 的宽）
var RAT_SILL_ARM_LEN    = THIEF_BODY_W; // 手臂长度 = 身体宽度，一条直线段
var RAT_SILL_ARC        = 46;   // 被甩出去时，轨迹向上拱起的高度

// 新剧情：厨师在街上巡逻时发现了窗台上的老鼠，冲过去把它吓跑
var RAT_SPOT_DIST       = 300;  // 厨师离窗台上的老鼠多近、且面朝那一侧，才算"看见"
var RAT_SPOT_DELAY      = 400;  // 老鼠刚落到窗台上，先愣 0.4 秒才可能被发现
var RAT_DIVE_DIST       = 60;   // 厨师冲到离老鼠这么近时，老鼠吓得跳下窗台
var BAKER_CHASE_SPEED   = 2.6;  // 追老鼠的速度（巡逻是 1.45，明显更快）
var RAT_FLEE_SPEED      = 3.8;  // 老鼠逃跑的速度（比厨师快，追不上）
var RAT_JUMP_TIME       = 320;  // 从窗台跳下来的动画时长
var RAT_JUMP_ARC        = 14;   // 跳下时先往上弹起的高度
var RAT_LEAP_X          = 90;   // 跳下窗台后的落点 x（窗台左下方的墙脚）
var RAT_FLEE_Y          = PATROL_Y; // 落地后贴着街面跑（和小男孩同一条水平线）
var CHASE_OFFSCREEN_X   = -40;  // 跑出画面左边缘的 x
var BAKER_OFFSCREEN_TIME = 15000; // 厨师追出画面后，过多久从左边回来（15 秒）

// ---------------- 逃跑 / 通关（新） ----------------
// 小偷拿到橱窗里的三层蛋糕之后，点画面最右边的那一条，他就抱着蛋糕从右边跑出画面 = 通关。
// 还没拿到蛋糕就点：只给一句提示，不许空手跑（否则这一局就白点了，场上也没人可操作）。
var EXIT_ZONE_W         = 70;   // 画面最右边这一竖条 = "溜走"按钮
var THIEF_ESCAPE_SPEED  = 3.4;  // 逃跑冲刺速度（比正常走路 3.23 稍快，看得出在跑）
var WIN_BOX_W           = 460;  // 通关方框尺寸
var WIN_BOX_H           = 330;

// 逃跑状态：active = 正在往画面右边冲（这一段不管墙、不管路径、也不会被厨师抓）
var escape = {
  active: false,
  startAt: 0
};
var winShownAt = 0;   // 通关方框"弹出来"的时刻（做一个小小的弹出动画）

// 老鼠的状态机
//   none     还没有老鼠
//   waiting  已经安排好，等着出场（小男孩丢下派后 3 秒）
//   coming   正从画面右侧溜向地上的派
//   eating   停在派旁边啃派（身体轻微震动，可点击）
//   walking  小偷正走过去准备抓它
//   lifting  被小偷提着尾巴，左右简谐摆动（1 秒）
//   carried  已经在小偷手里（不再画出来）
//   onSill   被放到窗户的窗台上了（坐在窗台上，不再跟着小偷）
//   diving   被厨师发现后从窗台跳下来（正在空中）
//   fleeing  落地后贴着街面往画面左边跑
//   gone     已经跑出画面（老鼠这条线结束）
var rat = {
  state: "none",
  x: 0,
  y: 0,          // 脚底（站立的那条线，和小男孩同高）
  targetX: 0,    // 要走到哪个 x 停下
  faceLeft: true,
  appearAt: 0,
  pie: null,     // 正在啃的那个派（对象引用，派被捡走也还留着位置）
  walkTargetX: 0,
  walkTargetY: 0,
  liftStart: 0,
  liftSide: -1,  // 手伸向哪边：-1 = 老鼠在小偷左侧
  sillAt: 0,     // 落到窗台上的时刻（用来先愣一下再被发现）
  jumpStart: 0,  // 跳下窗台的开始时刻
  jumpFromX: 0,
  jumpFromY: 0
};

// "把老鼠放到窗台上"的状态机
//   none     还没有这回事
//   walking  小偷正拎着老鼠走向窗下
//   lifting  站在窗下抬手，老鼠在手里晃
//   placing  老鼠脱手，沿一道弧线飞向窗台、落下
var ratSill = {
  phase: "none",
  startAt: 0,
  side: -1       // 手伸向哪边（朝窗户那一侧）
};

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
// 老鼠被放到窗台上之后坐的位置：往左偏一点，避免和窗台上的派叠在一起
// （rat.y 一贯表示"脚底那条线"，所以窗台面 340 对应 rat.y = 339）
var RAT_SILL_POS = { x: WINDOW_CX - 18, y: WINDOW_SILL_Y - 1 };
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
// 新增：厨师只有在"人在街上、眼睛朝着街道"时才看得见小偷
//       （state 为 patrol / patrolAll，或者 entering 里还没进门、平着走的那段）；
// 藏在房子里/窗口里/竖直钻进房门时，看不见屋外的小偷。
// 小偷这边不变：躲藏（木箱 / 草丛）或在房子门洞里，厨师都看不见。

// ---------------- 场景物体 ----------------
var walls = [];       // 墙体列表：{ x, y, w, h }
var hidingSpots = []; // 圆形躲藏点列表：{ x, y, r }
                      // （原来中间那个"洞"（木桶）已经删掉了，现在这个列表是空的；
                      //   躲藏改由两栋房子之间的长草丛负责，见下方 bush）

// ---------------- 草丛（新）：两栋房子之间那条长灌木丛 ----------------
// 位置：左沿 = 面包店右墙外沿（80 + 340 = 420），右沿 = 风车塔左沿（660），
//       底边压在地面高度 556 上（小偷站进去时脚正好踩在草丛底边）。
// 高度："比小偷稍微矮一点点" —— 小偷从脚底到头顶约 43px，草丛 36px，
//       所以只从他头顶露出一小撮，身体全被草丛挡住。
var BUSH_LEFT = 420;
var BUSH_RIGHT = 660;
var BUSH_BOTTOM = 556;             // 草丛底边
var BUSH_H = 36;                   // 草丛高度（比 43px 的小偷矮一点）
var BUSH_WALK_Y = BUSH_BOTTOM - 16; // 小偷在草丛里走动时用的基准 y（脚底 = y + 16）
var bush = {
  x: BUSH_LEFT,
  y: BUSH_BOTTOM - BUSH_H,         // 顶边 = 520
  w: BUSH_RIGHT - BUSH_LEFT,       // 宽 240
  h: BUSH_H
};
// 云朵状上沿的凸起：{ dx, r }，buildLevel 里按长度一次性铺好（固定值，不会每帧抖）
var BUSH_BUMPS = [];

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
  } else if (gameState === "win") {
    drawGame();      // 场景定格在"小偷跑出去"的那一帧
    drawWinScreen(); // 压暗 + 画面中央的通关方框
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

  // 原来这里有一个木桶（画面中间那个"洞"），已经删掉：
  // 现在两栋房子之间改放一条长草丛，既能躲也会挡住小偷（见 drawBush / checkHiding）
  buildBushBumps();
}

// 草丛上沿那些云朵状的凸起：按长度均匀铺一排大小略有变化的圆
// （用固定公式算，不用 random，免得每帧重算导致边缘抖动）
// 两端的圆往里收一点，保证草丛的整体长度正好是 BUSH_LEFT ~ BUSH_RIGHT
function buildBushBumps() {
  BUSH_BUMPS = [];
  var step = 22;
  var i = 0;
  for (var x = 20; x <= bush.w - 20; x += step) {
    var r = 17 + 3 * sin(i * 1.7);   // 14 ~ 20 之间
    var cx = constrain(x, r, bush.w - r);
    BUSH_BUMPS.push({ dx: cx, r: r });
    i++;
  }
}

// ============================================================
// 鼠标点击分发
// ============================================================

// ============================================================
// 鼠标事件入口（p5.js 会自动调用这两个函数）
// ============================================================

// 每次按下鼠标都会调用：把点击交给统一的分发函数处理
function mousePressed() {
  handleGameClick(mouseX, mouseY);
}

// 双击画布：进入 / 退出全屏
// （双击的第二次按下会在 handleGameClick 里被 400ms 过滤器拦掉，不会重复触发游戏逻辑）
function doubleClicked() {
  if (fullscreen()) {
    fullscreen(false);
  } else {
    fullscreen(true);
  }
}

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
    // 偷蛋糕进行中：这一小段时间由剧情接管，避免玩家乱点打断（蛋糕仍然可以点，用来提示）
    if (cakeSteal.phase !== "none") {
      if (!tryCakeClick(mx, my)) {
        showFeedback("小偷正在动手，先别乱点");
      }
      return;
    }
    // 画面最右边那一条 = "从右边溜走"，优先级最高（那一带本来也没有别的东西可点）
    if (tryExitClick(mx, my)) {
      return;
    }
    // 点击优先级：木箱 -> 老鼠 -> 派/小偷 -> 交派圆圈 -> 橱窗蛋糕 -> 门 -> 普通移动
    if (tryCrateClick(mx, my)) {
      return;
    }
    if (tryRatClick(mx, my)) {
      return;
    }
    if (tryPieClick(mx, my)) {
      return;
    }
    if (tryThiefClick(mx, my)) {
      return;
    }
    if (tryBushClick(mx, my)) {
      return;
    }
    if (tryRatSillClick(mx, my)) {
      return;
    }
    if (tryGivePieClick(mx, my)) {
      return;
    }
    if (tryCakeClick(mx, my)) {
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
  } else if (gameState === "win") {
    if (isSecondPress) {
      return;
    }
    // 通关界面：点击再来一局
    resetLevel();
    gameState = "play";
    showFeedback("这一票干得漂亮！再来一次？");
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

// ============================================================
// 逃跑 / 通关
//   拿到橱窗里的三层蛋糕之后，点画面最右边那一条 -> 小偷抱着蛋糕
//   从右边跑出画面 -> 通关（gameState = "win"，中央弹方框 + 蛋糕）。
//   没拿到蛋糕就点：只提示"先拿蛋糕"，小偷留在场上（不许空手跑）。
// ============================================================

// 点到画面最右边那一条了吗
function inExitZone(mx) {
  return mx >= CANVAS_W - EXIT_ZONE_W;
}

// 处理"点最右边想溜走"。返回 true 表示这次点击被消费
function tryExitClick(mx, my) {
  if (!inExitZone(mx)) {
    return false;
  }
  if (escape.active) {
    showFeedback("小偷正抱着蛋糕往画面外冲");
    return true;
  }
  if (!cake.stolen) {
    showFeedback("橱窗里的三层蛋糕还没到手，现在跑就白忙一趟");
    return true;
  }
  // 人不在街面上（躲着 / 在店里）时先别跑，否则会从墙里穿出去
  if (thief.inBakery) {
    showFeedback("先溜出面包店，站到街上再跑");
    return true;
  }
  if (thief.inHouse) {
    showFeedback("先走出房子再跑");
    return true;
  }
  if (thief.hidingInCrate) {
    showFeedback("先钻出木箱再跑");
    return true;
  }
  if (thief.inBush) {
    showFeedback("先从草丛里出来再跑");
    return true;
  }
  beginEscape();
  return true;
}

// 开始逃跑：清掉一切"正在做别的事"的排队动作，然后一路往右跑
function beginEscape() {
  escape.active = true;
  escape.startAt = millis();
  thief.hiding = false;
  thief.moving = false;        // 目标点标记别留在之前的落点上
  thief.targetX = thief.x;
  thief.targetY = thief.y;
  resetThiefPath();
  pendingDoorIndex = -1;
  pendingGive = false;
  showFeedback("小偷抱着三层蛋糕，撒腿往画面右边跑！");
}

// 逃跑中每帧推进一步：直线往右，跑出画面右边就是通关
function updateEscape() {
  thief.x = thief.x + THIEF_ESCAPE_SPEED;
  if (thief.x > CANVAS_W + 40) {
    escape.active = false;
    gameState = "win";         // 蛋糕已经得手 -> 胜利，游戏结束
    winShownAt = millis();
  }
}

function moveThief() {
  // 逃跑冲刺：抱着蛋糕往画面右边跑，不管墙也不管折线路径（这一段由 updateEscape 全权接管）
  if (escape.active) {
    updateEscape();
    return;
  }

  // 偷蛋糕的"店里"这一段要穿墙（橱窗后面本来就在墙里），
  // 由 updateCakeSteal 直接改坐标，这里跳过普通移动
  if (cakeSteal.phase === "walkIn" || cakeSteal.phase === "stealing" || cakeSteal.phase === "leave") {
    return;
  }

  // 目标一变（任何地方直接改 thief.targetX / targetY）就重算折线路径
  if (thief.pathTx === null || thief.targetX !== thief.pathTx || thief.targetY !== thief.pathTy) {
    thief.pathTx = thief.targetX;
    thief.pathTy = thief.targetY;
    thief.path = buildThiefPath(thief.targetX, thief.targetY);
    thief.pathIndex = 0;
    thief.blockedFrames = 0;
  }

  // 逐段推进：每一段只沿一个轴移动。走到点位那一帧只做"吸附"，不接着走下一段，
  // 这样任何一帧的画面位移都严格只在一个轴上（不会在拐角处出现小斜线）
  var guard = 0;
  while (thief.pathIndex < thief.path.length && guard < 8) {
    guard++;
    var t = thief.path[thief.pathIndex];
    var dx = t.x - thief.x;
    var dy = t.y - thief.y;
    var d = sqrt(dx * dx + dy * dy);

    if (d < THIEF_SPEED) {
      // 这一段的点到了：吸附上去，下一帧再走下一段
      thief.x = t.x;
      thief.y = t.y;
      thief.pathIndex = thief.pathIndex + 1;
      thief.blockedFrames = 0;
      break;
    }

    var stepX = (dx / d) * THIEF_SPEED;
    var stepY = (dy / d) * THIEF_SPEED;
    var beforeX = thief.x;
    var beforeY = thief.y;
    tryMoveThief(stepX, stepY);
    if (thief.x === beforeX && thief.y === beforeY) {
      // 撞墙：这一帧原地不动。连着卡住太久就放弃这一段，
      // 免得永远贴在某堵墙前面（正常路线不会触发，是兜底）
      thief.blockedFrames = thief.blockedFrames + 1;
      if (thief.blockedFrames > 20) {
        thief.pathIndex = thief.pathIndex + 1;
        thief.blockedFrames = 0;
      }
    } else {
      thief.blockedFrames = 0;
    }
    break;
  }

  if (thief.pathIndex >= thief.path.length) {
    thief.moving = false;
  }
}

// 把小偷的走路路线拆成折线（全程轴对齐，不出斜线）：
//   1. 竖直走到小男孩所在的那条水平线（THIEF_LANE_Y）
//   2. 沿这条线左/右走到点击处所在的竖直位置
//   3. 再竖直走到点击处
// 两个例外，避免"绕一大圈"看起来很傻：
//   · 已经和目标在同一条竖线上 -> 直接竖直走过去
//   · 起点和终点都在这条线下方（比如木箱旁的小挪动）-> 先竖直到目标高度，再水平过去
function buildThiefPath(tx, ty) {
  var path = [];
  if (abs(tx - thief.x) < 0.5) {
    path.push({ x: tx, y: ty });
  } else if (thief.y > THIEF_LANE_Y && ty > THIEF_LANE_Y) {
    path.push({ x: thief.x, y: ty });
    path.push({ x: tx, y: ty });
  } else {
    path.push({ x: thief.x, y: THIEF_LANE_Y });
    path.push({ x: tx, y: THIEF_LANE_Y });
    path.push({ x: tx, y: ty });
  }
  return path;
}

// 直接改坐标的地方（穿墙走、钻木箱）要把折线路径作废，下一帧按新目标重算
function resetThiefPath() {
  thief.path = [];
  thief.pathIndex = 0;
  thief.pathTx = null;
  thief.pathTy = null;
  thief.blockedFrames = 0;
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
    resetThiefPath(); // 位置是"瞬移"过去的，折线路径要作废
    pendingDoorIndex = -1;
    showFeedback("小偷躲进了木箱");
  }
  return true;
}

// ============================================================
// 草丛：点草丛 -> 小偷走进草丛；已经在里面时，点草丛左右挪
// 草丛里的位置统一吸附到 "BUSH_WALK_Y" 这条走动线上（深度固定，
// 这样他始终只从草丛顶端露出一点点脑袋），x 跟随点击位置
// ============================================================

// 草丛的点击框：比画出来的略微高一点，好点中
function bushClickRect() {
  return { x: bush.x, y: bush.y - 8, w: bush.w, h: bush.h + 14 };
}

function tryBushClick(mx, my) {
  if (!pointInRect(mx, my, bushClickRect())) {
    return false;
  }
  // 进草丛也算"离开木箱 / 放弃进门和送派"
  cancelCrateHiding();
  pendingDoorIndex = -1;
  pendingGive = false;

  var wasIn = thief.inBush;
  thief.targetX = constrain(mx, bush.x + 12, bush.x + bush.w - 12);
  thief.targetY = BUSH_WALK_Y;
  thief.moving = true;
  showFeedback(wasIn ? "小偷在草丛里挪了挪（还是看不见）" : "小偷钻进草丛，藏起来了");
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
// 新剧情：偷橱窗里的三层蛋糕
// 厨师走到屋外、正忙着往小男孩那边去的时候（见 isCakeChance：
// exiting 出门中 / toBoyScold 走向男孩 / scolding 正在骂），
// 点橱窗里的蛋糕 -> 小偷走到面包店门口、开门进屋、穿墙走到橱窗后面，
// 踮脚 + 轻微前倾 + 伸出双臂，70% 处蛋糕消失，然后溜出店门。
// 全过程只要厨师回到屋内（y < 380），就当场被发现。
// ============================================================

// 蛋糕在橱窗里的矩形（点击判定用，略微放宽一点好点中）
function getCakeRect() {
  var baseY = displayWindow.y + displayWindow.h - 12; // 托盘底座高度
  return { x: DISP_CX - 30, y: baseY - 58, w: 60, h: 64 };
}

// 现在是不是"偷蛋糕的机会窗口"：厨师已经出了门，并且正忙着往小男孩那边去
//   exiting     刚出门、正往街上走
//   toBoyScold  正走向小男孩（要去骂他）
//   scolding    已经骂起来了
// 原来只认 scolding，厨师一出门口玩家点蛋糕就会被拒（还提示"厨师还在店里"，
// 可他明明已经出来了）；现在没走到小男孩面前之前点也算数，第一次点就能
// 触发整条"进屋 -> 拿到蛋糕 -> 走出门"的流程。
function isCakeChance() {
  // 小偷要溜进店里，得趁厨师彻底走出房子之后（y >= 380 = 人已经在墙外）。
  // 他"正往门外走"的那一段还在屋里，小偷这时候钻进门会跟他撞个正着
  //（小偷速度 3.27 之后，从街上摸到店门只要 1 秒多，这个区别变得很关键）。
  if (baker.state === "exiting") {
    return baker.y >= 380;
  }
  return baker.state === "toBoyScold" || baker.state === "scolding";
}

// 点击橱窗里的蛋糕。返回 true 表示这次点击被蛋糕消费了
function tryCakeClick(mx, my) {
  if (!pointInRect(mx, my, getCakeRect())) {
    return false;
  }
  if (cake.stolen) {
    showFeedback("橱窗里的蛋糕已经被偷走了");
    return true;
  }
  if (cakeSteal.phase !== "none") {
    showFeedback("小偷正在动手，别急");
    return true;
  }
  if (!isCakeChance()) {
    // 厨师还在屋里、还在往门外走，或者正在门口那条街上来回巡逻
    if (baker.state === "exiting") {
      showFeedback("他还在往门外走，等他出了房子再动手");
    } else if (baker.state === "chasingRat" || baker.state === "chasingInside" ||
               baker.state === "chasingOut" || baker.state === "offscreen") {
      showFeedback("厨师正忙着追老鼠，现在没空管橱窗");
    } else if (baker.state === "patrol" || baker.state === "patrolAll") {
      showFeedback("厨师还在门口巡逻，等他往小男孩那边走过去再动手");
    } else {
      showFeedback("厨师还在店里，等他出去责骂小男孩时再来");
    }
    return true;
  }
  beginCakeSteal();
  return true;
}

// 开始偷蛋糕：先走向面包店门前（门关着的话到门口自动开）
function beginCakeSteal() {
  cakeSteal.phase = "toDoor";
  cakeSteal.startAt = 0;
  thief.inBakery = false;
  cancelCrateHiding();
  pendingDoorIndex = -1; // 别和"一键进门"流程打架
  pendingGive = false;
  thief.targetX = BAKER_DOOR_OUT.x;
  thief.targetY = BAKER_DOOR_OUT.y;
  thief.moving = true;
  showFeedback("趁厨师还没回头，小偷悄悄摸向面包店");
}

// 直线走一步（不做碰撞）：店里那段路本来就在墙里，只能用这个
function stepThiefTowards(tx, ty, speed) {
  resetThiefPath(); // 坐标被直接改了，折线队列作废
  var dx = tx - thief.x;
  var dy = ty - thief.y;
  var d = sqrt(dx * dx + dy * dy);
  if (d <= speed) {
    thief.x = tx;
    thief.y = ty;
    return true;
  }
  thief.x = thief.x + (dx / d) * speed;
  thief.y = thief.y + (dy / d) * speed;
  return false;
}

// 每帧推进偷蛋糕流程（放在 moveThief 之后调用）
function updateCakeSteal() {
  var now = millis();

  if (cakeSteal.phase === "toDoor") {
    // 走到门外落脚点 -> 开门 -> 走进门洞
    if (!thief.moving) {
      bakeryDoor.open = true;
      thief.targetX = BAKER_DOOR_IN.x;
      thief.targetY = BAKER_DOOR_IN.y;
      thief.moving = true;
      cakeSteal.phase = "entering";
      showFeedback("店门开了，小偷溜进面包店");
    }
    return;
  }

  if (cakeSteal.phase === "entering") {
    // 站到门洞内侧 -> 开始穿墙走向橱窗后面
    if (!thief.moving) {
      thief.inBakery = true;
      cakeSteal.phase = "walkIn";
    }
    return;
  }

  if (cakeSteal.phase === "walkIn") {
    if (stepThiefTowards(CAKE_STEAL_SPOT.x, CAKE_STEAL_SPOT.y, THIEF_SPEED)) {
      cakeSteal.phase = "stealing";
      cakeSteal.startAt = now;
      showFeedback("小偷踮起脚，伸手去够橱窗里的蛋糕");
    }
    return;
  }

  if (cakeSteal.phase === "stealing") {
    var p = (now - cakeSteal.startAt) / CAKE_ANIM_TIME;
    // 手伸到的那一刻蛋糕消失
    if (p >= CAKE_CATCH_RATIO && !cake.stolen) {
      cake.stolen = true;
      cakeSteal.caughtAt = now;
      showFeedback("三层蛋糕到手了！托盘空了");
    }
    if (now - cakeSteal.startAt >= CAKE_ANIM_TIME) {
      cakeSteal.phase = "leave";
      showFeedback("小偷抱着蛋糕往外溜");
    }
    return;
  }

  if (cakeSteal.phase === "leave") {
    // 从橱窗后面走回门洞内侧
    if (stepThiefTowards(BAKER_DOOR_IN.x, BAKER_DOOR_IN.y, THIEF_SPEED)) {
      thief.inBakery = false;
      cakeSteal.phase = "out";
      thief.targetX = BAKER_DOOR_OUT.x;
      thief.targetY = BAKER_DOOR_OUT.y;
      thief.moving = true;
    }
    return;
  }

  if (cakeSteal.phase === "out") {
    // 走出店门，流程结束
    if (!thief.moving) {
      bakeryDoor.open = false; // 顺手把门带上
      cakeSteal.phase = "none";
      showFeedback("小偷溜出店门，带着蛋糕躲回街角");
    }
  }
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
//   toBoyScold    巡逻中触发剧情：走向小男孩身前（要责骂他）
//   scolding      责骂小男孩（15 秒，头部前方有摇摆锯齿线 + 红色感叹号）
//   entering      巡逻完/责骂完走回房门进屋，然后等 REENTER_DELAY 再去窗户放派
//                 （在街面上平着走回门口的那段，回头看见小偷也算被抓，
//                   判定见 bakerWatchingStreet）
//   chasingRat    巡逻中看见窗台上的老鼠：斜线冲过去
//   chasingInside 端派时（toWindow / placing）撞见窗台上的老鼠：
//                 把派丢下，从房门冲出去（chasingOut 的前一段）
//   chasingOut    追着逃跑的老鼠跑向画面左边，老鼠跑没了就一路追出画面
//   offscreen     跑出画面，等 15 秒
//   comingBack    从画面左边走回来，然后接着巡逻
function updateBaker() {
  var now = millis();

  if (baker.state === "hidden") {
    // 藏在屋里等时间到（开局 5 秒 / 进门后 2 秒）
    if (now >= baker.hiddenUntil) {
      beginToWindow();
    }
  } else if (baker.state === "toWindow") {
    // 端着派往窗口走的路上，如果窗台上正坐着老鼠：派一丢，立刻改去追
    if (bakerSeesRatAtWindow()) {
      beginDropPieChase();
    } else if (moveAlongWaypoints()) {
      beginPlacing();
    }
  } else if (baker.state === "placing") {
    // 在窗口放派时撞见老鼠：手里的派丢下不管（已经放上窗台的那个就留在那儿），
    // 人跟着从房门冲出去
    if (bakerSeesRatAtWindow()) {
      beginDropPieChase();
    } else if (now >= baker.stateTimer) {
      // 放派停留一会儿
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
      if (baker.allRangePatrol) {
        beginPatrolAll();   // 蛋糕被偷之后：出门就一直走整条街
      } else {
        beginPatrol();
      }
    }
  } else if (baker.state === "noticing") {
    // 站在橱窗前看着空托盘：先走过去，站定后冒 2 秒红色感叹号
    if (baker.stateTimer === 0) {
      // 还在走向橱窗：走到的这一帧开始计时
      if (moveAlongWaypoints()) {
        baker.stateTimer = millis() + NOTICE_TIME;
      }
    } else if (now >= baker.stateTimer) {
      // 感叹完直接出门，之后整条街循环巡逻（不再回家放派）
      beginExitingAll();
    }
  } else if (baker.state === "patrolAll") {
    // 整条街无限来回：仍然会顺手责骂拿着派的小男孩，
    // 但走完一趟不会回家放派，而是掉头继续走
    if (bakerCanSpotRat()) {
      beginChaseRat();          // 先看见窗台上的老鼠：扔下巡逻去追
    } else if (canStartScold()) {
      beginToBoyScold();
    } else if (moveAlongWaypoints()) {
      // 到这一端了：掉头走向另一端（队列里始终只有一个目标，永不结束）
      var nextX = (baker.x > (FULL_PATROL_LEFT + FULL_PATROL_RIGHT) / 2)
        ? FULL_PATROL_LEFT
        : FULL_PATROL_RIGHT;
      baker.wp = [{ x: nextX, y: PATROL_Y }];
      baker.wpIndex = 0;
    }
  } else if (baker.state === "patrol") {
    // 巡逻中每帧检查两件事（老鼠优先于责骂）
    if (bakerCanSpotRat()) {
      beginChaseRat();          // 看见窗台上的老鼠：斜线冲过去
    } else if (canStartScold()) {
      // 触发"责骂小男孩"剧情（三条件同时满足）
      beginToBoyScold();
    } else if (moveAlongWaypoints()) {
      beginEntering();
    }
  } else if (baker.state === "chasingRat") {
    // 沿斜线用更快的速度直冲窗台；冲到近处老鼠就跳下来
    var arrived = moveAlongWaypoints(BAKER_CHASE_SPEED);
    if (rat.state === "onSill" && distToRat() <= RAT_DIVE_DIST) {
      beginRatDive();
    } else if (arrived) {
      // 老鼠已经不在窗台上了（比如被别的操作带走），直接转成"追出去"
      beginChaseOut();
    }
  } else if (baker.state === "chasingInside") {
    // 从窗户边一路冲出房门（这段也用追的速度，看起来就是"撂下派就走"）
    if (moveAlongWaypoints(BAKER_CHASE_SPEED)) {
      beginChaseOut();          // 出了门就交给"追出去"接着往画面左边跑
    }
  } else if (baker.state === "chasingOut") {
    // 追着逃跑的老鼠往画面左边跑；老鼠跑没了就一路追出画面
    var chaseX = (rat.state === "diving" || rat.state === "fleeing") ? rat.x : CHASE_OFFSCREEN_X;
    var chaseY = (rat.state === "diving" || rat.state === "fleeing") ? rat.y : PATROL_Y;
    moveBakerStraight(chaseX, chaseY, BAKER_CHASE_SPEED);
    if (baker.x <= CHASE_OFFSCREEN_X) {
      beginBakerOffscreen();
    }
  } else if (baker.state === "offscreen") {
    // 已经跑出画面：等 15 秒再从左边回来
    if (now >= baker.stateTimer) {
      beginBackFromLeft();
    }
  } else if (baker.state === "comingBack") {
    // 从画面左边走进来，走到街面上之后接着巡逻
    if (moveAlongWaypoints()) {
      if (baker.allRangePatrol) {
        beginPatrolAll();
      } else {
        beginPatrol();
      }
    }
  } else if (baker.state === "toBoyScold") {
    // 正在走向小男孩身前
    if (moveAlongWaypoints()) {
      beginScolding();
    }
  } else if (baker.state === "scolding") {
    // 责骂中：一直面向右边，到时间后左转返回房子
    baker.facing = 0; // 0 弧度 = 面朝右
    if (now >= baker.stateTimer) {
      // 剧情收尾：小男孩把派放到地上、跑回风车、门在身后关上
      beginBoyReturn();
      // 返回房子：复用"巡逻完回家"的流程（开门 -> 走进屋 -> 关门 -> 再放派）
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
// speed 可选：不传就用巡逻速度 BAKER_SPEED，追老鼠时传 BAKER_CHASE_SPEED
function moveAlongWaypoints(speed) {
  var sp = (speed === undefined) ? BAKER_SPEED : speed;
  if (baker.wpIndex >= baker.wp.length) {
    // 队列已经走空：再被调用就当"走完了"处理，不要返回 true 后又去读 wp[i]；
    // 这样即使某个阶段站定后仍在每帧调用本函数，也只是空转，不会崩
    return true;
  }
  var t = baker.wp[baker.wpIndex];
  var dx = t.x - baker.x;
  var dy = t.y - baker.y;
  var dist = sqrt(dx * dx + dy * dy);

  if (dist < sp) {
    baker.x = t.x;
    baker.y = t.y;
    baker.wpIndex = baker.wpIndex + 1;
    if (baker.wpIndex >= baker.wp.length) {
      return true; // 这一阶段的路走完了
    }
    return false;
  }
  baker.facing = atan2(dy, dx);
  baker.x = baker.x + (dx / dist) * sp;
  baker.y = baker.y + (dy / dist) * sp;
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
  // EXIT_DELAY 是"派被拿走 -> 他在窗前露头"的总时长（3 秒）。
  // 但玩家真正看见他，还得先让他在屋内从藏身处走到窗前（185px，约 2.1 秒），
  // 所以把这段走路时间从总时长里扣掉，剩下的才是"待在屋里不动"的等待。
  // 这样玩家数出来的是整整 3 秒，而不是 3 秒 + 走路时间（原来 5 秒 + 2.1 秒 ≈ 7.1 秒）。
  var walkMs = abs(WINDOW_CX - BAKER_HIDE_X) / BAKER_SPEED * (1000 / 60);
  baker.stateTimer = millis() + Math.max(EXIT_DELAY - walkMs, 0);
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
  // 出门路线：屋内门洞内侧 -> 走出房门 -> 沿门洞的竖直方向直下到巡逻高度
  // （出门这一段是"直走"：先竖直向前走出门，再竖直向下走到小男孩所在水平线，
  //   不含任何斜线；之后 beginPatrol 才在这条水平线上左右走）
  baker.wp = [
    BAKER_DOOR_IN,
    BAKER_DOOR_OUT,
    { x: BAKER_DOOR_OUT.x, y: PATROL_Y }
  ];
  baker.wpIndex = 0;
}

function beginPatrol() {
  baker.state = "patrol";
  // 左右巡逻各两次：右 -> 左 -> 右 -> 左
  // 四个点都在 PATROL_Y 这条水平线上，所以每一段都是平行于地面的直线
  baker.wp = [
    { x: PATROL_RIGHT, y: PATROL_Y },
    { x: PATROL_LEFT,  y: PATROL_Y },
    { x: PATROL_RIGHT, y: PATROL_Y },
    { x: PATROL_LEFT,  y: PATROL_Y }
  ];
  baker.wpIndex = 0;
}

// 整条街的无限巡逻：从当前这端走向另一端，到了就掉头，永远不停
// （区别只在范围：80 ~ 760，而不是原来房子正面的 100 ~ 400）
function beginPatrolAll() {
  baker.state = "patrolAll";
  baker.allRangePatrol = true;
  // 队列里只放一个目标；走完后在 updateBaker 里换成相反的那一端
  var firstX = (baker.x > (FULL_PATROL_LEFT + FULL_PATROL_RIGHT) / 2)
    ? FULL_PATROL_LEFT
    : FULL_PATROL_RIGHT;
  baker.wp = [{ x: firstX, y: PATROL_Y }];
  baker.wpIndex = 0;
  showFeedback("厨师开始沿线来回巡逻，不再回店里放派了");
}

// 出门，并且出门后走"整条街"的无限巡逻（蛋糕被偷之后的专用出口）
function beginExitingAll() {
  beginExiting();          // 复用同一套直角出门路线（开门 -> 门内 -> 门外 -> 降到巡逻线）
  baker.allRangePatrol = true; // 标记：exiting 走完后进 beginPatrolAll
}

// ============================================================
// 新剧情：厨师巡逻时发现窗台上的老鼠
//   巡逻中（patrol / patrolAll）看见窗台上的老鼠 -> 停下滑稽的水平巡逻，
//   用更快的速度沿斜线直冲窗台 -> 冲到近处老鼠跳下窗台往左逃 ->
//   厨师追着它跑出画面 -> 15 秒后从左边走回来，继续巡逻
// ============================================================

// 厨师到那只老鼠的直线距离
function distToRat() {
  var dx = rat.x - baker.x;
  var dy = rat.y - baker.y;
  return sqrt(dx * dx + dy * dy);
}

// 老鼠是不是正坐在窗台上、而且已经坐稳了（刚落到那 0.4 秒先愣着，还没被发现）
function ratSettledOnSill() {
  return rat.state === "onSill" && millis() - rat.sillAt >= RAT_SPOT_DELAY;
}

// 厨师此刻能不能看见窗台上的老鼠
//   1) 只在街上巡逻时（patrol / patrolAll）才可能看见
//   2) 老鼠必须坐在窗台上，并且已经坐稳了 0.4 秒
//   3) 老鼠得在他面朝的那一侧（和看小偷用同一条半平面规则）
//   4) 距离在 RAT_SPOT_DIST 之内
function bakerCanSpotRat() {
  if (baker.state !== "patrol" && baker.state !== "patrolAll") {
    return false;
  }
  if (!ratSettledOnSill()) {
    return false;
  }
  var facingX = cos(baker.facing);
  if (abs(facingX) < 0.2) {
    return false;   // 正在竖直走，左右都没在看
  }
  if (facingX < 0 ? rat.x >= baker.x : rat.x <= baker.x) {
    return false;   // 老鼠在他背后
  }
  return distToRat() <= RAT_SPOT_DIST;
}

// 另一种"撞见"：他正在屋里端派（toWindow 走向窗口 / placing 在窗口放派），
// 走到窗口跟前就看见窗台上坐着的老鼠。
// 这段时间他手上/眼前就是这个窗口，所以不用看朝向，只要求走到窗口跟前
// （人的半边身子（13px）压在窗洞右沿（170）外就是"到窗口了"= 135 + 48 左右，
//   所以判定半径取 50：还没走到窗口、隔着一堵墙是看不见窗台上的东西的）。
function bakerSeesRatAtWindow() {
  if (baker.state !== "toWindow" && baker.state !== "placing") {
    return false;
  }
  if (!ratSettledOnSill()) {
    return false;
  }
  return abs(baker.x - WINDOW_CX) <= 50;
}

// 第一步：放弃水平巡逻，斜线直冲窗台正下方
function beginChaseRat() {
  baker.state = "chasingRat";
  baker.wp = [{ x: RAT_SILL_POS.x + 8, y: 380 }]; // 墙根那条线（不会再往墙里走）
  baker.wpIndex = 0;
  showFeedback("厨师看见了窗台上的老鼠，冲了过去！");
}

// 老鼠从窗台上跳下来的那一瞬间（只改老鼠；厨师怎么反应由调用方决定）
function startRatDive() {
  rat.state = "diving";
  rat.jumpStart = millis();
  rat.jumpFromX = rat.x;
  rat.jumpFromY = rat.y;
  rat.faceLeft = true;
}

// 第二步：老鼠吓得跳下窗台（同时厨师转为"追出去"）
function beginRatDive() {
  startRatDive();
  showFeedback("老鼠吓得从窗台上跳了下来！");
  beginChaseOut();
}

// 端派时撞见窗台上的老鼠（toWindow / placing）：
//   手里那个派就丢下不管了（这一趟不再往窗台上放派），
//   老鼠照样吓得跳下窗台往画面左边跑；厨师改成从房门冲出来追。
function beginDropPieChase() {
  startRatDive();
  baker.state = "chasingInside";
  bakeryDoor.open = true;                 // 自己推门出去
  baker.wp = [
    BAKER_DOOR_IN,
    BAKER_DOOR_OUT,
    { x: BAKER_DOOR_OUT.x, y: PATROL_Y }
  ];
  baker.wpIndex = 0;
  showFeedback("厨师把派一丢：窗台上怎么坐着只老鼠！");
}

// 第三步：厨师追着老鼠往画面左边跑
function beginChaseOut() {
  baker.state = "chasingOut";
  baker.wp = [];
  baker.wpIndex = 0;
}

// 朝某个点直线走（追老鼠用：每帧重新对准目标，路径就是一条斜线）
function moveBakerStraight(tx, ty, speed) {
  var dx = tx - baker.x;
  var dy = ty - baker.y;
  var d = sqrt(dx * dx + dy * dy);
  if (d < 0.0001) {
    return true;
  }
  baker.facing = atan2(dy, dx);
  var step = speed < d ? speed : d;
  baker.x = baker.x + (dx / d) * step;
  baker.y = baker.y + (dy / d) * step;
  return d <= speed;
}

// 第四步：厨师也追出了画面，开始计 15 秒
function beginBakerOffscreen() {
  baker.state = "offscreen";
  baker.stateTimer = millis() + BAKER_OFFSCREEN_TIME;
  baker.x = CHASE_OFFSCREEN_X - 10;
  baker.y = PATROL_Y;
  baker.facing = PI;            // 脸朝左（追着老鼠跑掉的方向）
  if (rat.state === "diving" || rat.state === "fleeing") {
    rat.state = "gone";         // 老鼠也一起跑没了
  }
  showFeedback("厨师追着老鼠跑出了画面……");
}

// 第五步：15 秒后从画面左边走回来
function beginBackFromLeft() {
  baker.state = "comingBack";
  baker.x = CHASE_OFFSCREEN_X - 10;
  baker.y = PATROL_Y;
  baker.facing = 0;
  baker.wp = [{ x: FULL_PATROL_LEFT, y: PATROL_Y }];
  baker.wpIndex = 0;
  showFeedback("过了好一会儿，厨师从街那头走回来了");
}

function beginEntering() {
  baker.state = "entering";
  // 回屋前自己把门打开（也许被小偷关上了）
  bakeryDoor.open = true;
  // 回屋路线：先在巡逻线上平行走回门口正下方 -> 竖直向上走进门洞
  // （同样不含斜线，和出门的直角路线对称）
  baker.wp = [
    { x: BAKER_DOOR_OUT.x, y: PATROL_Y },
    BAKER_DOOR_OUT,
    BAKER_DOOR_IN
  ];
  baker.wpIndex = 0;
  // 立刻把脸转向要走的那个方向（否则"转身"的第一帧脸还朝着小男孩那边，
  // 会被视野判定误当成"面朝右边"，把身后的小偷也算进来）
  var turnDx = baker.wp[0].x - baker.x;
  var turnDy = baker.wp[0].y - baker.y;
  if (turnDx * turnDx + turnDy * turnDy > 0.0001) {
    baker.facing = atan2(turnDy, turnDx);
  }
}

function beginHiddenAfterPatrol() {
  // 蛋糕已经被偷了：厨师彻底离开"端派循环"，再也不去窗台放派
  if (cake.stolen) {
    if (!baker.alerted) {
      // 第一次发现：走到橱窗前，看着空托盘冒红色感叹号（2 秒），然后出门
      beginNoticingCake();
    } else {
      // 已经感叹过了（比如又去责骂了一次小男孩才回屋）：不再感叹，直接出门继续巡逻
      beginExitingAll();
    }
    return;
  }

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

// 发现蛋糕不见了：走到橱窗玻璃后面，站定后冒 2 秒红色感叹号，再出门巡逻
function beginNoticingCake() {
  baker.state = "noticing";
  baker.stateTimer = 0;        // 0 = 还没站定，不计时
  baker.wp = [{ x: DISP_CX, y: BAKER_WALK_Y }];
  baker.wpIndex = 0;
  baker.alerted = true;        // 只冒一次感叹号
  // 顺手关门（小偷在门洞里就不关，免得把人关进墙里）
  if (!isThiefInRect(houseInteriors[0])) {
    bakeryDoor.open = false;
  }
  showFeedback("厨师回到店里，发现橱窗里的蛋糕不见了！");
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

// ---- 责骂小男孩的剧情（新增） ----

// 巡逻中是否触发责骂剧情：三个条件必须同时满足
//   1) 窗台上没有派
//   2) 厨师正面向右，且小男孩在他右侧视野里（小男孩已站定在屋外）
//   3) 小男孩手里有至少一个派
function canStartScold() {
  // 条件一：窗台上没有派
  for (var i = 0; i < pies.length; i++) {
    if (pies[i].location === "sill") {
      return false;
    }
  }
  // 条件二：小男孩已站定、厨师面向右、男孩在厨师右侧（半平面检查）
  if (boy.state !== "standing") {
    return false;
  }
  if (cos(baker.facing) < 0) {
    return false; // 厨师没有向右转
  }
  if (boy.x <= baker.x) {
    return false; // 小男孩不在厨师右侧
  }
  // 条件三：小男孩手里有派
  for (var j = 0; j < pies.length; j++) {
    if (pies[j].location === "boy") {
      return true;
    }
  }
  return false;
}

// 责骂剧情第一步：暂停巡逻，走到小男孩身前（男孩左侧 60 像素，不重叠）
function beginToBoyScold() {
  baker.state = "toBoyScold";
  baker.wp = [{ x: boy.x - 60, y: PATROL_Y }];
  baker.wpIndex = 0;
  // 剩下的巡逻路径点直接作废（责骂完直接回家，不再继续巡逻）
  showFeedback("厨师发现了拿着派的小男孩，走过去责骂他！");
}

// 责骂剧情第二步：站定开骂，持续 15 秒，期间一直面向右边
function beginScolding() {
  baker.state = "scolding";
  baker.stateTimer = millis() + SCOLD_TIME;
  baker.facing = 0; // 面朝右
  showFeedback("厨师正在责骂小男孩！");
}

// ============================================================
// 小男孩剧情（新增）：开局 15 秒后走出风车，站到风车最左侧；
// 被厨师责骂完后把派放到地上，跑回风车，门在身后关上
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
  } else if (boy.state === "returning") {
    // 被责骂后跑回风车：用跑的速度走完 BOY_DOOR_OUT -> BOY_DOOR_IN
    if (moveBoyAlongWaypoints(BOY_RUN_SPEED)) {
      boy.state = "inside";
    }
  } else if (boy.state === "inside") {
    // 已经进屋：门在身后关上（小偷正好站在门洞里就先等等，下一帧再试）
    tryCloseWindmillDoor();
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

// ---------------- 责骂之后的收尾：放下派 -> 跑回风车 -> 关门 ----------------

// 被责骂完之后：小男孩把怀里的派放到脚边地上，然后跑回风车
function beginBoyReturn() {
  if (boy.state !== "standing") {
    return; // 还没站定（理论上责骂触发时一定已站定，这里只做防御）
  }
  dropBoyPies();                // 先把派放到地上
  scheduleRat();                // 3 秒后会有一只老鼠来啃这些派
  boy.state = "returning";
  windmillDoor.open = true;     // 自己家的门，自己开门进屋
  boy.wp = [BOY_DOOR_OUT, BOY_DOOR_IN];
  boy.wpIndex = 0;
  showFeedback("小男孩把派放在了地上，跑回风车去了");
}

// 把"已经交给小男孩"的派全部放到他脚边地上（每个派独立，横向错开摆成一排）
// 正在递送中的派也一并放下（否则它会一直追着跑走的小男孩，最后飘进风车里）
function dropBoyPies() {
  var list = [];
  for (var i = 0; i < pies.length; i++) {
    if (pies[i].location === "boy" || pies[i].location === "handing") {
      list.push(pies[i]);
    }
  }
  for (var j = 0; j < list.length; j++) {
    var ox = (j - (list.length - 1) / 2) * 22; // 以小男孩为中心左右排开
    list[j].location = "ground";               // 变成地上可再次拾取的派
    list[j].x = constrain(boy.x + ox, 20, CANVAS_W - 20);
    list[j].y = boy.y + 4;                     // 贴在他脚边的地面上
  }
}

// 小男孩进屋后把风车门关上
// 小偷正好站在门洞里就先不关（否则会把人关死在墙里），下一帧继续尝试
function tryCloseWindmillDoor() {
  if (isThiefInRect(houseInteriors[1])) {
    return;
  }
  windmillDoor.open = false;
}

// 通用移动：依次走 boy.wp 里的路径点，全部走完返回 true
// speed 不传时用走路速度 BOY_SPEED，跑回去时传 BOY_RUN_SPEED
function moveBoyAlongWaypoints(speed) {
  var sp = speed || BOY_SPEED;
  var t = boy.wp[boy.wpIndex];
  var dx = t.x - boy.x;
  var dy = t.y - boy.y;
  var dist = sqrt(dx * dx + dy * dy);

  if (dist < sp) {
    boy.x = t.x;
    boy.y = t.y;
    boy.wpIndex = boy.wpIndex + 1;
    if (boy.wpIndex >= boy.wp.length) {
      return true; // 走完了
    }
    return false;
  }
  boy.x = boy.x + (dx / dist) * sp;
  boy.y = boy.y + (dy / dist) * sp;
  return false;
}

// 小男孩的绘制：站在门外之后一直画出来
function drawBoy() {
  // 藏在风车里 / 已经跑回风车里：都不画
  if (boy.state === "hidden" || boy.state === "inside") {
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
// 老鼠（新剧情）：丢下派 3 秒后从最右侧溜过来啃派 -> 小偷提走它
// 和厨师/小男孩一样用"状态机 + 每帧推进"，不参与碰撞、不算墙
// ============================================================

// 找一个可以啃的地上的派（取最靠右的那个 —— 老鼠就是从右边过来的）
function findRatPie() {
  var best = null;
  for (var i = 0; i < pies.length; i++) {
    if (pies[i].location !== "ground") {
      continue;
    }
    if (best === null || pies[i].x > best.x) {
      best = pies[i];
    }
  }
  return best;
}

// 小男孩丢下派的那一刻调用：安排一只老鼠 3 秒后出场
// 一个派都没掉下来就不安排（没有吃的，老鼠不会来）
function scheduleRat() {
  var p = findRatPie();
  if (p === null) {
    return;
  }
  rat.state = "waiting";
  rat.pie = p;
  rat.x = CANVAS_W + 14;          // 先藏在画面右侧外面
  rat.y = BOY_STAND.y + 8;        // 和小男孩同一条水平线（脚踩在上面）
  rat.targetX = p.x + RAT_SIDE_GAP;
  rat.faceLeft = true;
  rat.appearAt = millis() + RAT_DELAY;
}

// 老鼠每帧更新（在 updateGame 里调用）
function updateRat() {
  var now = millis();

  if (rat.state === "none") {
    return;
  }

  if (rat.state === "waiting") {
    if (now >= rat.appearAt) {
      rat.state = "coming";
      showFeedback("一只老鼠从右边溜过来，盯上了地上的派");
    }
    return;
  }

  if (rat.state === "coming") {
    // 朝目标 x 直线走过去（只沿水平线，不拐弯）
    var dir = rat.targetX > rat.x ? 1 : -1;
    rat.faceLeft = (dir < 0);
    rat.x = rat.x + dir * RAT_RUN_SPEED;
    if ((dir < 0 && rat.x <= rat.targetX) || (dir > 0 && rat.x >= rat.targetX)) {
      rat.x = rat.targetX;
      rat.state = "eating";
    }
    return;
  }

  if (rat.state === "eating") {
    // 正在啃的那个派被小偷捡走了：换一个地上的派继续啃（没有就原地待着）
    if (rat.pie !== null && rat.pie.location !== "ground") {
      var next = findRatPie();
      if (next !== null && next !== rat.pie) {
        rat.pie = next;
        rat.targetX = next.x + RAT_SIDE_GAP;
        if (abs(rat.targetX - rat.x) > 1) {
          rat.state = "coming";    // 新派在另一边，挪过去继续啃
        }
      }
    }
    return;
  }

  if (rat.state === "walking") {
    // 玩家中途点了别的地方 -> 小偷的目标变了，这次抓老鼠作废，老鼠继续啃
    if (thief.targetX !== rat.walkTargetX || thief.targetY !== rat.walkTargetY) {
      rat.state = "eating";
      return;
    }
    if (!thief.moving) {
      var dx = thief.x - rat.x;
      var dy = thief.y - rat.y;
      if (dx * dx + dy * dy <= RAT_REACH * RAT_REACH) {
        startRatLift();
      } else {
        rat.state = "eating";
        showFeedback("小偷离老鼠太远了");
      }
    }
    return;
  }

  if (rat.state === "lifting") {
    // 提起来摆动 1 秒（= 一个完整来回），随后手臂和老鼠一起消失
    if (now - rat.liftStart >= LIFT_TIME) {
      rat.state = "carried";
      showFeedback("老鼠到手了：小偷提着它的尾巴");
    }
    return;
  }

  if (rat.state === "diving") {
    // 从窗台跳下来：一条微微往上弹的弧线，落点是窗台左下方的街面
    var p = constrain((now - rat.jumpStart) / RAT_JUMP_TIME, 0, 1);
    rat.x = rat.jumpFromX + (RAT_LEAP_X - rat.jumpFromX) * p;
    rat.y = rat.jumpFromY + (RAT_FLEE_Y - rat.jumpFromY) * p - RAT_JUMP_ARC * sin(PI * p);
    rat.faceLeft = true;
    if (p >= 1) {
      rat.y = RAT_FLEE_Y;
      rat.state = "fleeing";
    }
    return;
  }

  if (rat.state === "fleeing") {
    // 贴着街面往画面左边跑，跑出去就没了
    rat.faceLeft = true;
    rat.x = rat.x - RAT_FLEE_SPEED;
    if (rat.x <= CHASE_OFFSCREEN_X) {
      rat.state = "gone";
    }
  }
}

// 老鼠是否已经在小偷手里（"拥有老鼠"的状态）
function thiefHasRat() {
  return rat.state === "carried";
}

// 开始"提老鼠"的动画：小偷伸出一只手臂，揪着尾巴把老鼠提起来
function startRatLift() {
  rat.state = "lifting";
  rat.liftStart = millis();
  // 老鼠在小偷哪一侧，手就往哪边伸
  rat.liftSide = (rat.x < thief.x) ? -1 : 1;
  // 顺手取消"正走去进门 / 正走去交派"这类排队动作（人已经停下来抓老鼠了）
  pendingDoorIndex = -1;
  pendingGive = false;
  showFeedback("小偷伸手揪住老鼠的尾巴，把它提了起来");
}

// 提着老鼠的那只手的位置（绘制和测试共用）
function getRatLiftHand() {
  return { x: thief.x + rat.liftSide * 27, y: thief.y - 36 };
}

// 处理点击老鼠。返回 true 表示点击被消费
function tryRatClick(mx, my) {
  if (rat.state !== "eating") {
    return false;
  }
  if (dist(mx, my, rat.x, rat.y - 8) > RAT_CLICK_R) {
    return false;
  }

  var dx = thief.x - rat.x;
  var dy = thief.y - rat.y;
  if (dx * dx + dy * dy <= RAT_REACH * RAT_REACH) {
    // 够得着：直接提起来，不用先走
    startRatLift();
    return true;
  }

  // 够不着：先走到老鼠右边（从右边下手，画面里手是往左伸的）
  cancelCrateHiding();
  pendingDoorIndex = -1;
  pendingGive = false;
  rat.walkTargetX = rat.x + RAT_STAND_GAP;
  rat.walkTargetY = rat.y + 6;
  thief.targetX = rat.walkTargetX;
  thief.targetY = rat.walkTargetY;
  thief.moving = true;
  rat.state = "walking";
  showFeedback("小偷悄悄靠近正在吃派的老鼠");
  return true;
}

// ---------------- 老鼠绘制 ----------------

// 画一只老鼠：以"身体中心"为原点，身体横躺；faceLeft = 头朝左
// tailLen 的尾巴从屁股那端伸出去（提在手里时正好用来对齐手指）
function drawRatBody(cx, cy, faceLeft, tailLen) {
  var f = faceLeft ? -1 : 1;   // 头的方向

  // 尾巴：两段折线，先平着出去再往上翘
  stroke(150, 118, 118);
  strokeWeight(1.4);
  line(cx - f * 8, cy + 1, cx - f * (8 + tailLen * 0.55), cy + 1);
  line(cx - f * (8 + tailLen * 0.55), cy + 1,
       cx - f * (8 + tailLen), cy + 1 - tailLen * 0.45);
  noStroke();

  // 身体
  fill(125, 120, 128);
  ellipse(cx, cy, 18, 11);
  // 头
  fill(138, 132, 142);
  circle(cx + f * 8, cy - 1, 10);
  // 耳朵
  fill(170, 135, 140);
  circle(cx + f * 6, cy - 5, 5);
  // 鼻子
  fill(232, 150, 160);
  circle(cx + f * 12, cy, 2.4);
  // 眼睛
  fill(30, 30, 40);
  circle(cx + f * 9, cy - 2, 2);
  // 两条后腿（很短的线，表示站在地上）
  stroke(100, 95, 100);
  strokeWeight(1.2);
  line(cx - f * 4, cy + 4, cx - f * 4, cy + 7);
  line(cx + f * 3, cy + 4, cx + f * 3, cy + 7);
  noStroke();
}

// 地上的老鼠：溜过来 / 啃派（啃的时候身体轻微震动）
function drawRatOnGround() {
  if (rat.state === "none" || rat.state === "waiting" ||
      rat.state === "lifting" || rat.state === "carried" ||
      rat.state === "onSill" || rat.state === "gone") {
    return;
  }

  // 从窗台跳下来的那一小段：身体渐渐前倾，看起来是"扑"下来的
  if (rat.state === "diving") {
    var dp = constrain((millis() - rat.jumpStart) / RAT_JUMP_TIME, 0, 1);
    push();
    translate(rat.x, rat.y - 6);
    rotate(0.45 * dp);              // 头朝下前方（约 26°）
    drawRatBody(0, 0, rat.faceLeft, RAT_TAIL_LEN);
    pop();
    return;
  }

  var shakeX = 0;
  var shakeY = 0;
  if (rat.state === "eating") {
    // 两个不同频率的小幅正弦，叠起来就是"啃东西"的轻微抖动
    shakeX = sin(millis() / 26) * 0.9;
    shakeY = sin(millis() / 17) * 0.7;
  }

  drawRatBody(rat.x + shakeX, rat.y - 6 + shakeY, rat.faceLeft, RAT_TAIL_LEN);
}

// 被小偷提着的老鼠 + 那条手臂（画在小偷之后，压在他身上）
// 手臂：上臂向上抬，前臂水平举在空中；老鼠挂在手里，绕手做简谐摆动
function drawRatLift() {
  if (rat.state !== "lifting") {
    return;
  }
  var hand = getRatLiftHand();
  var side = rat.liftSide;

  // 上臂（从肩膀斜着抬起来）
  stroke(50, 50, 65);
  strokeWeight(4);
  line(thief.x + side * 5, thief.y - 12, thief.x + side * 13, thief.y - 36);
  // 前臂（水平举在空中）
  line(thief.x + side * 13, thief.y - 36, hand.x, hand.y);
  noStroke();

  // 手
  fill(230, 190, 150);
  circle(hand.x, hand.y, 6);

  // 老鼠：尾巴顶端正好捏在手里，身体垂在下面，按简谐规律左右摆
  // 1 秒一个完整周期（sin 从 0 出发回到 0 正好是一次来回）
  var t = millis() - rat.liftStart;
  var ang = RAT_SWING_AMP * sin(TWO_PI * t / LIFT_TIME);

  push();
  translate(hand.x, hand.y);
  rotate(-HALF_PI + ang);          // 让老鼠的尾巴朝上（朝着手）
  translate(-(8 + RAT_TAIL_LEN), RAT_TAIL_TIP_DY); // 尾巴尖正好对到手上，身体垂在下面
  drawRatBody(0, 0, true, RAT_TAIL_LEN); // 头朝下 = 被倒提着
  pop();
}

// ============================================================
// 新剧情：把老鼠放到窗台上
// 小偷手里已经提着老鼠（rat.state === "carried"）、靠近左边房子那扇开着的窗户时，
// 窗户上方冒出一个和小男孩头顶一样的白色实心圆（里面画的是老鼠，不是派）；
// 点它 -> 小偷走到窗下 -> 把手臂抬到与身体垂直（90°）-> 甩一下，老鼠脱手落到窗台上。
// ============================================================

// 圆圈的位置：窗户正上方（和小男孩头顶那个圆一样，画在头顶/窗框之上）
function getRatBubbleCenter() {
  // 窗户正上方：往下压一点，别顶到屋顶上；上面还留着窗框的余地
  return { x: WINDOW_CX, y: openWindow.y - 20 };
}

// 圆圈能不能出现（点击判定和绘制共用这一个判断）
function canShowRatBubble() {
  if (!thiefHasRat()) {
    return false;                  // 手里没有老鼠
  }
  if (ratSill.phase !== "none") {
    return false;                  // 已经在送的过程中 / 已经放好了
  }
  if (thief.hidingInCrate || thief.inHouse || thief.inBush) {
    return false;                  // 藏着或在屋里，不方便去窗口
  }
  if (cakeSteal.phase !== "none") {
    return false;                  // 偷蛋糕的剧情正在走
  }
  var dx = thief.x - WINDOW_CX;
  var dy = thief.y - WINDOW_SILL_Y;
  return dx * dx + dy * dy < WINDOW_RAT_DIST * WINDOW_RAT_DIST;
}

// 点击窗户上方的白色圆圈。返回 true 表示点击被消费
function tryRatSillClick(mx, my) {
  if (!canShowRatBubble()) {
    return false;
  }
  var c = getRatBubbleCenter();
  if (dist(mx, my, c.x, c.y) >= WINDOW_RAT_CLICK_R) {
    return false;
  }
  // 走到窗下的落脚点（和拿窗台派是同一个位置），到了再抬手
  cancelCrateHiding();
  pendingDoorIndex = -1;
  pendingGive = false;
  thief.targetX = WINDOW_RAT_SPOT.x;
  thief.targetY = WINDOW_RAT_SPOT.y;
  thief.moving = true;
  ratSill.phase = "walking";
  ratSill.side = (RAT_SILL_POS.x < thief.x) ? -1 : 1;  // 手朝窗台上老鼠那侧伸
  rat.faceLeft = true;                             // 头朝左（尾巴朝右，别伸到窗框外面）
  showFeedback("小偷拎着老鼠走向窗口");
  return true;
}

// 肩关节：躯干上缘偏下一点、朝窗户那一侧的外侧（手臂从这里长出来）
function getRatSillShoulder() {
  var side = ratSill.side;
  return { x: thief.x + side * 9, y: thief.y - 2 };
}

// 手臂抬起程度 raise：0 = 垂在身侧，1 = 抬起 90°（水平），>1 = 继续往头顶方向扬。
// 手臂是一条和身体等宽的直线段，手 = 肩 + 绕肩旋转 raise*90° 后的臂长
function getRatSillHand(raise) {
  var s = getRatSillShoulder();
  var a = HALF_PI * constrain(raise, 0, 2);
  return {
    x: s.x + ratSill.side * RAT_SILL_ARM_LEN * sin(a),
    y: s.y + RAT_SILL_ARM_LEN * cos(a)
  };
}

// 每帧更新（在 updateGame 里调用）
function updateRatSill() {
  if (ratSill.phase === "none") {
    return;
  }
  var now = millis();

  if (ratSill.phase === "walking") {
    // 玩家中途点了别处：这趟作废，老鼠还在手里
    if (thief.targetX !== WINDOW_RAT_SPOT.x || thief.targetY !== WINDOW_RAT_SPOT.y) {
      ratSill.phase = "none";
      return;
    }
    if (!thief.moving) {
      ratSill.phase = "lifting";
      ratSill.startAt = now;
      showFeedback("小偷把手臂抬到水平，准备把老鼠甩上去");
    }
    return;
  }

  if (ratSill.phase === "lifting") {
    if (now - ratSill.startAt >= RAT_SILL_LIFT_TIME) {
      ratSill.phase = "placing";
      ratSill.startAt = now;
      showFeedback("老鼠脱手飞了出去");
    }
    return;
  }

  if (ratSill.phase === "placing") {
    if (now - ratSill.startAt >= RAT_SILL_MOVE_TIME) {
      // 放到窗台上：老鼠从此坐在窗台，不再属于小偷
      rat.state = "onSill";
      rat.x = RAT_SILL_POS.x;
      rat.y = RAT_SILL_POS.y;
      rat.faceLeft = true;      // 头朝左、尾巴往右伸，整只老鼠都在窗洞范围内
      rat.sillAt = millis();    // 记下落台时刻：厨师要过 0.4 秒才可能发现它
      ratSill.phase = "none";
      showFeedback("老鼠被甩到了窗台上");
    }
  }
}

// 提起的老鼠（尾巴捏在手里、身体垂在下面），手和老鼠一起画
function drawRatInHand(hx, hy, ang) {
  // 手
  fill(230, 190, 150);
  circle(hx, hy, 6);

  push();
  translate(hx, hy);
  rotate(-HALF_PI + ang);            // 尾巴朝上（对着手）
  translate(-(8 + RAT_TAIL_LEN), RAT_TAIL_TIP_DY); // 尾巴尖正好对到手上
  drawRatBody(0, 0, true, RAT_TAIL_LEN);
  pop();
}

// 甩出去的飞行轨迹：eq 从 0 到 1，返回老鼠身体中心和旋转角
// （起点是吊在手里的位置，终点是窗台上坐正的位置，中途向上拱起一道弧）
function getRatFlyPose(eq) {
  var h0 = getRatSillHand(1);
  var fromX = h0.x + RAT_TAIL_TIP_DY;
  var fromY = h0.y + (8 + RAT_TAIL_LEN);
  var toX = RAT_SILL_POS.x, toY = RAT_SILL_POS.y - 6;
  return {
    x: fromX + (toX - fromX) * eq,
    y: fromY + (toY - fromY) * eq - RAT_SILL_ARC * sin(PI * eq),
    ang: -HALF_PI * (1 - eq)   // -90° = 倒吊着，0° = 坐正
  };
}

// 手臂：从肩到手的一条直线段（长度 = 身体宽度），和身体连着不断开
function drawRatSillArm(hx, hy) {
  var s = getRatSillShoulder();
  stroke(50, 50, 65);
  strokeWeight(4);
  line(s.x, s.y, hx, hy);
  noStroke();
}

// 窗户上方的圆圈 + 送老鼠的过程 + 已经放在窗台上的老鼠
// （画在小偷之后，手臂压在人物身上）
function drawRatSill() {
  // 1) 白色圆圈（手里有老鼠 + 靠近窗户）
  if (canShowRatBubble()) {
    var c = getRatBubbleCenter();
    noStroke();
    fill(255);
    circle(c.x, c.y, 44);
    // 圆里画一只老鼠（和小男孩那个圆里的派一个量级）
    drawRatBody(c.x, c.y + 1, false, 12);
    noFill();
    stroke(120, 90, 60);
    strokeWeight(2);
    circle(c.x, c.y, 44);
    noStroke();
  }

  // 2) 抬手 -> 甩出去 -> 老鼠飞向窗台
  if (ratSill.phase === "lifting" || ratSill.phase === "placing") {
    var now = millis();

    if (ratSill.phase === "lifting") {
      // 手臂从垂下慢慢抬到水平；老鼠还吊在手里，跟着轻轻晃
      var p = constrain((now - ratSill.startAt) / RAT_SILL_LIFT_TIME, 0, 1);
      var e = p * p * (3 - 2 * p);              // 缓入缓出，抬起来不突兀
      var hand = getRatSillHand(e);
      drawRatSillArm(hand.x, hand.y);
      var ang = RAT_SWING_AMP * sin(PI * p) * e;
      drawRatInHand(hand.x, hand.y, ang);
    } else {
      // 手臂已经抬到水平，甩完再稍微回摆一下
      var q = constrain((now - ratSill.startAt) / RAT_SILL_MOVE_TIME, 0, 1);
      var eq = q * q * (3 - 2 * q);
      var hp = getRatSillHand(1 + 0.35 * sin(PI * q));   // 甩上去再收回
      drawRatSillArm(hp.x, hp.y);
      fill(230, 190, 150);
      circle(hp.x, hp.y, 6);                    // 手里已经空了
      noFill();

      // 老鼠脱手：从甩出点沿一道向上的弧线落向窗台，同时从倒吊转正
      var fly = getRatFlyPose(eq);
      push();
      translate(fly.x, fly.y);
      rotate(fly.ang);
      drawRatBody(0, 0, rat.faceLeft, RAT_TAIL_LEN);
      pop();
    }
  }

  // 3) 已经放在窗台上的老鼠
  if (rat.state === "onSill") {
    drawRatBody(rat.x, rat.y - 6, rat.faceLeft, RAT_TAIL_LEN);
  }
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
    // 男孩必须还在原地等着，否则这单作废（他已经跑回风车了）
    if (carried !== null && boy.state === "standing") {
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
    // 男孩已经不在原地（跑回风车了）：派掉在原地地上，不能再追着他进屋
    if (boy.state !== "standing") {
      p.location = "ground";
      p.y = constrain(p.y, GROUND_TOP, 560);
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
  updateCakeSteal();// 偷橱窗蛋糕的流程（店里那段穿墙，自己改坐标）
  checkDoorEntry(); // 一键进门：到门前自动开门走进去
  updatePieGive();  // 送派给小男孩的流程（走到位 + 交派动画）
  updateBaker();    // 厨师剧情状态机
  updateBoy();      // 小男孩剧情（走出风车）
  updateRat();      // 老鼠剧情（来啃派 + 被小偷提走）
  updateRatSill();  // 甩老鼠上窗台的流程（走到窗下 -> 抬手 -> 甩出去 -> 落到窗台）
  checkHiding();    // 小偷躲藏判定（木桶 + 木箱）
  checkInHouse();   // 小偷是否在房子门洞里
  checkCaught();    // 是否被发现
}

// ---------------- 躲藏判定 ----------------

function checkHiding() {
  thief.hiding = false;

  // 逃跑冲刺那几秒：他已经"豁出去了"，草丛/躲藏点都不算躲（画面上也画在草丛之上）
  if (escape.active) {
    thief.inBush = false;
    return;
  }

  // 圆形躲藏点（原来只有木桶，现在这个列表是空的，保留兜底）
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

  // 草丛：人站在草丛那条带子里就算躲藏（可以左右走动，走出来就不再隐藏）
  thief.inBush = inBush(thief.x, thief.y);
  if (thief.inBush) {
    thief.hiding = true;
  }
}

// 某个坐标是不是落在草丛里（用小偷的基准点 = 脚底/胯部那一行来判断）
// 稍稍往里收 4px，避免"贴着边"时一会儿算在里面、一会儿算在外面
function inBush(x, y) {
  return x >= bush.x + 4 && x <= bush.x + bush.w - 4 &&
         y >= bush.y + 4 && y <= BUSH_BOTTOM;
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

// 厨师此刻是否"人在街上、眼睛朝着街道"（被发现判定的前提条件）
function bakerWatchingStreet() {
  // 两种巡逻：房子正面的四段（patrol）+ 蛋糕被偷后整条街来回（patrolAll）
  if (baker.state === "patrol" || baker.state === "patrolAll") {
    return true;
  }
  if (baker.state === "entering") {
    // 回屋路线是"先平着走回门口，再竖直钻进房门"：
    //   0 号点 = 街面上门口正下方那个点（这一整段都在街面上平着走，回头看得见人）
    //   wpIndex >= 1 时已经在往门洞里竖直上升，脸朝着门里，就看不到街上了
    return baker.wpIndex === 0;
  }
  return false;
}

function checkCaught() {
  // 已经跑起来了（点了画面最右边、抱着蛋糕往画面外冲）：这一段不算被抓，
  // 否则玩家刚点完就被身后巡逻的厨师逮住，等于这个按钮白点
  if (escape.active) {
    return;
  }

  // 新增：小偷正在偷橱窗里的蛋糕，而厨师已经回到屋内（y < 380 = 进了房子）
  // —— 他站在店里/门洞里，一览无余，直接被抓。
  // 这条判断只看"厨师是否进屋"，与原有的半平面视野规则无关。
  var thiefInStore = thief.inBakery ||
                     (cakeSteal.phase === "entering" || cakeSteal.phase === "out");
  if (thiefInStore && baker.y < 380) {
    showFeedback("厨师回到店里，正好撞见你！");
    gameState = "caught";
    return;
  }

  // 小偷躲藏中 -> 看不见
  if (thief.hiding) {
    return;
  }
  // 小偷在房子门洞里 -> 看不见（原有机制）
  if (thief.inHouse) {
    return;
  }
  // 新增：厨师只有在"人在屋外、眼睛朝着街道"时才看得见小偷。
  //   patrol / patrolAll —— 在房子正面 / 整条街上来回巡逻
  //   entering          —— 骂完小男孩（或巡逻走完）转身往房子走，
  //                        还没进门、仍在街面上平着走的那一段，回头也会看见人
  // 藏在房子里 / 在窗户里 / 竖直钻进房门的时候，都看不见屋外的小偷。
  if (!bakerWatchingStreet()) {
    return;
  }

  // 左右半平面检查（原有规则：面朝哪边哪边全可见，背后看不见）
  var facingX = cos(baker.facing);
  // 例外：他正在竖直方向走（facing ≈ ±90°）时，其实是朝着 / 背着镜头走，
  // 左右两边都没在看。以前这里 cos 会算出 ±6e-17，被当成"面朝右"，
  // 于是他一从门洞里迈到街上，就把右边所有人都算进视野了 ——
  // 玩家刚点完橱窗蛋糕（小偷从右边过来）就会被这一帧秒抓。
  if (abs(facingX) < 0.2) {
    return;
  }
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
  // 回屋路上被抓：给一句贴合剧情的提示（骂完人一转身就撞见）
  if (baker.state === "entering") {
    showFeedback("厨师一转身，正好看见你站在街上！");
  }
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
  thief.inBakery = false;
  thief.inBush = false;
  resetThiefPath();

  // 橱窗蛋糕：重新长回来，偷蛋糕的流程也清空
  cake.stolen = false;
  cakeSteal.phase = "none";
  cakeSteal.startAt = 0;
  cakeSteal.caughtAt = 0;

  // 逃跑：取消"正往外冲"的状态
  escape.active = false;
  escape.startAt = 0;
  winShownAt = 0;

  // 厨师：藏回房子里，开局 5 秒后去窗户放派
  baker.x = BAKER_HIDE_X;
  baker.y = BAKER_WALK_Y;
  baker.facing = 0;
  baker.state = "hidden";
  baker.wp = [];
  baker.wpIndex = 0;
  baker.pendingExit = false;
  baker.stateTimer = 0;
  baker.alerted = false;        // 清掉"已经为蛋糕被偷感叹过"的标记
  baker.allRangePatrol = false; // 回到原来的四段巡逻
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

  // 老鼠：这一局还没有老鼠（等小男孩丢下派之后才会安排）
  rat.state = "none";
  rat.x = 0;
  rat.y = 0;
  rat.targetX = 0;
  rat.faceLeft = true;
  rat.appearAt = 0;
  rat.pie = null;
  rat.walkTargetX = 0;
  rat.walkTargetY = 0;
  rat.liftStart = 0;
  rat.liftSide = -1;
  rat.sillAt = 0;
  rat.jumpStart = 0;
  rat.jumpFromX = 0;
  rat.jumpFromY = 0;
  // "把老鼠放到窗台"的流程也归零
  ratSill.phase = "none";
  ratSill.startAt = 0;
  ratSill.side = -1;

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
  text("开局：小偷藏在最左边的木箱里，厨师在左边房子的窗户里放派", CANVAS_W / 2, 348);
  text("点派走近再点一次拾取；点小偷把派放到身前；点小偷也可再拾起", CANVAS_W / 2, 368);
  text("拿着派靠近小男孩，点他头顶的白色圆圈可以把派送给他", CANVAS_W / 2, 388);
  text("偷走窗台上的派，厨师会出门巡逻——躲进木箱、草丛或房子里保命", CANVAS_W / 2, 408);
  text("点两栋房子之间的草丛：小偷钻进去后能左右挪，厨师看不见他", CANVAS_W / 2, 428);
  text("点击关着的门：小偷会自动走过去开门进屋躲藏", CANVAS_W / 2, 448);
  text("被厨师责骂后，小男孩把派放地上跑回风车；3 秒后老鼠从右边来啃派", CANVAS_W / 2, 468);
  text("点老鼠把它提在手里；走到左边窗户附近，点窗口的圆圈把老鼠甩到窗台", CANVAS_W / 2, 488);
  text("厨师巡逻时看见窗台上的老鼠，会冲过来把它吓跑、一路追出画面", CANVAS_W / 2, 508);
  text("厨师走到屋外、往小男孩那边去时，点橱窗蛋糕就能偷走它（他回店会发现）", CANVAS_W / 2, 528);
  text("拿到蛋糕后点画面最右边那条：小偷从右边跑出画面 = 通关", CANVAS_W / 2, 548);
  text("双击画布进入 / 退出全屏", CANVAS_W / 2, 572);
}

// ---------------- 游戏画面 ----------------

function drawGame() {
  drawSkyAndGround();
  drawWindmill();
  drawBakery();      // 含开着的窗户 + 窗台
  drawCrate();       // 木箱
  drawDoors();
  drawPie();         // 窗台上的派 / 地上的派
  drawRatOnGround(); // 来啃派的老鼠（画在派之上）
  drawBaker();       // 厨师（屋内自动被"挡住"，窗口只露上半身）
  // 橱窗里的蛋糕画在厨师之后：厨师走到玻璃后面时，剪影被蛋糕挡住（蛋糕在前、人在后）
  drawThiefInGlassBody();  // 偷蛋糕的小偷：身体（在蛋糕之后，下半身被托盘挡住）
  drawDisplayCake();
  drawThiefInGlassArms();  // 偷蛋糕的小偷：双臂（在蛋糕之前，伸到蛋糕上面）
  drawDisplayGlassFront(); // 玻璃反光 + "人在玻璃后面"的蓝色覆盖层（压在最上面）
  drawBakerAlert();  // 发现蛋糕不见：橱窗里厨师头右上角的红色感叹号（画在最上层）
  drawScoldMarks();  // 责骂小男孩时：头部前方的摇摆锯齿线 + 红色感叹号
  if (!escape.active) {
    drawThief();
  }
  drawRatLift();     // 被小偷提着尾巴、左右摆动的老鼠（手臂压在小偷身上）
  drawRatSill();     // 窗口上方的白圆（里面是老鼠）+ 抬手甩老鼠 + 窗台上的老鼠
  // 草丛画在小偷之后：小偷站在草丛里的那部分被草丛遮住，只从顶端露出一点脑袋
  drawBush();
  // 逃跑冲刺这段画在草丛之上：抱着蛋糕一路冲出画面，穿过草丛也得看得见人
  if (escape.active) {
    drawThief();
  }
  drawBoy();         // 小男孩（走出风车后一直站在风车最左侧）
  drawGivePie();     // 交派相关：头顶白色圆圈 + 胸前移动的派（画在人物之后，盖在上面）
  drawExitHint();    // 右边那条"溜走"的提示（拿到蛋糕之后才出现）
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

// 面包店：墙体 + 窗户 + 招牌
// 轮廓改成参考图左边那栋：正面是个大三角山墙（屋顶就是山墙本身），
// 原来那顶红色三角屋顶去掉了 —— 墙往上收成一个尖，两条坡线压一道浅奶油色檐边
function drawBakery() {
  // ---- 轮廓：照原作 1:1 还原（形状 / 比例 / 大小）----
  // 量自原作截图（ref 像素）：墙 175~435（宽 260）、地面 306、
  //   左檐尖 (163,200)、折角 (237,131)、屋脊 (302,84)、右檐口 (430,166)
  //   => 高 222，高宽比 0.854；屋脊在墙中心（302 vs 305），左右坡不对称
  // 映射到本关：墙仍是 80~420（碰撞不能动，宽 340），缩放 340/260 = 1.307
  //   x' = 80  + (rx - 175) * 1.307
  //   y' = 380 - (306 - ry) * 1.307
  // 于是整栋从 252 高长到 290 高，屋脊从 128 抬到 90，左檐不再挑到画面外。
  var EAVE_L = { x: 64,  y: 241 };   // 左檐尖（只挑出墙外 16px，原作 12px）
  var CREASE = { x: 161, y: 151 };   // 左坡折角（原作折角，不是台阶）
  var RIDGE  = { x: 246, y: 90  };   // 屋脊：墙中心（原作 302/305 ≈ 正中）
  var EAVE_R = { x: 420, y: 197 };   // 右檐口：落在右墙顶角上（原作不外挑）
  var WALL_L = 80, WALL_R = 420, BASE_Y = 380;

  // 墙体 + 山墙：一个整体多边形
  // （地面左 -> 地面右 -> 右墙顶 -> 屋脊 -> 折角 -> 左檐尖 -> 檐底 -> 左墙）
  fill(225, 200, 160);
  beginShape();
  vertex(WALL_L, BASE_Y);
  vertex(WALL_R, BASE_Y);
  vertex(EAVE_R.x, EAVE_R.y);
  vertex(RIDGE.x, RIDGE.y);
  vertex(CREASE.x, CREASE.y);
  vertex(EAVE_L.x, EAVE_L.y);
  vertex(WALL_L, EAVE_L.y);   // 挑檐的下沿：从檐尖平着回到墙面
  endShape(CLOSE);

  // 屋顶檐边（浅奶油色）：顺着同一条折线画，整条边就是屋顶唯一的痕迹
  // 9px 粗 = 原作 7px * 1.307
  noFill();
  stroke(247, 236, 205);
  strokeWeight(9);
  strokeJoin(ROUND);
  beginShape();
  vertex(EAVE_L.x, EAVE_L.y);
  vertex(CREASE.x, CREASE.y);
  vertex(RIDGE.x, RIDGE.y);
  vertex(EAVE_R.x, EAVE_R.y);
  endShape();
  noStroke();

  // 最左边屋檐下那块竖直悬挂的松饼招牌
  drawHangingSign();

  // 右边的小窗户（原有样式保留）
  fill(140, 190, 220);
  rect(340, 240, 50, 40);
  stroke(90, 60, 40);
  strokeWeight(2);
  line(365, 240, 365, 280);
  line(340, 260, 390, 260);
  noStroke();

  // 门右边的蓝色玻璃橱窗（新增：高脚托盘 + 三层蛋糕剪影，纯装饰）
  drawDisplayWindow();

  // 开着的窗户（新增：厨师放派的窗口）
  drawOpenWindow();

  // 招牌
  fill(250, 245, 230);
  rect(190, 205, 120, 26);
  fill(200, 150, 90);
  ellipse(250, 218, 34, 16);
}

// 最左边屋檐下竖直悬挂的松饼招牌：
// 一根从檐口挑出来的小横杆 + 两块吊牌挂绳 + 一块竖着的木板，板上画一只松饼
function drawHangingSign() {
  var armY = 228;                    // 挂杆的高度（就是挑檐的下沿）
  var bx = 34, bw = 34;              // 招牌左沿 / 宽度（竖直的长方形）
  var by = 246, bh = 58;             // 招牌上沿 / 高度

  // 挂杆：一小截深色木条，正好压在挑檐下沿上（招牌就从这里挂下来）
  stroke(105, 72, 48);
  strokeWeight(5);
  line(bx + 4, armY, 76, armY);
  noStroke();

  // 两根吊绳（从挂杆垂到招牌顶部）
  stroke(105, 72, 48);
  strokeWeight(2);
  line(bx + 7, armY, bx + 7, by);
  line(bx + bw - 7, armY, bx + bw - 7, by);
  noStroke();

  // 木板本体
  fill(250, 245, 230);
  rect(bx, by, bw, bh, 3);
  noFill();
  stroke(120, 85, 55);
  strokeWeight(2);
  rect(bx, by, bw, bh, 3);
  noStroke();

  // 松饼：下面一个梯形的杯托，上面一团鼓起来的饼身，饼身上点几颗小屑
  var cx = bx + bw / 2;
  var topY = by + 18;                // 饼身中段
  fill(238, 205, 140);
  ellipse(cx, topY + 1, 23, 22);     // 饼身：鼓起来的一团（下半截被杯托盖住）

  // 杯托（下宽上窄的梯形，偏深一点的咖色）
  fill(206, 160, 104);
  quad(cx - 11, topY + 8, cx + 11, topY + 8, cx + 8, topY + 22, cx - 8, topY + 22);

  // 饼上的小屑
  fill(224, 156, 96);
  circle(cx - 5, topY - 1, 3);
  circle(cx + 3, topY - 4, 2.6);
  circle(cx + 6, topY + 2, 2.4);
  circle(cx - 1, topY + 4, 2.2);
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

// 蓝色玻璃橱窗的"壳体"：深木色外框 + 蓝玻璃 + 玻璃内部的阴影
// （里面的蛋糕、玻璃反光拆在 drawDisplayCake / drawDisplayGlassFront，
//   它们要画在厨师之后，这样厨师剪影才会被蛋糕挡住）
function drawDisplayWindow() {
  var dx = displayWindow.x;
  var dy = displayWindow.y;
  var dw = displayWindow.w;
  var dh = displayWindow.h;

  // 深木色外框（比玻璃大一圈）
  fill(90, 60, 40);
  rect(dx - 5, dy - 5, dw + 10, dh + 10);

  // 玻璃底色（浅蓝）
  fill(150, 200, 235);
  rect(dx, dy, dw, dh);

  // 玻璃内部的深蓝色背景（营造"阴影"氛围）
  fill(40, 60, 110);
  rect(dx + 4, dy + 4, dw - 8, dh - 8);

  // 玻璃外框描边
  noFill();
  stroke(60, 40, 25);
  strokeWeight(3);
  rect(dx, dy, dw, dh);
  noStroke();
}

// 橱窗里的高脚托盘 + 三层蛋糕（深蓝色剪影）
// 注意：这个函数在 drawGame 里排在 drawBaker() 之后调用 ——
// 厨师站到玻璃后面时，会被人先画、蛋糕后画，于是剪影被蛋糕挡住
// 三层蛋糕被偷走后，只留下空托盘（托盘不消失，看得出"这里原本有东西"）
function drawDisplayCake() {
  var baseY = displayWindow.y + displayWindow.h - 12;  // 托盘底座的高度

  // 托盘比蛋糕浅一档，好让深色的蛋糕剪影从托盘上分离出来
  fill(32, 50, 96);
  // 托盘底座
  rect(DISP_CX - 22, baseY, 44, 6);
  // 托盘立柱
  rect(DISP_CX - 3.5, baseY - 16, 7, 16);
  // 托盘的盘子（横椭圆）
  ellipse(DISP_CX, baseY - 18, 58, 9);

  // 蛋糕已经被偷走：托盘空着，三层不再画
  if (cake.stolen) {
    return;
  }

  // 三层蛋糕剪影：外形照着通关方框里那块蛋糕（三层圆角矩形 +
  // 每层上沿一排糖霜小圆 + 顶层一朵花），只是整体缩到能坐在托盘上，
  // 并且只用一种深蓝色 —— 隔着蓝玻璃看，它就是一块剪影
  drawCakeSilhouette(DISP_CX, baseY - 22);
}

// 蛋糕剪影（和 drawWinCake 同一个造型，按比例缩小）
//   cx       蛋糕中轴
//   plateTopY 盘面（= 蛋糕底边）的 y
function drawCakeSilhouette(cx, plateTopY) {
  var w1 = 50, h1 = 11;   // 底层
  var w2 = 38, h2 = 10;   // 中层
  var w3 = 26, h3 = 9;    // 顶层
  var y1 = plateTopY - h1;   // 底层顶
  var y2 = y1 - h2;          // 中层顶
  var y3 = y2 - h3;          // 顶层顶

  fill(22, 36, 78);
  noStroke();

  // 三层（从下往上摞）
  rect(cx - w1 / 2, y1, w1, h1, 3);
  rect(cx - w2 / 2, y2, w2, h2, 3);
  rect(cx - w3 / 2, y3, w3, h3, 3);

  // 每层上沿的糖霜：一排小圆，圆心略低于上沿、冒出去一点点，
  // 剪影的外轮廓就成了一道细波浪边（和通关蛋糕上的裱花一一对应）
  var dy = [y1, y2, y3];
  var dw = [w1, w2, w3];
  for (var t = 0; t < 3; t++) {
    for (var x = cx - dw[t] / 2 + 4; x <= cx + dw[t] / 2 - 4.001; x = x + 6.5) {
      circle(x, dy[t] + 1.1, 4.6);
    }
  }

  // 顶层的花（剪影里就是一个圆润的小凸起）
  circle(cx, y3 - 2.5, 7);
}

// 玻璃表面上的东西：反光斜线，以及"厨师在玻璃后面"时压的那层半透明蓝
// （画在最上层，所以反光和蓝色都会盖在蛋糕与厨师之上，像真的隔着玻璃看）
function drawDisplayGlassFront() {
  var dx = displayWindow.x;
  var dy = displayWindow.y;

  // 玻璃反光的斜线条（让玻璃更有质感）
  stroke(210, 235, 255, 110);
  strokeWeight(3);
  line(dx + 14, dy + 8, dx + 4, dy + 34);
  line(dx + 26, dy + 8, dx + 14, dy + 44);
  noStroke();

  // 有人躲在玻璃后面（厨师路过 / 小偷在偷蛋糕）：压一层半透明蓝，
  // 让里面的人看起来确实隔着一层玻璃
  if (isBakerBehindDisplay() || thief.inBakery) {
    fill(130, 190, 235, 80);
    rect(displayWindow.x, displayWindow.y, displayWindow.w, displayWindow.h);
  }
}

// 静态风车（小男孩的家）
// 照着参考图右边那栋做：整体放大、底层和二层都拉宽；两侧轮廓都不是垂直的，
// 而是往上越走越宽（老木屋那种"歪"）；屋顶是屋脊偏左的折线 —— 左坡短而陡、
// 右坡长而缓，右端檐口还往下勾一小截。内部（门）不动。
function drawWindmill() {
  var JETTY_Y = 270;                  // 楼板线（二层挑出去的那条横线）
  var EAVE_Y  = 170;                  // 檐口线
  var RIDGE_X = 682, RIDGE_Y = 94;    // 屋脊：故意偏左，右边坡就长了

  // 底层：落地 656~754，到楼板线外扩成 646~764（两侧都带点斜）
  fill(210, 195, 170);
  quad(656, 380, 754, 380, 764, JETTY_Y, 646, JETTY_Y);

  // 二层：再从 618~792 起，到檐口外扩成 608~802
  quad(618, JETTY_Y, 792, JETTY_Y, 802, EAVE_Y, 608, EAVE_Y);

  // 楼板下沿：出挑那块的厚度（深一档的横带）
  fill(186, 170, 146);
  rect(618, JETTY_Y - 8, 174, 8);

  // 山墙：檐口线以上到屋脊（和墙同色）
  fill(210, 195, 170);
  triangle(608, EAVE_Y, 802, EAVE_Y, RIDGE_X, RIDGE_Y);

  // 红色檐边：一条折线（左坡 -> 屋脊 -> 右坡 -> 末端往下勾）
  stroke(208, 92, 88);
  strokeWeight(7);
  line(600, 180, RIDGE_X, RIDGE_Y - 4);
  line(RIDGE_X, RIDGE_Y - 4, 812, 172);
  line(812, 172, 816, 186);
  noStroke();

  // 风车叶片
  var cx = 705;
  var cy = 205;

  stroke(90, 60, 40);
  strokeWeight(4);
  for (var i = 0; i < 4; i++) {
    var a = i * HALF_PI + 0.4;
    var len = 86;
    line(cx, cy, cx + cos(a) * len, cy + sin(a) * len);
    noStroke();
    fill(230, 220, 200);
    var ex = cx + cos(a) * len;
    var ey = cy + sin(a) * len;
    // 桨叶顺着叶片方向摆（以前是轴对齐的小方块，斜着看像贴上去的白纸片）
    push();
    translate(ex, ey);
    rotate(a);
    rect(-9, -4, 18, 8);
    pop();
    stroke(90, 60, 40);
    strokeWeight(4);
  }
  noStroke();

  fill(70, 50, 35);
  circle(cx, cy, 12);
}

// 草丛：绿色的云朵形状（一排大小不一的圆当上沿 + 一条底带补实中间）
// 画在小偷之后，所以站在草丛里的小偷只有头顶那一小撮露在外面。
function drawBush() {
  noStroke();

  // 下半部分（深一点的绿）：底带 + 一排错开的圆，让下缘和两头也是圆头的
  fill(46, 120, 52);
  rect(bush.x + 18, bush.y + 14, bush.w - 36, bush.h - 14);
  for (var j = 0; j < BUSH_BUMPS.length; j++) {
    var d = BUSH_BUMPS[j];
    // 下排的圆错开半个间距更自然，但两端要收回来，免得深色比亮色多出一截
    var bx = constrain(d.dx + 11, d.r, bush.w - d.r);
    ellipse(bush.x + bx, bush.y + bush.h - 7, d.r * 2.0, d.r * 1.35);
  }

  // 上半部分（亮一点的绿）：云朵状的上沿
  fill(62, 150, 66);
  for (var i = 0; i < BUSH_BUMPS.length; i++) {
    var b = BUSH_BUMPS[i];
    ellipse(bush.x + b.dx, bush.y + 18, b.r * 2, b.r * 1.9);
  }

  // 顶部受光的小高光
  fill(96, 186, 100);
  for (var k = 2; k < BUSH_BUMPS.length; k += 4) {
    var lit = BUSH_BUMPS[k];
    ellipse(bush.x + lit.dx - 3, bush.y + 9, 12, 6);
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

// 厨师绘制：可见性规则 ——
// 在屋内走动时，只有经过「放派的窗户」或「蓝色玻璃橱窗」才能被看到；
// 经过门口/门洞或屋内其他位置时，一律默认被房子挡住（不画）。
// 只有走到屋外（门洞底部以下）才恢复全身可见。
// 两个窗口都用"裁剪到玻璃内"的方式绘制：身体越过窗口边缘的部分立刻消失，
// 还留在窗口里的部分继续可见（和放派的窗户一致）。
function drawBaker() {
  // 藏在房子深处：任何窗口都看不到。
  // 这条按剧情状态判断，不依赖 x 坐标 —— 橱窗挪位置后
  // BAKER_HIDE_X(320) 正好落在玻璃后面，靠坐标避开已经不可靠了。
  if (baker.state === "hidden") {
    return;
  }
  // 屋外（门洞底部以下）：画全身
  if (baker.y >= 380) {
    drawFullBaker();
    return;
  }
  // 屋内：两扇窗各自裁剪绘制，落在玻璃里的部分才看得见
  drawWindowBakerClipped();
  drawShopWindowBakerClipped();
}

// 窗洞的裁剪矩形：向内缩 2px，让窗框的描边压在身体之上
// （看起来是"站在窗框后面"，而不是糊在窗框上）
function getWindowClipRect() {
  var pad = 2;
  return {
    x: openWindow.x + pad,
    y: openWindow.y + pad,
    w: openWindow.w - pad * 2,
    h: openWindow.h - pad * 2
  };
}

// 窗户里的厨师：把绘制裁剪到窗洞矩形以内。
// 这样他从窗口往屋里走时，身体越过窗洞边缘的那一部分立刻被墙挡住消失，
// 还留在窗洞里的部分继续可见，直到整个人都走进屋内 ——
// 而不是像以前那样整体判断 |x-135|<=38，走到边缘时"啪"地整个人消失。
function drawWindowBakerClipped() {
  // p5 全局模式下 drawingContext 就是底层 canvas 2D 上下文（官方文档提供）
  var ctx = (typeof drawingContext !== "undefined" && drawingContext) ? drawingContext : null;

  if (!ctx || typeof ctx.clip !== "function") {
    // 兜底：拿不到绘图上下文时退回原来的整体判定，至少不会画错位置
    if (abs(baker.x - WINDOW_CX) <= 38) {
      drawWindowBaker();
    }
    return;
  }

  var cr = getWindowClipRect();
  ctx.save();
  ctx.beginPath();
  ctx.rect(cr.x, cr.y, cr.w, cr.h);
  ctx.clip();
  drawWindowBaker();      // 画的内容和以前一样，只是超出窗洞的部分被裁掉
  ctx.restore();
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
// 身体高度按"底边正好落在窗洞下沿"算出来（原来写死 30，底边只到 332，
// 比窗洞下沿 340 矮 8px，人看起来是悬在窗口中间的）
var WINDOW_BODY_TOP = 302;                    // 肩膀顶（接在头的下缘 301 上）
var WINDOW_BODY_H = WINDOW_SILL_Y - WINDOW_BODY_TOP; // 38 = 302 -> 340
function drawWindowBaker() {
  var bx = baker.x;
  // 肩膀/围裙（上半身）：底边 = 窗洞下沿，被窗台接住
  fill(245, 245, 245);
  rect(bx - 13, WINDOW_BODY_TOP, 26, WINDOW_BODY_H);
  // 头
  fill(240, 200, 160);
  circle(bx, 290, 22);
  // 厨师帽
  fill(255);
  rect(bx - 11, 278, 22, 9);
  ellipse(bx, 278, 26, 11);
}

// 蓝色玻璃橱窗里的厨师：把绘制裁剪到玻璃以内。
// 他从玻璃左/右边缘走进走出时，身体越界的那一部分被窗框挡住消失，
// 不会像以前那样"进入判定范围就整个人出现、出了范围就整个消失"。
function drawShopWindowBakerClipped() {
  // 离得远：连裁剪都省掉（只是省性能，边界仍由裁剪决定）
  if (baker.x < displayWindow.x - 40 || baker.x > displayWindow.x + displayWindow.w + 40) {
    return;
  }

  var ctx = (typeof drawingContext !== "undefined" && drawingContext) ? drawingContext : null;
  if (!ctx || typeof ctx.clip !== "function") {
    // 兜底：拿不到绘图上下文时退回整体判定，至少不会画错位置
    if (abs(baker.x - DISP_CX) <= displayWindow.w / 2) {
      drawShopWindowBaker();
    }
    return;
  }

  // 玻璃左/右/上各内缩 4px（和内部深蓝底对齐，避免剪影压到木框上），
  // 底部只缩到窗框内沿（玻璃下沿 -2）：厨师的身体要正好接到下沿、被窗台"接住"，
  // 又不能啃掉木框那 3px 描边，看着才像站在里面，而不是悬在半空中
  var pad = 4;
  ctx.save();
  ctx.beginPath();
  ctx.rect(displayWindow.x + pad, displayWindow.y + pad,
           displayWindow.w - pad * 2, displayWindow.h - 2 - pad);
  ctx.clip();
  drawShopWindowBaker();
  ctx.restore();
}

// 厨师经过蓝色玻璃橱窗时：整个人隔着玻璃，画成偏深蓝色的上半身，
// 最后再盖一层半透明蓝玻璃色，营造"人在玻璃后面"的效果
// （坐标全部相对玻璃上边缘计算，橱窗以后挪位置/改尺寸都不用再改这里）
function drawShopWindowBaker() {
  var bx = baker.x;
  var top = displayWindow.y;
  // 肩膀/身体（深蓝色调）：身体加长到玻璃下沿（top + 高度），
  // 站在橱窗里时正好"踩"在下沿上；超出玻璃的部分由裁剪去掉，不会露到墙外
  fill(60, 90, 140);
  rect(bx - 13, top + 29, 26, displayWindow.h - 29);
  // 头
  fill(70, 100, 150);
  circle(bx, top + 20, 20);
  // 厨师帽
  fill(80, 110, 160);
  ellipse(bx, top + 10, 24, 11);
  // 蓝色玻璃的覆盖层不在这里画：它要盖在蛋糕之上（见 drawDisplayGlassFront）
}

// 厨师现在是否真的在橱窗玻璃后面（决定要不要压那层蓝色玻璃）
function isBakerBehindDisplay() {
  if (baker.state === "hidden" || baker.y >= 380) {
    return false;
  }
  // 身体（半宽 13）与玻璃矩形有重叠才算
  return baker.x + 13 > displayWindow.x && baker.x - 13 < displayWindow.x + displayWindow.w;
}

// ============================================================
// 偷蛋糕：小偷在橱窗玻璃里的剪影
// 身体画在蛋糕之前（下半身被托盘挡住），双臂画在蛋糕之后（伸到蛋糕上面去拿）
// ============================================================

// 把绘制裁剪到橱窗玻璃内部（pad = 内缩像素，避免压到木框上）
function withGlassClip(pad, fn) {
  var ctx = (typeof drawingContext !== "undefined" && drawingContext) ? drawingContext : null;
  if (!ctx || typeof ctx.clip !== "function") {
    fn(); // 拿不到绘图上下文：不裁剪，至少把人画出来
    return;
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(displayWindow.x + pad, displayWindow.y + pad,
           displayWindow.w - pad * 2, displayWindow.h - pad * 2);
  ctx.clip();
  fn();
  ctx.restore();
}

// 当前姿态：踮脚抬高 / 前倾 / 双臂伸出长度（只有 stealing 阶段才有动画）
function getCakeStealPose() {
  var pose = { x: thief.x, hip: thief.y, rise: 0, lean: 0, reach: 0 };
  if (cakeSteal.phase !== "stealing") {
    return pose;
  }
  var p = (millis() - cakeSteal.startAt) / CAKE_ANIM_TIME;
  if (p < 0) { p = 0; }
  if (p > 1) { p = 1; }

  // 0 ~ 0.30：踮起脚 + 轻微前倾（向左，朝蛋糕）
  var up = p < 0.30 ? p / 0.30 : 1;
  pose.rise = CAKE_TIPTOE_RISE * up;
  pose.lean = CAKE_LEAN * up;

  // 0.15 ~ 0.55：双臂慢慢伸出去，之后保持伸直（蛋糕已经被端走）
  if (p > 0.15) {
    var k = (p - 0.15) / 0.40;
    pose.reach = CAKE_REACH * (k > 1 ? 1 : k);
  }
  return pose;
}

// 身体 + 头（在蛋糕之前画：托盘会挡住他的下半身，像真的站在陈列柜后面）
function drawThiefInGlassBody() {
  if (!thief.inBakery) {
    return;
  }
  withGlassClip(4, function () {
    var pose = getCakeStealPose();
    var x = pose.x;
    var hip = pose.hip - pose.rise;

    // 身体（小偷的深色衣服隔着蓝玻璃，画成偏蓝的深色剪影）
    fill(46, 74, 120);
    rect(x - 10, hip - 8, 20, 24);
    // 头
    fill(60, 92, 140);
    circle(x - pose.lean, hip - 18, 18);
    // 眼罩
    fill(32, 46, 78);
    rect(x - pose.lean - 9, hip - 20, 18, 5);
  });
}

// 伸出去的双臂（在蛋糕之后画，免得被托盘盖掉）：
// 两条细短线，起点压进躯干里侧，和身体之间不留缝；长度很短，只是示意"伸手"，
// 不追求真的够到蛋糕（够不到也没关系，这是个示意）
function drawThiefInGlassArms() {
  if (!thief.inBakery || cakeSteal.phase !== "stealing") {
    return;
  }
  withGlassClip(4, function () {
    var pose = getCakeStealPose();
    if (pose.reach < 1) {
      return; // 手臂还没伸出来
    }
    var x = pose.x;               // 躯干中心（前倾只带动头，躯干本身不动）
    var hip = pose.hip - pose.rise;
    var startX = x - 2;           // 起点在躯干里侧 2px：和身体连着，中间不会断开
    var tipX = startX - pose.reach;

    stroke(72, 104, 150);
    strokeWeight(2.4);
    line(startX, hip - 7, tipX, hip - 7); // 上面那条手臂（肩的高度）
    line(startX, hip - 2, tipX, hip - 2); // 下面那条手臂（胸口的高度）
    noStroke();
  });
}

// ---- 责骂特效（新增） ----

// 责骂小男孩时：厨师头部前方画两条锯齿线，
// 两条线的夹角在 90°~120° 之间来回循环摇摆，长度约为厨师与小男孩距离的 3/4；
// 两条线中间画一个红色感叹号
function drawScoldMarks() {
  if (baker.state !== "scolding") {
    return;
  }

  // 起点：厨师头部前方一点
  var hx = baker.x + 14;
  var hy = baker.y - 20;

  // 厨师与小男孩的距离
  var dx = boy.x - baker.x;
  var dy = boy.y - baker.y;
  var d = sqrt(dx * dx + dy * dy);
  var L = d * 0.75; // 每条锯齿线的长度 = 距离的 3/4

  // 摇摆的夹角：105° 为中心、15° 为幅度，来回循环（90° ~ 120°）
  var angle = radians(105 + 15 * sin(millis() / 200));

  // 面朝右：两条线分别在水平的上下两侧张开 angle/2
  drawZigzagLine(hx, hy, -angle / 2, L); // 上侧那条
  drawZigzagLine(hx, hy, angle / 2, L);  // 下侧那条

  // 红色感叹号：画在两条线中间（正右方向）大约一半的位置
  fill(220, 30, 30);
  textAlign(CENTER, CENTER);
  textSize(26);
  text("!", hx + L * 0.5, hy);
  textAlign(LEFT, TOP);
}

// 发现橱窗蛋糕不见了：厨师（站在玻璃后）头右上角冒一个红色感叹号，
// 上下轻轻跳动，持续 2 秒（时长由 NOTICE_TIME 控制，状态由 updateBaker 推进）
function drawBakerAlert() {
  if (baker.state !== "noticing" || baker.stateTimer === 0) {
    return; // 还在往橱窗走 / 时间已到，都不画
  }
  var bob = sin(millis() / 90) * 2.5;
  var ax = DISP_CX + 15;              // 头部右上角外侧
  var ay = displayWindow.y + 10 + bob;

  fill(220, 30, 30);
  textAlign(CENTER, CENTER);
  textSize(26);
  text("!", ax, ay);
  textAlign(LEFT, TOP);
}

// 画一条锯齿线：从 (x0, y0) 出发，朝 ang 方向延伸 len 长度，
// 中间分成 8 小段，每段交替向垂直方向偏移，形成锯齿形状
function drawZigzagLine(x0, y0, ang, len) {
  var segs = 8;              // 小段数量
  var segLen = len / segs;   // 每段的长度
  var perp = ang + HALF_PI;  // 垂直方向（用来做锯齿的左右偏移）
  var amp = 5;               // 锯齿偏移幅度（像素）

  noFill();
  stroke(220, 30, 30);
  strokeWeight(3);
  beginShape();
  vertex(x0, y0);
  for (var i = 1; i <= segs; i++) {
    // 奇数段向上偏、偶数段向下偏，形成锯齿
    var off = (i % 2 === 0 ? 1 : -1) * amp;
    vertex(x0 + cos(ang) * segLen * i + cos(perp) * off,
           y0 + sin(ang) * segLen * i + sin(perp) * off);
  }
  endShape();
  noStroke();
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

  // 在面包店里偷蛋糕：人不在街上，改画成橱窗玻璃里的剪影（见 drawThiefInGlass）
  if (thief.inBakery) {
    return;
  }

  // 圆形躲藏点（原来那个木桶）里：只露一小截
  // 草丛不属于这一支 —— 草丛里要画全身，下半身交给后画的 drawBush 盖住
  if (thief.hiding && !thief.inBush) {
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

  // 蛋糕已经得手：怀里抱着那块白色的三层小蛋糕（逃跑时最明显）
  if (cake.stolen) {
    drawHeldCake(thief.x, thief.y - 2);
  }

  // 移动目标点标记
  if (thief.moving) {
    noFill();
    stroke(255, 255, 255, 120);
    strokeWeight(2);
    circle(thief.targetX, thief.targetY, 14);
    noStroke();
  }
}

// 小偷怀里那块小蛋糕：只有 18px 宽的三层小方块 + 粉色、咖色小点
function drawHeldCake(cx, cy) {
  stroke(150, 112, 80);
  strokeWeight(1);
  fill(255, 253, 248);
  rect(cx - 9, cy + 4, 18, 6, 2);   // 底层
  fill(255, 253, 248);
  rect(cx - 7, cy, 14, 5, 2);       // 中层
  rect(cx - 5, cy - 4, 10, 5, 2);   // 顶层
  noStroke();
  fill(176, 126, 88);
  rect(cx - 5, cy - 4, 10, 2, 1);   // 顶上的咖色糖霜
  fill(240, 150, 178);
  circle(cx, cy + 7, 3);            // 粉色小点
  circle(cx - 3, cy + 1.5, 2);      // 粉色小点
}

// 画面最右边那条"溜走"的提示：拿到蛋糕之后才亮起来
// （整条淡淡的暖色 + 中间一个圆角小按钮：上面写"溜走"，下面是朝右的箭头）
function drawExitHint() {
  if (gameState !== "play" || !cake.stolen || escape.active) {
    return;
  }
  var x = CANVAS_W - EXIT_ZONE_W;
  var pulse = sin(millis() / 380);
  var cx = x + EXIT_ZONE_W / 2;
  var cy = 320;

  noStroke();
  fill(255, 205, 100, 26 + 14 * pulse);      // 整条底色（呼吸），提示这一竖条能点
  rect(x, 0, EXIT_ZONE_W, CANVAS_H);

  // 圆角按钮
  fill(255, 231, 160, 225);
  stroke(168, 122, 52, 220);
  strokeWeight(3);
  rect(cx - 26, cy - 68, 52, 136, 16);
  noStroke();

  // 上面的字
  fill(122, 80, 30);
  textAlign(CENTER, CENTER);
  textSize(15);
  text("溜走", cx, cy - 42);

  // 朝右的箭头
  fill(122, 80, 30);
  triangle(cx - 11, cy - 24, cx + 16, cy, cx - 11, cy + 24);

  textAlign(LEFT, TOP);
}

// 顶部状态提示（含派的状态，新增）
function drawHintText() {
  fill(255);
  textAlign(LEFT, TOP);
  textSize(14);

  var stateText;
  if (escape.active) {
    stateText = "状态：抱着三层蛋糕往画面右边冲——冲出去就赢了！";
  } else if (thief.inBakery) {
    stateText = "状态：正在店里偷蛋糕（厨师一回来就会发现你！）";
  } else if (thief.hidingInCrate) {
    stateText = "状态：藏在木箱里（厨师看不到你）";
  } else if (thief.inHouse) {
    stateText = "状态：躲在房子里（厨师看不到你，点击屋外可走出）";
  } else if (thief.inBush) {
    stateText = "状态：躲在草丛里（厨师看不到你，点草丛左右挪）";
  } else if (thief.hiding) {
    stateText = "状态：躲藏中（厨师看不到你）";
  } else if (thiefHasRat()) {
    stateText = "状态：手里提着老鼠（靠近左边窗户，点窗口的圆圈把它甩到窗台上）";
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
  } else if (baker.state === "toBoyScold") {
    bakerText = "厨师：走向小男孩";
  } else if (baker.state === "scolding") {
    bakerText = "厨师：正在责骂小男孩";
  } else if (baker.state === "noticing") {
    bakerText = "厨师：发现橱窗里的蛋糕不见了！";
  } else if (baker.state === "chasingRat") {
    bakerText = "厨师：发现了窗台上的老鼠，冲过去了！";
  } else if (baker.state === "chasingInside") {
    bakerText = "厨师：把派一丢，正从店里冲出来追老鼠";
  } else if (baker.state === "chasingOut") {
    bakerText = "厨师：正追着老鼠往街那头跑";
  } else if (baker.state === "offscreen") {
    bakerText = "厨师：追着老鼠跑出了画面";
  } else if (baker.state === "comingBack") {
    bakerText = "厨师：从街那头走回来了";
  } else if (baker.state === "patrolAll") {
    bakerText = "厨师：全线巡逻中（不再回店里放派）";
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
  } else if (boy.state === "returning") {
    boyText = "小男孩：放下派，正跑回风车";
  } else if (boy.state === "inside") {
    boyText = "小男孩：已经回到风车里";
  } else {
    boyText = "小男孩：站在风车左边";
  }
  text(boyText, 10, 68);

  // 老鼠的状态（新剧情）
  var ratText;
  if (rat.state === "none") {
    ratText = "老鼠：还没出现（小男孩丢下派 3 秒后，它从画面右边溜过来）";
  } else if (rat.state === "waiting") {
    ratText = "老鼠：正从右边赶来……";
  } else if (rat.state === "coming") {
    ratText = "老鼠：正沿着地面溜向那个派";
  } else if (rat.state === "eating") {
    ratText = "老鼠：正在啃派（点它可以抓）";
  } else if (rat.state === "walking") {
    ratText = "老鼠：小偷正悄悄靠近它";
  } else if (rat.state === "lifting") {
    ratText = "老鼠：被提着尾巴举在半空，左右摆动";
  } else {
    ratText = "老鼠：已经在小偷手里";
  }
  text(ratText, 10, 88);

  // 偷蛋糕的时机提示：只在"厨师在外面、正往小男孩那边去（或已经在骂）
  // 且蛋糕还在、还没开始偷"时出现一行
  if (isCakeChance() && !cake.stolen && cakeSteal.phase === "none") {
    text("机会：厨师在屋外 —— 点橱窗里的三层蛋糕偷走它", 10, 108);
  }
  // 逃跑提示：蛋糕到手之后，点画面最右边就能溜走通关
  if (cake.stolen && !escape.active) {
    text("逃跑：点画面最右边那条（黄色箭头）带着蛋糕溜出画面 = 通关", 10, 128);
  }
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

// ---------------- 通关界面（新） ----------------
// 小偷抱着三层蛋糕跑出画面右边 -> 画面定格 + 压暗，中央弹一个方框：
// 上面一行 "You've done it!"，下面画一块白色的三层蛋糕（粉色 + 咖色裱花）。

function drawWinScreen() {
  // 弹出动画：0.24 秒里从 88% 放大到 100%，压暗也跟着一起亮起来
  var p = constrain((millis() - winShownAt) / 240, 0, 1);
  var e = 1 - (1 - p) * (1 - p);        // easeOut
  var k = 0.88 + 0.12 * e;

  // 压暗整个场景（让方框跳出来）
  noStroke();
  fill(25, 18, 12, 155 * e);
  rect(0, 0, CANVAS_W, CANVAS_H);

  var bw = WIN_BOX_W;
  var bh = WIN_BOX_H;
  var bx = (CANVAS_W - bw) / 2;
  var by = (CANVAS_H - bh) / 2 - 8;

  // 以方框中心为原点缩放（弹出）
  push();
  translate(CANVAS_W / 2, by + bh / 2);
  scale(k);
  translate(-CANVAS_W / 2, -(by + bh / 2));

  // 投影
  fill(0, 0, 0, 70);
  rect(bx + 8, by + 10, bw, bh, 20);

  // 方框本体：奶油色底 + 咖色木框 + 里面一圈浅描边
  fill(252, 243, 228);
  stroke(150, 108, 74);
  strokeWeight(5);
  rect(bx, by, bw, bh, 20);
  noFill();
  stroke(214, 180, 148);
  strokeWeight(2);
  rect(bx + 11, by + 11, bw - 22, bh - 22, 14);
  noStroke();

  // 标题
  fill(96, 64, 40);
  textAlign(CENTER, CENTER);
  textSize(42);
  text("You've done it!", CANVAS_W / 2, by + 60);

  // 蛋糕
  drawWinCake(CANVAS_W / 2, by + 118);

  // 底部提示（呼吸闪烁）
  var a = 150 + sin(millis() / 300) * 80;
  fill(140, 116, 96, a);
  textSize(16);
  text("点击任意位置再玩一次", CANVAS_W / 2, by + bh - 30);

  pop();                 // 结束弹出缩放的坐标系
  textAlign(LEFT, TOP);
}

// 通关方框里的那块蛋糕：白色三层，顶层咖色糖霜 + 粉色花朵，每层粉色糖珠
function drawWinCake(cx, topY) {
  var w1 = 170, h1 = 38;   // 底层
  var w2 = 128, h2 = 34;   // 中层
  var w3 = 90,  h3 = 30;   // 顶层
  var y3 = topY;           // 顶层顶
  var y2 = y3 + h3;        // 中层顶
  var y1 = y2 + h2;        // 底层顶

  // 盘子（先画，压在蛋糕下面）
  fill(255, 252, 243);
  stroke(170, 130, 98);
  strokeWeight(2);
  ellipse(cx, y1 + h1 + 6, w1 + 32, 16);
  noStroke();

  // 三层（从下往上摞，每层自己带裱花）
  drawCakeTier(cx, y1, w1, h1);
  drawCakeTier(cx, y2, w2, h2);
  drawCakeTier(cx, y3, w3, h3);

  // 顶层再补一朵粉色的花
  fill(243, 156, 182);
  circle(cx, y3 - 8, 17);
  fill(250, 202, 216);
  circle(cx - 4, y3 - 11, 8);
}

// 单层蛋糕：白色奶油 + 咖色糖霜（上沿一排小圆，下缘呈波浪）+ 粉色糖珠
function drawCakeTier(cx, topY, w, h) {
  fill(255, 253, 248);
  stroke(170, 130, 98);
  strokeWeight(2);
  rect(cx - w / 2, topY, w, h, 7);
  noStroke();

  // 咖色糖霜：沿上沿排一排小圆，连成波浪边
  fill(176, 126, 88);
  for (var x = cx - w / 2 + 6; x <= cx + w / 2 - 6; x = x + 12) {
    circle(x, topY + 6, 13);
  }
  // 粉色糖珠：中间一排
  fill(240, 150, 178);
  for (var x2 = cx - w / 2 + 16; x2 <= cx + w / 2 - 16; x2 = x2 + 18) {
    circle(x2, topY + h * 0.66, 9);
  }
}

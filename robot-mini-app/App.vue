<script>
export default {
  onLaunch() {
    const user = uni.getStorageSync('userInfo')
    if (user && user.id) console.log('已登录:', user.nickname)
  }
}
</script>

<style>
page {
  background: linear-gradient(180deg, #EEF6F8 0%, #F4F8F9 40%, #F4F8F9 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  color: #24414A;
}
.container { padding: 24rpx 30rpx; }
.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(18, 168, 160, 0.1);
}
.section-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #0B3B48;
  margin-bottom: 24rpx;
}
.btn-primary {
  background: linear-gradient(135deg, #12A8A0 0%, #2D9CDB 100%);
  color: #fff;
  border: none;
  border-radius: 50rpx;
  font-size: 30rpx;
  font-weight: 600;
  padding: 22rpx 0;
  text-align: center;
  box-shadow: 0 8rpx 24rpx rgba(18, 168, 160, 0.32);
}
.tag { display: inline-block; font-size: 22rpx; padding: 6rpx 18rpx; border-radius: 20rpx; background: rgba(18,168,160,0.1); color: #12A8A0; }
.tag-success { background: rgba(39,174,96,0.12); color: #27AE60; }
.tag-warning { background: rgba(242,153,74,0.14); color: #F2994A; }
.fade-in { animation: fadeIn 0.55s ease forwards; opacity: 0; }
/* #ifdef H5 */
/* 底部 tabBar 改造为顶部导航栏（仅 H5，小程序端不受影响） */
uni-tabbar {
  top: 0 !important;
  bottom: auto !important;
  height: 52px !important;
}
uni-tabbar .uni-tabbar {
  top: 0 !important;
  bottom: auto !important;
  height: 52px !important;
  background: rgba(255, 255, 255, 0.96) !important;
  border-bottom: 1px solid rgba(11, 59, 72, 0.08);
  box-shadow: 0 6px 20px rgba(11, 59, 72, 0.06);
  align-items: center;
  z-index: 999;
}
uni-tabbar .uni-tabbar__item { height: 52px !important; flex: 1; }
uni-tabbar .uni-tabbar__bd {
  height: auto !important;
  width: 100% !important;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 4px;
  border-radius: 999px;
}
/* 项目内置 tab 图标为占位图，顶栏改为纯文字胶囊 */
uni-tabbar .uni-tabbar__icon { display: none !important; }
uni-tabbar .uni-tabbar__label { font-size: 13px !important; margin-top: 0 !important; }
uni-tabbar .uni-tabbar__item:has(img[src*="-active"]) .uni-tabbar__bd { background: rgba(18, 168, 160, 0.1); }
/* 有 tabBar 的页面让出顶部导航高度（排除二级页里 display:none 的隐藏节点） */
#app uni-app:has(> uni-tabbar:not([style*="display: none"])) uni-page-body { padding-top: 52px; }

/* PC 端适配：内容区限宽居中；rpx 固定按 750 设计稿换算，避免宽屏下元素被整体放大 */
@media screen and (min-width: 750px) {
  html { font-size: 22.19px !important; } /* 750rpx = 520px，1rpx ≈ 0.69px */
  body { background: #E3EFF3; }
  uni-app {
    max-width: none;
    margin: 0;
    background: #F4F8F9;
    box-shadow: none;
  }
  uni-tabbar .uni-tabbar {
    left: 0 !important;
    right: 0 !important;
    transform: none !important;
    width: 100% !important;
    max-width: none;
  }
  /* 顶栏横向胶囊样式 */
  uni-tabbar .uni-tabbar { height: 60px !important; justify-content: center; gap: 6px; }
  uni-tabbar .uni-tabbar__item { height: 60px !important; flex: 0 0 auto; width: auto !important; padding: 0 6px; }
  uni-tabbar .uni-tabbar__bd { width: auto !important; padding: 8px 20px; }
  uni-tabbar .uni-tabbar__label { font-size: 14px !important; }
  uni-tabbar .uni-tabbar::before {
    content: '社区健康守护 · 居民端';
    position: absolute;
    left: 24px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 15px;
    font-weight: 700;
    color: #0B3B48;
  }
  #app uni-app:has(> uni-tabbar:not([style*="display: none"])) uni-page-body { padding-top: 60px; }
  /* 聊天等全屏页：PC 上不需要模拟状态栏高度 */
  #app .chat-page .chat-header { padding-top: 24px; }
  /* 二级页：页面铺满，内容区用最大宽度保持可读性 */
  #app uni-page-body > uni-view:not(.home-page):not(.chat-page):not(.login-page) {
    max-width: none;
    margin: 0;
    padding-left: 28px;
    padding-right: 28px;
    box-sizing: border-box;
  }
  #app uni-page-body > uni-view:not(.home-page):not(.chat-page):not(.login-page) > uni-view {
    width: 100%;
    max-width: 1080px;
    margin-left: auto;
    margin-right: auto;
    box-sizing: border-box;
  }
  /* 聊天页铺满视口：取消站点级限宽、居中留白与外框阴影 */
  #app uni-app:has(uni-view.chat-page) {
    max-width: none !important;
    margin: 0 !important;
    box-shadow: none !important;
    background: #E9F3F5 !important;
  }
  #app uni-app:has(uni-view.chat-page) uni-page-body > uni-view.chat-page {
    max-width: none !important;
    margin: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }
}

/* 宽屏首页：≥750px 两栏栅格；≥1100px 再切三栏，避免铺满后单列被拉散 */
@media screen and (min-width: 750px) {
  uni-tabbar .uni-tabbar { width: 100% !important; justify-content: center; }

  #app .home-page {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-areas:
      "nav nav"
      "banner stats"
      "vitals quick"
      "notices progress"
      "cate cate"
      "drug drug"
      "learn learn";
    gap: 18px;
    padding: 18px;
    padding-bottom: 78px; /* 预留底部导航高度，避免内容被遮挡 */
    box-sizing: border-box;
    align-items: start;
  }
  #app .home-page > .nav-bar { grid-area: nav; border-radius: 16px; overflow: hidden; }
  #app .home-page > .banner-section { grid-area: banner; margin: 0; }
  #app .home-page > .stats-card { grid-area: stats; margin: 0; }
  #app .home-page > .quick-grid { grid-area: quick; margin: 0; flex-direction: column; gap: 8px; }
  #app .home-page > .notices-card { grid-area: notices; margin: 0; }
  #app .home-page > .vitals-card { grid-area: vitals; margin: 0; }
  #app .home-page > .cate-card { grid-area: cate; margin: 0; }
  #app .home-page > .drug-strip { grid-area: drug; margin: 0; }
  #app .home-page > .learn-card { grid-area: learn; margin: 0; }
  #app .home-page > .progress-card { grid-area: progress; margin: 0; }

  #app .home-page .main-swiper { height: 300px; }
  #app .home-page .stats-card { display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: auto; align-content: center; row-gap: 56px; padding: 16px 0; }
  #app .home-page > .stats-card { align-self: stretch; }
  #app .home-page .stat-item { border-right: none; }
  #app .home-page .quick-cell { display: flex; align-items: center; gap: 10px; padding: 7px 14px; text-align: left; }
  #app .home-page .quick-icon { margin: 0; flex-shrink: 0; width: 36px; height: 36px; border-radius: 10px; font-size: 18px; }
  #app .home-page .learn-card { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); column-gap: 20px; }
  #app .home-page .learn-card .card-head { grid-column: 1 / -1; }
  #app .home-page .learn-item { border-bottom: none; }
  #app .home-page .notice-title {
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  #app .home-page .vitals-grid { display: block; }
  #app .home-page .vital-item {
    display: grid; grid-template-columns: 56px auto auto; justify-content: start; align-items: center;
    gap: 0 14px; padding: 8px 0;
    background: transparent; border-radius: 0;
    text-align: left; border-bottom: 1px dashed #EDF2F4;
  }
  #app .home-page .vital-item:last-child { border-bottom: none; }
  #app .home-page .vital-label { flex: none; }
  #app .home-page .vital-val { margin: 0; flex: none; }
  #app .home-page .vital-state { flex-shrink: 0; justify-self: start; }
  #app .home-page .cate-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
}

/* 超宽屏：首页三栏，轮播占两栏 */
@media screen and (min-width: 1100px) {
  #app .home-page {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1.15fr) minmax(0, 0.9fr);
    grid-template-areas:
      "nav nav nav"
      "banner banner stats"
      "vitals quick notices"
      "cate cate progress"
      "drug drug drug"
      "learn learn learn";
  }
}
/* #endif */
@keyframes fadeIn { from { opacity: 0; transform: translateY(24rpx); } to { opacity: 1; transform: translateY(0); } }
@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-12rpx)} 75%{transform:translateX(12rpx)} }
.shake { animation: shake 0.4s ease; }
@keyframes floatUp { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-100rpx)} }
.float-points { animation: floatUp 1.6s ease forwards; }
</style>

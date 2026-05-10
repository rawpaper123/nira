const app = getApp();
const util = require('../../utils/util');

Page({
    data: {
        countdown: { days: 0, hours: 0, minutes: 0, seconds: 0 },
        profileComplete: false,
        hasMatch: false,
        joinedQueue: false,
        isLoggedIn: false,
    },

    timer: null,

    onLoad() {
        this.refreshState();
    },

    onShow() {
        this.refreshState();
        this.startCountdown();
    },

    onUnload() {
        if (this.timer) clearInterval(this.timer);
    },

    onHide() {
        if (this.timer) clearInterval(this.timer);
    },

    refreshState() {
        const profileComplete = app.isProfileComplete();
        const hasMatch = !!app.getCurrentMatch();
        const joinedQueue = app.isJoinedQueue();
        const isLoggedIn = app.isLoggedIn();

        this.setData({
            profileComplete,
            hasMatch,
            joinedQueue,
            isLoggedIn,
        });
    },

    startCountdown() {
        if (this.timer) clearInterval(this.timer);
        const update = () => {
            const target = util.getNextMonday();
            this.setData({ countdown: util.getCountdown(target) });
        };
        update();
        this.timer = setInterval(update, 1000);
    },

    onStartTap() {
        if (!app.isLoggedIn()) {
            wx.navigateTo({ url: '/pages/login/phone/index' });
            return;
        }
        wx.navigateTo({ url: '/pages/chat/chat' });
    },

    onPhoneLogin() {
        wx.navigateTo({ url: '/pages/login/phone/index' });
    },

    onViewMatch() {
        wx.navigateTo({ url: '/pages/match/match' });
    },

    onFindMatch() {
        if (!app.isLoggedIn()) {
            wx.navigateTo({ url: '/pages/login/phone/index' });
            return;
        }
        wx.navigateTo({ url: '/pages/chat/chat' });
    },
});

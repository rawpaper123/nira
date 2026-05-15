const app = getApp();
const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
    data: {
        countdown: { days: 0, hours: 0, minutes: 0, seconds: 0 },
        profileComplete: false,
        hasMatch: false,
        joinedQueue: false,
        isLoggedIn: false,
        isRestoringProfile: false,
    },

    timer: null,

    onLoad() {
        this.refreshState();
    },

    onShow() {
        this.refreshState();
        this.restoreRemoteProfile();
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

    async restoreRemoteProfile() {
        if (!app.isLoggedIn() || app.isProfileComplete()) return;

        this.setData({ isRestoringProfile: true });
        try {
            const profile = await api.getProfile(app.getUserId());
            app.setProfile(profile);
            this.refreshState();
        } catch (err) {
            // 404 表示还没完成 onboarding，保持首页未完成状态即可。
        } finally {
            this.setData({ isRestoringProfile: false });
        }
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

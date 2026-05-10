const api = require('../../../utils/api');
const app = getApp();

Page({
    data: {
        phone: '',
        code: '',
        inviteCode: 'NIRA2026',
        countdown: 0,
        loading: false,
        phoneValid: false,
        canLogin: false,
        isReturning: false,
    },

    timer: null,

    onUnload() {
        if (this.timer) clearInterval(this.timer);
    },

    onPhoneInput(e) {
        const phone = e.detail.value;
        const phoneValid = /^1\d{10}$/.test(phone);
        this.setData({ phone, phoneValid, canLogin: phoneValid && this.data.code.length >= 4 });
    },

    onCodeInput(e) {
        const code = e.detail.value;
        this.setData({ code, canLogin: this.data.phoneValid && code.length >= 4 });
    },

    onInviteCodeInput(e) {
        this.setData({ inviteCode: e.detail.value.trim().toUpperCase() });
    },

    onSendCode() {
        if (this.data.countdown > 0 || !this.data.phoneValid) return;

        api.sendVerificationCode(this.data.phone).then((res) => {
            if (res.success === false) {
                wx.showToast({ title: res.detail || '发送失败', icon: 'none' });
                return;
            }
            wx.showToast({ title: '验证码已发送', icon: 'none' });
            this.startCountdown();
        }).catch((err) => {
            wx.showToast({ title: err.message || '发送失败', icon: 'none' });
        });
    },

    startCountdown() {
        this.setData({ countdown: 60 });
        this.timer = setInterval(() => {
            if (this.data.countdown <= 1) {
                clearInterval(this.timer);
                this.timer = null;
                this.setData({ countdown: 0 });
            } else {
                this.setData({ countdown: this.data.countdown - 1 });
            }
        }, 1000);
    },

    onLogin() {
        if (!this.data.canLogin || this.data.loading) return;

        this.setData({ loading: true });
        const openid = app.getOpenId();

        api.verifyCodeAndLogin(this.data.phone, this.data.code, openid, this.data.inviteCode).then((data) => {
            if (!data.success) {
                wx.showToast({ title: data.detail || '登录失败', icon: 'none' });
                this.setData({ loading: false });
                return;
            }

            app.loginWithPhone({
                phone: this.data.phone,
                openid: data.openid || openid,
                userId: data.user_id,
                token: data.token,
            });

            if (data.invite_code) {
                wx.setStorageSync('my_invite_code', data.invite_code);
            }

            wx.showToast({ title: data.detail || '登录成功', icon: 'success' });

            setTimeout(() => {
                if (getCurrentPages().length > 1) {
                    wx.navigateBack();
                } else {
                    wx.reLaunch({ url: '/pages/index/index' });
                }
            }, 1200);
        }).catch((err) => {
            wx.showToast({ title: err.message || '登录失败', icon: 'none' });
        }).finally(() => {
            this.setData({ loading: false });
        });
    },
});

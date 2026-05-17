const api = require('../../utils/api');
const app = getApp();

Page({
    data: {
        groupId: '',
        matchId: '',
        noGroup: false,
        groupName: 'Nira 活动搭子小队',
        welcomeMessage: '',
        icebreakerQuestions: [],
        activitySummary: null,
        members: [],
        status: '',
        waiting: false,
        bothAccepted: false,
        planTitle: '',
        planLocation: '',
        planTime: '',
        messages: [],
        inputValue: '',
        myName: '',
        otherName: '',
    },

    onLoad(options) {
        const cachedGroup = app.getGroupInfo();
        const groupId = (options && options.group_id) || (cachedGroup && cachedGroup.group_id) || '';
        const matchId = (options && (options.match_id || options.matchId)) || (cachedGroup && cachedGroup.match_id) || '';
        const myName = wx.getStorageSync('nira_preferred_name') || '我';
        const match = app.getCurrentMatch();
        const otherName = (match && (match.matched_user_name || match.user_b_nickname)) || '活动搭子';

        this.setData({
            groupId,
            matchId,
            myName,
            otherName,
            waiting: false,
        });

        const activityPlan = app.getActivityPlan();
        const plan = (activityPlan && activityPlan.plan) || {};
        this.setData({
            planTitle: plan.title || '活动群聊',
            planLocation: plan.suggested_location || plan.location || '',
            planTime: plan.suggested_time || '',
        });

        if (cachedGroup) {
            this.applyGroupInfo(cachedGroup);
        }

        if (groupId) {
            this.loadGroupMessages();
            this.startPolling();
        } else if (!cachedGroup) {
            this.setData({
                noGroup: true,
                welcomeMessage: '还没有确认活动安排，等匹配和活动都准备好后再进入这里。',
                messages: [this._systemMsg('Nira', '还没有可进入的活动小队，先回到匹配页确认安排。')],
            });
        }
    },

    onUnload() {
        this.stopPolling();
    },

    async loadGroupMessages() {
        const groupId = this.data.groupId;
        if (!groupId) return;

        try {
            const info = await api.getGroupInfo(groupId);
            if (info && !info.error) {
                this.applyGroupInfo(info);
                app.setGroupInfo(info);
            }
        } catch (err) {
            console.log('getGroupInfo failed, using local group cache:', err.message);
            if (!this.data.messages.length) {
                this.initLocalMessages();
            }
        }
    },

    applyGroupInfo(info) {
        const summary = info.activity_summary || {};
        const messages = info.messages && info.messages.length ? info.messages : this._initialMessages(info);
        this.setData({
            noGroup: !info.group_id,
            groupId: info.group_id || this.data.groupId,
            matchId: info.match_id || this.data.matchId,
            groupName: info.group_name || 'Nira 活动搭子小队',
            welcomeMessage: info.welcome_message || '',
            icebreakerQuestions: info.icebreaker_questions || [],
            activitySummary: summary,
            members: info.members || [],
            status: info.status || '',
            messages,
            bothAccepted: info.both_accepted || info.status === 'group_created' || info.status === 'local_group_created',
            waiting: false,
            planTitle: summary.title || this.data.planTitle,
            planLocation: summary.suggested_location || this.data.planLocation,
            planTime: summary.suggested_time || this.data.planTime,
        });
    },

    _initialMessages(info) {
        const welcome = info.welcome_message || '你们这次的见面已经安排好啦。先不用急着尬聊，Nira 给你们准备了几个轻松开场。';
        return [this._systemMsg('Nira', welcome)];
    },

    initLocalMessages() {
        this.setData({
            messages: [
                this._systemMsg('Nira', this.data.welcomeMessage || '你们这次的见面已经安排好啦。先不用急着尬聊，Nira 给你们准备了几个轻松开场。'),
            ],
        });
    },

    _systemMsg(sender, content) {
        const d = new Date();
        return {
            id: Date.now() + '_' + Math.random(),
            sender,
            content,
            isSystem: true,
            time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
        };
    },

    startPolling() {
        this._pollTimer = setInterval(() => {
            if (!this.data.bothAccepted && this.data.groupId) {
                this.loadGroupMessages();
            }
        }, 5000);
    },

    stopPolling() {
        if (this._pollTimer) {
            clearInterval(this._pollTimer);
            this._pollTimer = null;
        }
    },

    onInputChange(e) {
        this.setData({ inputValue: e.detail.value });
    },

    async onSend() {
        const text = this.data.inputValue.trim();
        if (!text) return;

        const d = new Date();
        const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        const myMsg = {
            id: Date.now() + '_me',
            sender: this.data.myName,
            content: text,
            isSystem: false,
            isMe: true,
            isOther: false,
            time,
        };

        this.setData({ messages: this.data.messages.concat([myMsg]), inputValue: '' });

        try {
            if (this.data.groupId) {
                await api.sendGroupMessage(this.data.groupId, this.data.myName, text);
            }
        } catch (err) {
            console.log('sendGroupMessage failed:', err.message);
        }

        this.simulateReply();
    },

    simulateReply() {
        setTimeout(() => {
            const replies = [
                '可以可以，这个安排挺轻松的。',
                '我也觉得先散步/逛逛就好，不用太赶。',
                '那到时候我们先按这个时间碰头？',
                '最近刚好想试试这种低压力活动。',
                '稳的，见面前有变化就在这里说。',
            ];
            const d = new Date();
            const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            const replyMsg = {
                id: Date.now() + '_other',
                sender: this.data.otherName,
                content: replies[Math.floor(Math.random() * replies.length)],
                isSystem: false,
                isMe: false,
                isOther: true,
                time,
            };

            this.setData({ messages: this.data.messages.concat([replyMsg]) });
        }, 1500 + Math.random() * 2000);
    },

    onGoHome() {
        wx.switchTab({ url: '/pages/index/index' });
    },
});

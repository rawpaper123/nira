const app = getApp();

Page({
    data: {
        planTitle: '',
        planLocation: '',
        planTime: '',
        groupWelcome: '',
        messages: [],
        inputValue: '',
    },

    onLoad() {
        const match = app.getCurrentMatch();
        const activityPlan = app.getActivityPlan();

        const plan = (activityPlan && activityPlan.plan) || {};
        const welcome = (activityPlan && activityPlan.groupWelcome) || '';

        this.setData({
            planTitle: plan.title || '活动已创建',
            planLocation: plan.location || '',
            planTime: plan.suggested_time || '',
            groupWelcome: welcome,
        });

        // Build welcome messages
        const msgs = [
            { sender: 'Nira AI', content: '大家好！我是 Nira 的小助手 🤖', isSystem: true, time: this.getTime() },
            { sender: 'Nira AI', content: '已经为你们安排好活动啦～快互相认识一下吧！', isSystem: true, time: this.getTime() },
        ];

        if (welcome) {
            msgs.push({ sender: 'Nira AI', content: welcome, isSystem: true, time: this.getTime() });
        }

        if (match) {
            msgs.push({
                sender: match.user_b_nickname || '活动搭子',
                content: '嗨！很高兴认识你～期待周末的活动！',
                isSystem: false,
                isOther: true,
                time: this.getTime(),
            });
        }

        this.setData({ messages: msgs });
    },

    getTime() {
        const d = new Date();
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    },

    onInputChange(e) {
        this.setData({ inputValue: e.detail.value });
    },

    onSend() {
        const text = this.data.inputValue.trim();
        if (!text) return;

        const msgs = this.data.messages;
        msgs.push({
            sender: '我',
            content: text,
            isSystem: false,
            isMe: true,
            time: this.getTime(),
        });
        this.setData({ messages: msgs, inputValue: '' });

        // Simulate partner reply after 2s
        const match = app.getCurrentMatch();
        if (match) {
            setTimeout(() => {
                const replies = [
                    '哈哈好的！到时候见～',
                    '我也是！超期待的',
                    '可以的可以的，到时候一起聊天～',
                ];
                const msgs2 = this.data.messages;
                msgs2.push({
                    sender: match.user_b_nickname || '活动搭子',
                    content: replies[Math.floor(Math.random() * replies.length)],
                    isSystem: false,
                    isOther: true,
                    time: this.getTime(),
                });
                this.setData({ messages: msgs2 });
            }, 2000);
        }
    },

    onGoHome() {
        wx.reLaunch({ url: '/pages/index/index' });
    },
});

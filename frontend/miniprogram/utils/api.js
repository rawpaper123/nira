/**
 * Nira API 封装层
 * - 延迟获取 apiBase，避免模块加载时 getApp() 为空
 * - 统一 loading / 错误处理 / token 注入
 */

function getApiBase() {
    const app = getApp();
    return (app && app.globalData && app.globalData.apiBase) || 'http://localhost:8000';
}

function getToken() {
    return wx.getStorageSync('token') || '';
}

function request(options) {
    return new Promise((resolve, reject) => {
        const showLoading = options.loading !== false;
        if (showLoading) {
            wx.showLoading({ title: options.loadingText || '加载中...', mask: true });
        }

        const header = { 'Content-Type': 'application/json' };
        const token = getToken();
        if (token) header['Authorization'] = `Bearer ${token}`;

        wx.request({
            url: `${getApiBase()}${options.url}`,
            method: options.method || 'GET',
            data: options.data || {},
            header: { ...header, ...options.header },
            timeout: options.timeout || 10000,
            success(res) {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(res.data);
                } else {
                    const msg = (res.data && res.data.detail) || `请求失败 (${res.statusCode})`;
                    if (options.silent !== true) showError(msg);
                    reject(new Error(msg));
                }
            },
            fail(err) {
                if (options.silent !== true) showError('网络连接失败');
                reject(err);
            },
            complete() {
                if (showLoading) wx.hideLoading();
            },
        });
    });
}

function showError(msg) {
    wx.showToast({ title: msg, icon: 'none', duration: 2500 });
}

/**
 * POST /api/v1/profile/build
 */
function buildProfile(userId, rawInput) {
    return request({
        url: '/api/v1/profile/build',
        method: 'POST',
        loadingText: 'AI 正在分析你的画像...',
        data: { user_id: userId, raw_input: rawInput },
    });
}

/**
 * GET /api/v1/profile/{userId}
 */
function getProfile(userId) {
    return request({
        url: `/api/v1/profile/${userId}`,
        method: 'GET',
        loading: false,
        silent: true,
    });
}

/**
 * POST /api/v1/profile/chat
 * Dynamic onboarding chat: backend returns reply + profile_patch + completion.
 */
function profileChat(userId, message, conversationId) {
    return request({
        url: '/api/v1/profile/chat',
        method: 'POST',
        loading: false,
        data: {
            user_id: userId,
            message: message,
            conversation_id: conversationId || '',
        },
    });
}

/**
 * POST /api/v1/match/join-queue
 * 加入本周匹配队列
 */
function joinQueue(userId, profile) {
    return request({
        url: '/api/v1/match/join-queue',
        method: 'POST',
        loadingText: '加入队列中...',
        data: { user_id: userId, profile: profile },
    });
}

/**
 * POST /api/v1/match/weekly
 */
function weeklyMatch(userId, city) {
    return request({
        url: '/api/v1/match/weekly',
        method: 'POST',
        loadingText: '正在看看这周有没有合适搭子...',
        data: { user_id: userId, city: city || '上海' },
    });
}

const runWeeklyMatch = weeklyMatch;
const triggerWeeklyMatch = weeklyMatch;

/**
 * GET /api/v1/match/result/{userId}
 */
function getMatchResult(userId) {
    return request({
        url: `/api/v1/match/result/${userId}`,
        method: 'GET',
        loading: false,
        silent: true,
    });
}

/**
 * POST /api/v1/schedule/arrange
 */
function arrangeActivity(matchId) {
    return request({
        url: '/api/v1/schedule/arrange',
        method: 'POST',
        loadingText: 'AI 正在策划活动方案...',
        data: { match_id: matchId },
    });
}

/**
 * POST /api/v1/schedule/arrange-simple
 * 轻量版：不需要数据库，直接用 profile + compatibility 生成
 */
function arrangeActivitySimple(data) {
    return request({
        url: '/api/v1/schedule/arrange-simple',
        method: 'POST',
        loadingText: '正在安排活动...',
        data: data,
    });
}

const arrangeSimple = arrangeActivitySimple;

/**
 * POST /api/v1/schedule/confirm
 * 确认活动安排并创建本地 mock group
 */
function confirmSchedule(data) {
    return request({
        url: '/api/v1/schedule/confirm',
        method: 'POST',
        loadingText: '确认安排中...',
        data: data,
    });
}

/**
 * POST /api/v1/test/match
 */
function testMatch(userAInput, userBInput, city) {
    return request({
        url: '/api/v1/test/match',
        method: 'POST',
        loadingText: 'AI 正在模拟匹配...',
        data: {
            user_a_input: userAInput,
            user_b_input: userBInput,
            city: city || '上海',
        },
    });
}

/**
 * GET /health
 */
function healthCheck() {
    return request({
        url: '/health',
        method: 'GET',
        loading: false,
        silent: true,
    });
}

/**
 * POST /api/v1/push/subscribe
 */
function subscribeNotification(userId, openid) {
    return request({
        url: '/api/v1/push/subscribe',
        method: 'POST',
        loading: false,
        data: { user_id: userId, openid: openid || '' },
    });
}

/**
 * POST /api/v1/push/match-result
 */
function sendMatchPush(userId, matchId) {
    return request({
        url: '/api/v1/push/match-result',
        method: 'POST',
        loading: false,
        data: { user_id: userId, match_id: matchId },
    });
}

/**
 * POST /api/v1/push/test-match-result
 */
function testMatchPush(openid, options) {
    return request({
        url: '/api/v1/push/test-match-result',
        method: 'POST',
        loadingText: 'Sending test push...',
        data: {
            openid: openid || '',
            match_id: (options && options.matchId) || 'test-match-001',
            score: (options && options.score) || 88,
            nickname: (options && options.nickname) || 'Nira partner',
        },
    });
}
/**
 * POST /api/v1/match/accept
 * 接受匹配
 */
function acceptMatch(matchId, userId, role) {
    return request({
        url: '/api/v1/match/accept',
        method: 'POST',
        loadingText: '确认中...',
        data: { match_id: matchId, user_id: userId, role: role || 'a' },
    });
}

/**
 * POST /api/v1/match/reject
 * 拒绝匹配
 */
function rejectMatch(matchId, userId) {
    return request({
        url: '/api/v1/match/reject',
        method: 'POST',
        loading: false,
        data: { match_id: matchId, user_id: userId },
    });
}

/**
 * GET /api/v1/match/group/{groupId}
 * 获取群聊信息
 */
function getGroupInfo(groupId) {
    return request({
        url: `/api/v1/match/group/${groupId}`,
        method: 'GET',
        loading: false,
        silent: true,
    });
}

const getGroup = getGroupInfo;
const readGroup = getGroupInfo;

/**
 * POST /api/v1/match/group/send
 * 发送群聊消息
 */
function sendGroupMessage(groupId, sender, content) {
    return request({
        url: '/api/v1/match/group/send',
        method: 'POST',
        loading: false,
        silent: true,
        data: { group_id: groupId, sender: sender, content: content },
    });
}

/**
 * POST /api/v1/auth/login
 * wx.login code 换取 openid
 */
function login(code) {
    return request({
        url: '/api/v1/auth/login',
        method: 'POST',
        loading: false,
        silent: true,
        data: { code: code },
    });
}

/**
 * POST /api/v1/auth/send-verification-code
 * 发送手机验证码
 */
function sendVerificationCode(phone) {
    return request({
        url: '/api/v1/auth/send-verification-code',
        method: 'POST',
        loadingText: '发送中...',
        data: { phone: phone },
    });
}

/**
 * POST /api/v1/auth/verify-code-and-login
 * 验证码登录（绑定 openid，新用户需传 invite_code）
 */
function verifyCodeAndLogin(phone, code, openid, inviteCode) {
    const data = { phone: phone, code: code, openid: openid || '' };
    if (inviteCode) data.invite_code = inviteCode;
    return request({
        url: '/api/v1/auth/verify-code-and-login',
        method: 'POST',
        loading: false,
        data: data,
    });
}

module.exports = {
    request,
    login,
    sendVerificationCode,
    verifyCodeAndLogin,
    buildProfile,
    profileChat,
    getProfile,
    joinQueue,
    subscribeNotification,
    weeklyMatch,
    runWeeklyMatch,
    triggerWeeklyMatch,
    getMatchResult,
    arrangeActivity,
    arrangeActivitySimple,
    arrangeSimple,
    confirmSchedule,
    testMatch,
    healthCheck,
    sendMatchPush,
    testMatchPush,
    acceptMatch,
    rejectMatch,
    getGroupInfo,
    getGroup,
    readGroup,
    sendGroupMessage,
};

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
        loadingText: 'AI 正在寻找最佳搭子...',
        data: { user_id: userId, city: city || '上海' },
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

module.exports = {
    request,
    buildProfile,
    joinQueue,
    weeklyMatch,
    arrangeActivity,
    testMatch,
    healthCheck,
};

const APPID = process.env.WECHAT_APP_ID!;
const SECRET = process.env.WECHAT_APP_SECRET!;

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getWeChatAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.access_token) {
    throw new Error(data.errmsg || "Failed to get WeChat access_token");
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };

  return cachedToken.token;
}

import { NextRequest, NextResponse } from "next/server";

const APPID = process.env.WECHAT_APP_ID!;
const SECRET = process.env.WECHAT_APP_SECRET!;

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.access_token) {
    throw new Error(data.errmsg || "Failed to get access_token");
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };

  return cachedToken.token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const path = body.path || "pages/index/index";

    const token = await getAccessToken();

    const schemeRes = await fetch(
      `https://api.weixin.qq.com/wxa/generatescheme?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jump_wxa: {
            path,
            env_version: "release",
          },
          is_expire: true,
          expire_type: 0,
          expire_interval: 1,
        }),
      }
    );

    const schemeData = await schemeRes.json();

    if (!schemeData.openlink) {
      return NextResponse.json(
        { error: schemeData.errmsg || "Failed to generate scheme" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: schemeData.openlink });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}

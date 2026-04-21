import NextAuth from "next-auth";
import type { OAuthConfig } from "next-auth/providers";

interface WeChatProfile {
  openid: string;
  nickname: string;
  headimgurl: string;
  sex: number;
  language: string;
  city: string;
  province: string;
  country: string;
}

const WeChatProvider: OAuthConfig<WeChatProfile> = {
  id: "wechat",
  name: "WeChat",
  type: "oauth",
  authorization: {
    url: "https://open.weixin.qq.com/connect/qrconnect",
    params: {
      appid: process.env.WECHAT_APP_ID,
      response_type: "code",
      scope: "snsapi_login",
    },
  },
  token: {
    url: "https://api.weixin.qq.com/sns/oauth2/access_token",
    async request(context: any) {
      const code = context.params?.code as string;

      const tokenUrl = new URL("https://api.weixin.qq.com/sns/oauth2/access_token");
      tokenUrl.searchParams.set("appid", process.env.WECHAT_APP_ID!);
      tokenUrl.searchParams.set("secret", process.env.WECHAT_APP_SECRET!);
      tokenUrl.searchParams.set("code", code);
      tokenUrl.searchParams.set("grant_type", "authorization_code");

      const response = await fetch(tokenUrl.toString());
      const tokens = await response.json();

      return { tokens };
    },
  },
  userinfo: {
    url: "https://api.weixin.qq.com/sns/userinfo",
    params: { openid: "", lang: "en" },
    async request(context: any) {
      const accessToken = context.tokens?.access_token as string;
      const openid = context.tokens?.openid as string;

      const url = new URL("https://api.weixin.qq.com/sns/userinfo");
      url.searchParams.set("access_token", accessToken);
      url.searchParams.set("openid", openid);
      url.searchParams.set("lang", "en");

      const response = await fetch(url.toString());
      return await response.json();
    },
  },
  profile(profile) {
    return {
      id: profile.openid,
      name: profile.nickname,
      email: null,
      image: profile.headimgurl,
    };
  },
  style: {
    logo: "/wechat-icon.svg",
    brandColor: "#07C160",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [WeChatProvider as any],
  callbacks: {
    async signIn({ user, account, profile }) {
      return true;
    },
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, account, user }) {
      if (account && user) {
        token.accessToken = account.access_token;
        token.openid = account.providerAccountId;
      }
      return token;
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

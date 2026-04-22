"use client";

import { useState } from "react";

export default function WeChatLoginButton() {
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const isMobile = /Android|iPhone|iPad|iPod/i.test(
    typeof navigator !== "undefined" ? navigator.userAgent : ""
  );

  const handleClick = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/wechat/miniprogram-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "pages/index/index" }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        setLoading(false);
        return;
      }

      if (isMobile) {
        window.location.href = data.url;
      } else {
        setShowQR(true);
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  if (showQR) {
    return (
      <div className="flex w-full flex-col items-center gap-4 rounded-2xl border-2 border-black/10 p-6">
        <p className="text-sm font-semibold text-black">
          请用微信扫描小程序码
        </p>
        <div className="flex h-40 w-40 items-center justify-center rounded-xl bg-neutral-50 border border-black/10">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-black/30"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm14 3a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="mt-2 text-xs text-neutral-400">小程序码</p>
          </div>
        </div>
        <p className="text-xs text-neutral-500">
          或在手机浏览器中打开此页面
        </p>
        <button
          onClick={() => setShowQR(false)}
          className="text-xs text-black underline"
        >
          返回
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-3 rounded-full border-2 border-black bg-white py-3 text-sm font-semibold text-black transition-all hover:bg-black hover:text-white disabled:opacity-50"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.045c.134 0 .24-.11.24-.245 0-.06-.024-.12-.04-.178l-.325-1.233a.492.492 0 01.177-.554C23.028 18.553 24 16.803 24 14.861c0-3.252-2.83-5.94-7.062-6.003zm-2.745 2.981c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.842 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982z" />
      </svg>
      {loading ? "正在跳转..." : "微信小程序登录"}
    </button>
  );
}

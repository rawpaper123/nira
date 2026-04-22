export default function Footer() {
  return (
    <footer className="bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className="mx-4 font-logo text-3xl font-black uppercase opacity-20 sm:text-5xl md:text-7xl"
              >
                不用滑卡也能约会 &bull;
              </span>
            ))}
          </div>
        </div>

        <div className="mb-12 text-center">
          <h3 className="mb-6 font-logo text-2xl font-black uppercase sm:text-3xl">
            我们的宣言
          </h3>
          <div className="mx-auto max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black">
                <span className="font-logo text-sm font-black text-white">N</span>
              </div>
              <span className="text-sm font-bold text-white">Nira</span>
            </div>
            <div className="ml-4 rounded-2xl rounded-tl-none bg-white p-3">
              <p className="text-sm text-black leading-relaxed">
                嘿！这周三帮你找到了一位超搭的对象。约会方案——校园咖啡馆下午 3 点，祝愉快！☕
              </p>
            </div>
            <div className="mr-4 ml-auto mt-3 max-w-[75%] rounded-2xl rounded-tr-none bg-white p-3">
              <p className="text-sm text-black leading-relaxed">
                一个用微信帮你安排约会的 AI 朋友
              </p>
            </div>
          </div>
        </div>

        <div className="mb-12 flex flex-col items-center gap-6">
          <div className="flex gap-6">
            <a href="#" className="text-white/60 transition-colors hover:text-white">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
            <a href="#" className="text-white/60 transition-colors hover:text-white">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.43 6.28 6.28 0 001.86-4.48V8.73a8.28 8.28 0 004.72 1.48V6.79a4.84 4.84 0 01-1-.1z" />
              </svg>
            </a>
            <a href="#" className="text-white/60 transition-colors hover:text-white">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>

          <div className="flex gap-6 text-sm text-white/40">
            <a href="#" className="transition-colors hover:text-white/70">加入我们</a>
            <a href="#" className="transition-colors hover:text-white/70">宣言</a>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-xs text-white/30">
          <p>&copy; Nira 2025</p>
          <div className="mt-3 flex justify-center gap-6">
            <a href="#" className="transition-colors hover:text-white/60">服务条款</a>
            <a href="#" className="transition-colors hover:text-white/60">隐私政策</a>
            <a href="#" className="transition-colors hover:text-white/60">Cookie</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

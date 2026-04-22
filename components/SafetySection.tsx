import Image from "next/image";

const safetyItems = [
  {
    number: 1,
    title: "仅限本校认证学生",
    image: "/images/verified/safety_1.webp",
  },
  {
    number: 2,
    title: "只有你的约会对象\n能看到你",
    image: "/images/verified/safety_2.webp",
  },
  {
    number: 3,
    title: "校园内咖啡见面",
    image: "/images/verified/safety_3.webp",
  },
];

export default function SafetySection() {
  return (
    <section className="bg-black px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-16 text-center font-logo text-3xl font-black uppercase tracking-tight text-white sm:text-4xl md:text-5xl">
          认证 · 隐私 · 安全
        </h2>

        <div className="grid gap-6 sm:grid-cols-3">
          {safetyItems.map((item) => (
            <div
              key={item.number}
              className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-center"
            >
              <div className="overflow-hidden rounded-xl">
                <Image
                  src={item.image}
                  alt={`安全 #${item.number}`}
                  width={400}
                  height={300}
                  className="h-auto w-full"
                />
              </div>
              <div>
                <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-white/40">
                  安全 #{item.number}
                </span>
                <p className="text-sm font-semibold text-white whitespace-pre-line">
                  {item.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

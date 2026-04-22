import Image from "next/image";

const features = [
  {
    title: "前沿 AI 研究驱动",
    description:
      "专业红娘与认知科学家联手打造最精准的匹配算法。",
    image: "/images/your-personalized/matchmaker_1.webp",
  },
  {
    title: "Nira 越来越懂你",
    description:
      "系统会学习你的偏好，每次互动都让匹配更精准。",
    image: "/images/your-personalized/matchmaker_2.webp",
  },
  {
    title: "全网扫描找到那个 TA",
    description:
      "在全平台用户中精准匹配，找到最适合你的那个人。",
    image: "/images/your-personalized/matchmaker_3.webp",
  },
];

export default function MatchmakerSection() {
  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-16 text-center font-logo text-3xl font-black uppercase tracking-tight sm:text-4xl md:text-5xl">
          你的专属 AI 红娘
        </h2>

        <div className="space-y-20">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`flex flex-col items-center gap-10 md:flex-row ${
                i % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
            >
              <div className="flex-1 space-y-4 text-center md:text-left">
                <h3 className="font-logo text-xl font-black uppercase tracking-tight sm:text-2xl">
                  {feature.title}
                </h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  {feature.description}
                </p>
              </div>

              <div className="flex-1">
                <Image
                  src={feature.image}
                  alt={feature.title}
                  width={600}
                  height={600}
                  className="aspect-square w-full max-w-md rounded-3xl object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

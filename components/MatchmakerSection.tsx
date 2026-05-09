import Image from "next/image";

const features = [
  {
    title: "前沿 AI 研究驱动",
    description:
      "关系科学与产品策略共同驱动，让每一次推荐更接近真实合拍。",
    image: "/images/your-personalized/matchmaker_1.webp",
  },
  {
    title: "Nira 越来越懂你",
    description:
      "系统会学习你的偏好，每次互动都让匹配更精准。",
    image: "/images/your-personalized/matchmaker_2.webp",
  },
  {
    title: "找到更合拍的连接",
    description:
      "基于兴趣、节奏、个性和场景，帮你遇见真正聊得来的人。",
    image: "/images/your-personalized/matchmaker_3.webp",
  },
];

export default function MatchmakerSection() {
  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-16 text-center font-logo text-3xl font-black uppercase tracking-tight sm:text-4xl md:text-5xl">
          你的 AI 匹配助手
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

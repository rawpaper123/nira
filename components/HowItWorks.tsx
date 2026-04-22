import Image from "next/image";

const steps = [
  {
    number: 1,
    title: "告诉 Nira 你的喜好",
    description: "在周二晚 11:59 前提交你的偏好。",
    image: "/images/howitworks/how_it_works_1.webp",
    numImage: "/images/howitworks/number_1.webp",
  },
  {
    number: 2,
    title: "周三惊喜推送",
    description:
      "周三晚 7 点查看微信消息，我们会推送一位精选匹配对象，并为你安排好约会！",
    image: "/images/howitworks/how_it_works_2.webp",
    numImage: "/images/howitworks/number_2.webp",
  },
  {
    number: 3,
    title: "约个时间",
    description:
      "和对方确认一个双方都方便的见面时间。",
    image: "/images/howitworks/how_it_works_3.webp",
    numImage: "/images/howitworks/number_3.webp",
  },
  {
    number: 4,
    title: "享受约会吧！",
    description:
      "和你的专属匹配对象度过一段愉快时光！",
    image: "/images/howitworks/how_it_works_4.webp",
    numImage: "/images/howitworks/number_4.webp",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-16 text-center font-logo text-3xl font-black uppercase tracking-tight sm:text-4xl md:text-5xl">
          使用流程
        </h2>

        <div className="grid gap-12 md:grid-cols-2 md:gap-8 lg:gap-16">
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex flex-col items-center gap-6 text-center"
            >
              <Image
                src={step.numImage}
                alt={`第 ${step.number} 步`}
                width={64}
                height={64}
                className="h-16 w-16"
              />

              <h3 className="font-logo text-xl font-black uppercase tracking-tight sm:text-2xl">
                {step.title}
              </h3>
              <p className="text-base leading-relaxed text-neutral-600">
                {step.description}
              </p>

              <Image
                src={step.image}
                alt={step.title}
                width={400}
                height={300}
                className="mt-2 w-full max-w-xs rounded-2xl"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

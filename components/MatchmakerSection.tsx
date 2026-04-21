import Image from "next/image";

const features = [
  {
    title: "Backed by best AI research",
    description:
      "Professional matchmakers and cognitive researchers working together to create the perfect matching algorithm.",
    image: "/images/your-personalized/matchmaker_1.webp",
  },
  {
    title: "Nira learns your preferences",
    description:
      "Our system adapts to what you like, continuously improving your match quality with every interaction.",
    image: "/images/your-personalized/matchmaker_2.webp",
  },
  {
    title: "Scans the entire pool to find the one",
    description:
      "Comprehensive matching across the entire community to find your best possible match.",
    image: "/images/your-personalized/matchmaker_3.webp",
  },
];

export default function MatchmakerSection() {
  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-16 text-center font-logo text-3xl font-black uppercase tracking-tight sm:text-4xl md:text-5xl">
          Your Personalized Matchmaker
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

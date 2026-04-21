import Image from "next/image";

const steps = [
  {
    number: 1,
    title: "Tell Nira Your Type",
    description: "Submit your preferences by Tuesday 11:59 PM.",
    image: "/images/howitworks/how_it_works_1.webp",
    numImage: "/images/howitworks/number_1.webp",
  },
  {
    number: 2,
    title: "The Wednesday Drop",
    description:
      "Check your iMessage at 7pm. We will send you one personalized match and curate your date for you!",
    image: "/images/howitworks/how_it_works_2.webp",
    numImage: "/images/howitworks/number_2.webp",
  },
  {
    number: 3,
    title: "Schedule the Date",
    description:
      "Find a time that works for both of you to meet up.",
    image: "/images/howitworks/how_it_works_3.webp",
    numImage: "/images/howitworks/number_3.webp",
  },
  {
    number: 4,
    title: "Have fun!",
    description:
      "Enjoy a good time with your personalized date!",
    image: "/images/howitworks/how_it_works_4.webp",
    numImage: "/images/howitworks/number_4.webp",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-16 text-center font-logo text-3xl font-black uppercase tracking-tight sm:text-4xl md:text-5xl">
          How it works
        </h2>

        <div className="grid gap-12 md:grid-cols-2 md:gap-8 lg:gap-16">
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex flex-col items-center gap-6 text-center"
            >
              <Image
                src={step.numImage}
                alt={`Step ${step.number}`}
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

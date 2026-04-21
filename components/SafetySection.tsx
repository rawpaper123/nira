import Image from "next/image";

const safetyItems = [
  {
    number: 1,
    title: "Verified students\nat your school only",
    image: "/images/verified/safety_1.webp",
  },
  {
    number: 2,
    title: "Only your date\nsees you",
    image: "/images/verified/safety_2.webp",
  },
  {
    number: 3,
    title: "Coffee dates on\ncampus",
    image: "/images/verified/safety_3.webp",
  },
];

export default function SafetySection() {
  return (
    <section className="bg-black px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-16 text-center font-logo text-3xl font-black uppercase tracking-tight text-white sm:text-4xl md:text-5xl">
          Verified. Private. Safe.
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
                  alt={`Safe #${item.number}`}
                  width={400}
                  height={300}
                  className="h-auto w-full"
                />
              </div>
              <div>
                <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-white/40">
                  Safe #{item.number}
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

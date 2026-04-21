import Image from "next/image";

const photos = [
  { src: "/images/real-dates/real_dates_pic_01.webp", alt: "Real date photo 1" },
  { src: "/images/real-dates/real_dates_pic_02.webp", alt: "Real date photo 2" },
  { src: "/images/real-dates/real_dates_pic_03.webp", alt: "Real date photo 3" },
];

const stats = [
  { image: "/images/real-dates/real_dates_data_01.webp", alt: "12,000+ dates" },
  { image: "/images/real-dates/real_dates_data_02.webp", alt: "65% second date rate" },
  { image: "/images/real-dates/real_dates_data_03.webp", alt: "92% satisfaction" },
];

export default function RealDatesSection() {
  return (
    <section className="bg-black px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-16 text-center font-logo text-3xl font-black uppercase tracking-tight text-white sm:text-4xl md:text-5xl">
          Real Dates Delivered
        </h2>

        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          {photos.map((photo) => (
            <div key={photo.src} className="overflow-hidden rounded-2xl">
              <Image
                src={photo.src}
                alt={photo.alt}
                width={500}
                height={400}
                className="h-auto w-full object-cover"
              />
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.image} className="overflow-hidden rounded-2xl">
              <Image
                src={stat.image}
                alt={stat.alt}
                width={500}
                height={300}
                className="h-auto w-full"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

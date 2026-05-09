import Image from "next/image";

const images = [
  { src: "/images/unforgettable/great_times_01.webp", alt: "美好瞬间 1" },
  { src: "/images/unforgettable/great_times_02.webp", alt: "美好瞬间 2" },
  { src: "/images/unforgettable/great_times_03.webp", alt: "美好瞬间 3" },
  { src: "/images/unforgettable/great_times_04-nira-v2.webp", alt: "Nira 连接反馈" },
  { src: "/images/unforgettable/great_times_05.webp", alt: "美好瞬间 5" },
  { src: "/images/unforgettable/great_times_06.webp", alt: "美好瞬间 6" },
];

export default function GallerySection() {
  const allImages = [...images, ...images, ...images, ...images];

  return (
    <section className="overflow-hidden bg-white px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-16 text-center font-logo text-3xl font-black uppercase tracking-tight sm:text-4xl md:text-5xl">
          那些难忘的美好瞬间
        </h2>
      </div>

      <div className="relative">
        <div className="flex animate-marquee gap-4">
          {allImages.map((img, i) => (
            <div
              key={`${img.src}-${i}`}
              className="relative h-64 w-72 shrink-0 overflow-hidden rounded-2xl"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="288px"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

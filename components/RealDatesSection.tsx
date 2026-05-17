import Image from "next/image";

export default function RealDatesSection() {
  return (
    <section className="bg-black px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <Image
          src="/images/real-dates/authentic-dates-delivered-cn-v1.png"
          alt="真实的约会，已送达"
          width={1672}
          height={941}
          sizes="(min-width: 1280px) 1280px, 100vw"
          className="h-auto w-full object-contain"
          priority={false}
        />
      </div>
    </section>
  );
}

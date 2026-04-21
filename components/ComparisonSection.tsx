import Image from "next/image";

export default function ComparisonSection() {
  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-16 text-center font-logo text-3xl font-black uppercase tracking-tight sm:text-4xl md:text-5xl">
          tired of tinder &amp; hinge?
          <br />
          Nira is for you
        </h2>

        <div className="grid gap-12 md:grid-cols-2">
          <div className="flex flex-col items-center gap-6">
            <h3 className="font-logo text-xl font-black uppercase tracking-tight">
              Nira
            </h3>
            <p className="text-sm font-semibold text-black">
              One Ready-to-go Date Invite
            </p>
            <div className="w-full max-w-sm overflow-hidden rounded-3xl">
              <Image
                src="/images/funpart/tired-of-tinder-1.png"
                alt="Nira - one date invite"
                width={400}
                height={600}
                className="h-auto w-full"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-6">
            <h3 className="font-logo text-xl font-black uppercase tracking-tight text-neutral-500">
              Other Dating Apps
            </h3>
            <p className="text-sm font-semibold text-neutral-500">
              Endless Swiping &amp; Small Talk
            </p>
            <div className="w-full max-w-sm overflow-hidden rounded-3xl">
              <Image
                src="/images/funpart/tired-of-tinder-2.png"
                alt="Other apps - endless messages"
                width={400}
                height={600}
                className="h-auto w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

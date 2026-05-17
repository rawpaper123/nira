import Image from "next/image";

export default function ComparisonSection() {
  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-16 text-center font-logo text-3xl font-black uppercase tracking-tight sm:text-4xl md:text-5xl">
          厌倦了探探和 Soul？
          <br />
          Nira 就是为你准备的
        </h2>

        <div className="grid gap-12 md:grid-cols-2">
          <div className="flex flex-col items-center gap-6">
            <h3 className="font-logo text-xl font-black uppercase tracking-tight">
              Nira
            </h3>
            <p className="text-sm font-semibold text-black">
              一条消息，约会安排好了
            </p>
            <div className="w-full max-w-sm overflow-hidden rounded-3xl">
              <Image
                src="/images/howitworks/nira-wechat-notification-v1.png"
                alt="Nira - 一条消息安排约会"
                width={400}
                height={600}
                className="h-auto w-full"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-6">
            <h3 className="font-logo text-xl font-black uppercase tracking-tight text-neutral-500">
              其他交友软件
            </h3>
            <p className="text-sm font-semibold text-neutral-500">
              无尽滑卡和无效聊天
            </p>
            <div className="w-full max-w-sm overflow-hidden rounded-3xl">
              <Image
                src="/images/funpart/tired-of-tinder-2.png"
                alt="其他软件 - 无尽消息"
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

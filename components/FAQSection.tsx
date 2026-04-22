"use client";

import { useState } from "react";

const faqs = [
  {
    question: "Nira 是怎么匹配的？",
    answer:
      "Nira 通过分析你的个人资料和偏好，与另一位同学进行匹配。我们运用前沿大模型的推理能力，捕捉每一次美好约会的可能性。同时，我们的智能体系统会调度分析专家、匹配专家、约会策划专家等多个角色协同工作。",
  },
  {
    question: "Nira 怎么用？",
    answer:
      "Nira 为你安排约会，不需要你滑卡或聊天。提交信息后，Nira 会通过微信推送约会方案，包含时间、地点和匹配对象信息。约会会在你附近的校园进行。",
  },
  {
    question: "约会前能知道对方什么信息？",
    answer:
      "匹配成功后，你会收到一张对方的海报，包含照片和匹配理由说明。你还会收到一份时间表，双方填好后，我们会安排具体的时间、地点，并附上约会小贴士。",
  },
  {
    question: "不喜欢匹配对象怎么办？",
    answer:
      "随时告诉 Nira 你的反馈和原因，Nira 会根据你的反馈重新安排下一次约会。你也可以更新个人资料和偏好设置。",
  },
  {
    question: "谁可以参加？",
    answer:
      "目前仅限 18 岁及以上的在校大学生参与。",
  },
  {
    question: "临时有事去不了怎么办？",
    answer:
      "如果真的临时有事，请尽快微信通知你的约会对象，避免被限制参与后续活动。",
  },
  {
    question: "通常多久能约上？",
    answer:
      "由于我们目前仅面向小范围学生开放，通常 1-2 周内可以确保一次线下见面。近期系统升级后，70% 的用户在注册后 2 天内就能完成首次约会。",
  },
  {
    question: "约会在哪里进行？",
    answer:
      "约会在精心挑选的校园地点进行，确保安全和愉快的体验。",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-16 text-center font-logo text-3xl font-black uppercase tracking-tight sm:text-4xl md:text-5xl">
          常见问题
        </h2>

        <div className="divide-y divide-black/10">
          {faqs.map((faq, i) => (
            <div key={i} className="py-6">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <span className="text-base font-semibold sm:text-lg">{faq.question}</span>
                <svg
                  className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === i ? "mt-4 max-h-96" : "max-h-0"
                }`}
              >
                <p className="text-sm leading-relaxed text-neutral-600 sm:text-base">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

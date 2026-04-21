"use client";

import { useState } from "react";

const faqs = [
  {
    question: "How does Nira pair people?",
    answer:
      "Nira pairs you with another student by analyzing your profiles and comparing your preferences. This process employs rigorous computation and simulation to provide the best insights for curating a successful date. Leveraging the reasoning abilities of frontier LLMs, we can catch the slightest signs of the possibilities of a good date. We also have an agentic system that orchestrates different expert agents including analysis experts, matchmaking experts, personalized poster experts, scheduler experts, etc.",
  },
  {
    question: "How Nira works",
    answer:
      "Nira curates dates for you without requiring you to swipe or chat with anyone. After submitting your information, Nira will text you a date plan that includes the time, place, and details of your match. The date will take place around the campus you're currently near.",
  },
  {
    question: "What will I know about my match before the date?",
    answer:
      "Once we find a good match for you, you'll get a poster with their photos and a short explanation of why you'd be a great pair. You'll also get a scheduler to share your availability for the week. After both of you fill it out, we'll arrange the date time, place, and give you a few dating tips to help it go smoothly.",
  },
  {
    question: "What if I don't like my match/date?",
    answer:
      "You can always simply tell Nira the reason why you don't like it and any other feedback. Nira will then proceed to arrange another date that follows the feedback. You can also adjust your profile to update your preferences and personal information.",
  },
  {
    question: "Who's participating?",
    answer:
      "Currently, only college students who are 18 or older are participating in this experience.",
  },
  {
    question: "What if I can't make it last minute?",
    answer:
      "If you really can't make it last minute, please cancel by texting your match asap to prevent being banned from future experiences.",
  },
  {
    question: "How long does it usually take?",
    answer:
      "Since we are only releasing this experience to a very select group of students, we estimate that it will take approximately one to two weeks to secure a guaranteed in-person coffee date. For a recent upgrade in system, 70% of the users now get their first date within 2 days of signing up.",
  },
  {
    question: "Where do the dates happen?",
    answer:
      "Dates take place at carefully selected on-campus spots to ensure a safe and enjoyable experience.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-16 text-center font-logo text-3xl font-black uppercase tracking-tight sm:text-4xl md:text-5xl">
          FAQ
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

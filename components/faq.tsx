import type { FaqItem } from "@/lib/seo";

export function Faq({ items, title = "Часті запитання" }: { items: FaqItem[]; title?: string }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <div className="mt-5 divide-y divide-line rounded-2xl border border-line bg-white">
        {items.map((item) => (
          <details key={item.question} className="group px-5 py-4">
            <summary className="cursor-pointer list-none font-semibold marker:hidden">{item.question}</summary>
            <p className="mt-2 text-sm leading-6 text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

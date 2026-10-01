import { TELEGRAM_URL } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-line"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-xs text-muted sm:flex-row sm:items-center sm:justify-between"><p className="font-mono">© 2026 Nami Gear · made by <a className="hover:text-ink" href="https://aokigahara.dev">Aokigahara</a></p><div className="flex flex-wrap gap-5"><a className="hover:text-ink" href="mailto:lanovui0902@gmail.com">lanovui0902@gmail.com</a><a className="hover:text-ink" href={TELEGRAM_URL} target="_blank" rel="noreferrer">Telegram: @A0klgahara</a></div></div></footer>
  );
}

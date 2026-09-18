import { CHAIN_LABEL, EXPLORER } from "@/lib/chains";
import { ACADEMY, BUILDER_HUB, CONSOLE, CREATE_L1, DOCS, GITHUB } from "@/lib/links";
import { FaucetButton } from "./FaucetButton";
import { Logo } from "./Logo";
import { Icon } from "./ui";

// ❓ Vì sao bỏ "Faucet" khỏi danh sách link này?
// → Faucet giờ là nút CTA cạnh "Create L1" (bấm phát nhận AVAX test luôn), để lại link cũ trong menu
//   là trùng lặp. Khi chưa cấu hình faucet riêng thì chính nút CTA đó quay về link Builder Hub.
const LINKS: { label: string; href: string; internal?: boolean }[] = [
  { label: "Demo", href: "/demo.html", internal: true },
  { label: "Builder Hub", href: BUILDER_HUB },
  { label: "Academy", href: ACADEMY },
  { label: "Docs", href: DOCS },
  { label: "Console", href: CONSOLE },
  ...(EXPLORER ? [{ label: "Snowtrace", href: EXPLORER }] : []),
  { label: "GitHub", href: GITHUB },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-40 h-14 border-b border-line bg-surface backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-5 md:px-6">
        <a href="#" className="flex items-center gap-3 pr-4">
          <Logo className="size-7 text-avax" />
          <span className="font-mono text-[11px] tracking-[0.22em] text-fg">
            AVAXCATS
          </span>
          <span className="hidden font-mono text-[11px] tracking-[0.22em] text-muted lg:inline">
            · BUILDER HUB
          </span>
        </a>

        <ul className="flex items-center gap-1 max-lg:hidden">
          {LINKS.map((l) => (
            <li key={l.label} className="list-none">
              <a
                className="inline-flex items-center rounded-md p-2 text-sm text-muted transition-colors hover:text-fg"
                href={l.href}
                target={l.internal ? undefined : "_blank"}
                rel={l.internal ? undefined : "noreferrer"}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="grow" />

        <span className="eyebrow hidden border border-line px-2.5 py-1.5 text-muted lg:inline-block">
          {CHAIN_LABEL}
        </span>
        <FaucetButton />
        <a
          href={CREATE_L1}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 items-center gap-1.5 bg-avax px-3 text-[12px] font-semibold text-white transition-colors hover:bg-avax-deep"
        >
          Create L1
          <Icon name="arrowRight" className="size-3.5" />
        </a>
        <details className="group lg:hidden">
          <summary
            className="grid size-9 cursor-pointer list-none place-items-center rounded-md text-muted transition-colors hover:bg-hover hover:text-fg"
            aria-label="Open menu"
          >
            <Icon name="menu" className="size-4 group-open:hidden" />
            <Icon name="x" className="hidden size-4 group-open:block" />
          </summary>
          <div className="absolute inset-x-0 top-14 border-b border-line bg-surface-solid px-5 py-3 shadow-lg">
            <span className="eyebrow mb-1 flex items-center gap-2 px-2 py-2 text-muted">
              <span className="size-1.5 rounded-full bg-avax" />
              {CHAIN_LABEL}
            </span>
            <a
              className="flex items-center justify-between px-2 py-3 text-[15px] font-semibold text-avax transition-colors hover:bg-hover"
              href={CREATE_L1}
              target="_blank"
              rel="noreferrer"
            >
              Create your own L1
              <Icon name="external" className="size-3.5 text-muted" />
            </a>
            <FaucetButton variant="menu" />
            {LINKS.map((l) => (
              <a
                key={l.label}
                className="flex items-center justify-between px-2 py-3 text-[15px] text-fg transition-colors hover:bg-hover"
                href={l.href}
                target={l.internal ? undefined : "_blank"}
                rel={l.internal ? undefined : "noreferrer"}
              >
                {l.label}
                {!l.internal && <Icon name="external" className="size-3.5 text-muted" />}
              </a>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}

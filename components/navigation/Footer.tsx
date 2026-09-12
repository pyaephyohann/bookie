import { AtSign, BookOpen, Mail, MessageCircle, Play } from "lucide-react";
import Link from "next/link";

const EXPLORE = [
  { label: "Books", href: "/search" },
  { label: "Categories", href: "/categories" },
  { label: "Authors", href: "/authors" },
];

const HELP = [
  { label: "Track Order", href: "/track" },
];

const SOCIALS = [
  { label: "Bookie on Instagram", icon: AtSign, href: "https://instagram.com" },
  { label: "Bookie on Twitter", icon: MessageCircle, href: "https://twitter.com" },
  { label: "Bookie on YouTube", icon: Play, href: "https://youtube.com" },
  { label: "Email Bookie", icon: Mail, href: "mailto:hello@bookie.example" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <p className="flex items-baseline text-h3 font-extrabold tracking-tight text-text">
            bookie<span className="text-brand" aria-hidden>.</span>
          </p>
          <p className="text-body-sm mt-3 max-w-xs text-text-secondary">
            An independent online bookstore. Discover, order and read — no account
            required, just your BookPass.
          </p>
          <p className="text-fun mt-4 text-2xl text-text-muted">
            Your next favorite book is waiting.
          </p>
        </div>

        <FooterColumn title="Explore" links={EXPLORE} />
        <FooterColumn title="Help" links={HELP} />

        <div>
          <p className="text-label uppercase tracking-wide text-text-muted">Social</p>
          <ul className="mt-3 space-y-2.5">
            {SOCIALS.map(({ label, icon: Icon, href }) => (
              <li key={label}>
                <a
                  href={href}
                  className="group flex items-center gap-2.5 text-body-sm text-text-secondary transition-colors hover:text-text"
                >
                  <span className="flex size-7 items-center justify-center rounded-md border border-border bg-background transition-colors group-hover:border-border-strong">
                    <Icon className="size-3.5" aria-hidden />
                  </span>
                  {label.replace("Bookie on ", "")}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border-subtle">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 sm:px-6 lg:px-8">
          <p className="text-caption text-text-muted">
            © {new Date().getFullYear()} Bookie. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 text-caption text-text-muted">
            <BookOpen className="size-3.5" aria-hidden />
            Made for readers, by readers.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <p className="text-label uppercase tracking-wide text-text-muted">{title}</p>
      <ul className="mt-3 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            {link.href.startsWith("/") ? (
              <Link
                href={link.href}
                className="text-body-sm text-text-secondary transition-colors hover:text-text"
              >
                {link.label}
              </Link>
            ) : (
              <a
                href={link.href}
                className="text-body-sm text-text-secondary transition-colors hover:text-text"
              >
                {link.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

import { ExternalLink, Globe, Music } from "lucide-react";

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/capitanoficial__/",
    icon: ExternalLink,
  },
  {
    label: "Spotify",
    href: "https://open.spotify.com/intl-es/album/3W1lolYpxaC3cqNOhXdOu7",
    icon: Music,
  },
  {
    label: "Web",
    href: "https://capitan-web.vercel.app/",
    icon: Globe,
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-card-border mt-8">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Logo */}
        <div className="text-center mb-5">
          <img src="/logo.png" alt="CAPITAN" className="h-10 mx-auto mb-1" />
          <p className="text-xs text-muted">Rock en vivo</p>
        </div>

        {/* Social links */}
        <div className="flex items-center justify-center gap-6 mb-5">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted hover:text-accent transition-colors"
              aria-label={link.label}
            >
              <link.icon className="w-4 h-4" />
              <span>{link.label}</span>
            </a>
          ))}
        </div>

        {/* Contact */}
        <div className="text-center text-xs text-muted space-y-1">
          <p>
            Consultas:{" "}
            <a
              href="mailto:deruvodaniel@gmail.com"
              className="text-accent hover:underline"
            >
              deruvodaniel@gmail.com
            </a>
          </p>
          <p>
            Problemas con tu entrada:{" "}
            <a
              href="https://www.instagram.com/capitanoficial__/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              @capitanoficial__
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

import { ExternalLink, Globe, Music } from "lucide-react";

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://instagram.com/rockcapitan",
    icon: ExternalLink,
  },
  {
    label: "Spotify",
    href: "https://open.spotify.com/artist/5h9FBpoGNQalHYtAilRBjJ",
    icon: Music,
  },
  {
    label: "Linktree",
    href: "https://linktr.ee/rockcapitan",
    icon: Globe,
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-card-border mt-auto">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Band name */}
        <div className="text-center mb-4">
          <p className="font-bold text-lg tracking-widest">CAPITAN</p>
          <p className="text-xs text-muted mt-1">Rock en vivo</p>
        </div>

        {/* Social links */}
        <div className="flex items-center justify-center gap-4 mb-4">
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
              <span className="hidden sm:inline">{link.label}</span>
            </a>
          ))}
        </div>

        {/* Contact */}
        <div className="text-center text-xs text-muted space-y-1">
          <p>
            Consultas:{" "}
            <a
              href="mailto:capitanrock.ok@gmail.com"
              className="text-accent hover:underline"
            >
              capitanrock.ok@gmail.com
            </a>
          </p>
          <p>
            Problemas con tu entrada:{" "}
            <a
              href="https://instagram.com/rockcapitan"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              @rockcapitan
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

import { Globe } from "lucide-react";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/capitanoficial__/",
    Icon: InstagramIcon,
  },
  {
    label: "Spotify",
    href: "https://open.spotify.com/intl-es/album/3W1lolYpxaC3cqNOhXdOu7",
    Icon: SpotifyIcon,
  },
  {
    label: "Web",
    href: "https://capitan-web.vercel.app/",
    Icon: Globe,
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
          {SOCIAL_LINKS.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted hover:text-accent transition-colors"
              aria-label={label}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
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

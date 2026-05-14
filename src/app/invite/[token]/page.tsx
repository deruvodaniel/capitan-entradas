import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Calendar, MapPin, Gift } from "lucide-react";
import Footer from "@/components/Footer";
import { getMapsUrl } from "@/lib/utils";
import InviteClaimForm from "@/components/InviteClaimForm";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await prisma.guestInvite.findUnique({
    where: { token },
    include: {
      show: {
        select: {
          title: true,
          venue: true,
          address: true,
          startsAt: true,
          doorsAt: true,
          coverImageUrl: true,
          mapUrl: true,
        },
      },
    },
  });

  if (!invite) {
    notFound();
  }

  const mapsUrl = getMapsUrl({ mapUrl: invite.show.mapUrl });
  const isClaimed = invite.status === "CLAIMED";
  const isExpired = invite.status === "EXPIRED";

  return (
    <main className="flex-1 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-sm w-full space-y-6">
          {/* Header */}
          <div className="text-center">
            <img
              src="/logo.png"
              alt="CAPITAN"
              className="h-12 mx-auto mb-3"
            />
            {isClaimed ? (
              <>
                <h1 className="text-xl font-bold">Invitación utilizada</h1>
                <p className="text-sm text-muted mt-2">
                  Esta invitación ya fue reclamada. Si tenés problemas con tu
                  entrada, contactanos por Instagram.
                </p>
              </>
            ) : isExpired ? (
              <>
                <h1 className="text-xl font-bold">Invitación expirada</h1>
                <p className="text-sm text-muted mt-2">
                  Esta invitación ya no es válida.
                </p>
              </>
            ) : (
              <>
                <Gift className="w-10 h-10 mx-auto text-accent mb-2" />
                <h1 className="text-xl font-bold">¡Estás invitado!</h1>
                <p className="text-sm text-muted mt-1">
                  Completá tus datos para recibir{" "}
                  {invite.quantity === 1
                    ? "tu entrada"
                    : `tus ${invite.quantity} entradas`}{" "}
                  gratis por email.
                </p>
              </>
            )}
          </div>

          {/* Show info card */}
          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            {invite.show.coverImageUrl && (
              <img
                src={invite.show.coverImageUrl}
                alt={invite.show.title}
                className="w-full h-32 object-cover"
              />
            )}
            <div className="px-5 py-4">
              <h2 className="font-bold text-lg">{invite.show.title}</h2>
              <div className="mt-2 space-y-1.5 text-sm text-muted">
                <p className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 shrink-0" />
                  {formatDate(invite.show.startsAt)}
                </p>
                {mapsUrl ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-accent transition-colors"
                  >
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>
                      {invite.show.venue}
                      {invite.show.address && ` — ${invite.show.address}`}
                    </span>
                  </a>
                ) : (
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" />
                    {invite.show.venue}
                    {invite.show.address && ` — ${invite.show.address}`}
                  </p>
                )}
              </div>

              {/* Ticket info */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs font-medium text-accent bg-accent/10 border border-accent/20 rounded-full px-3 py-1">
                  {invite.quantity === 1
                    ? "1 entrada gratis"
                    : `${invite.quantity} entradas gratis`}
                </span>
                {invite.label && (
                  <span className="text-xs text-muted bg-muted/10 border border-muted/20 rounded-full px-3 py-1">
                    {invite.label}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Claim form or status message */}
          {!isClaimed && !isExpired && (
            <InviteClaimForm token={token} quantity={invite.quantity} />
          )}

          {isClaimed && (
            <div className="text-center">
              <a
                href="https://www.instagram.com/capitanoficial__/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent hover:underline"
              >
                @capitanoficial__
              </a>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}

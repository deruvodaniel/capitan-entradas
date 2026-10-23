"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface OrderShowFilterProps {
  shows: { id: string; label: string }[];
  selectedShowId: string;
}

export default function OrderShowFilter({
  shows,
  selectedShowId,
}: OrderShowFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function changeShow(showId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (showId) params.set("showId", showId);
    else params.delete("showId");
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  }

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <label htmlFor="orders-show-filter" className="text-sm text-foreground/80">
        Show
      </label>
      <select
        key={selectedShowId}
        id="orders-show-filter"
        name="showId"
        defaultValue={selectedShowId}
        onChange={(event) => changeShow(event.target.value)}
        disabled={isPending}
        className="min-h-10 w-full min-w-0 rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:max-w-lg"
      >
        <option value="">Todos los shows</option>
        {shows.map((show) => (
          <option key={show.id} value={show.id}>
            {show.label}
          </option>
        ))}
      </select>
      <span role="status" className="text-sm text-foreground/80">
        {isPending ? "Cargando ventas…" : ""}
      </span>
    </div>
  );
}

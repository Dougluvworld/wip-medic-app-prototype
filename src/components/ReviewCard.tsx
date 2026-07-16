import { Star, ShieldCheck } from "lucide-react";
import type { Review } from "@/lib/mock-data";

export function ReviewCard({ review }: { review: Review }) {
  const initial = review.author.charAt(0).toUpperCase();
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-primary">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold">{review.author}</p>
            <span className="shrink-0 text-[10px] text-muted-foreground">{review.date}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < review.rating ? "fill-current text-warning" : "text-muted-foreground/30"}`}
                />
              ))}
            </div>
            {review.verified && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-success">
                <ShieldCheck className="h-3 w-3" /> Verified visit
              </span>
            )}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-foreground/90">"{review.quote}"</p>
        </div>
      </div>
    </div>
  );
}

import Image from "next/image";
import { posterUrl } from "@/lib/images";

interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
}

interface CastRowProps {
  cast: CastMember[];
  activeCastId?: number;
  onSelect?: (member: CastMember) => void;
}

export function CastRow({ cast, activeCastId, onSelect }: CastRowProps) {
  if (cast.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wider text-subtle">
        Cast · tap to filter
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {cast.map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(member);
            }}
            className={`cast-row-member flex min-w-[76px] flex-col items-center gap-1 rounded-xl p-1.5 text-center transition ${
              activeCastId === member.id ? "cast-row-member--active" : ""
            }`}
          >
            <div className="cast-row-member__avatar relative h-16 w-16 overflow-hidden rounded-full bg-[var(--surface-hover)]">
              {member.profilePath ? (
                <Image
                  src={posterUrl(member.profilePath, "w185")!}
                  alt={member.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg text-subtle">
                  ?
                </div>
              )}
            </div>
            <span className="line-clamp-2 text-[10px] font-medium text-foreground">
              {member.name}
            </span>
            <span className="line-clamp-1 text-[9px] text-subtle">{member.character}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

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
      <p className="text-xs font-medium uppercase tracking-wider text-white/40">
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
            className={`flex min-w-[76px] flex-col items-center gap-1 rounded-xl p-1 text-center transition ${
              activeCastId === member.id
                ? "bg-violet-500/20 ring-1 ring-violet-400/50"
                : "hover:bg-white/5"
            }`}
          >
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-white/10 ring-2 ring-white/10">
              {member.profilePath ? (
                <Image
                  src={posterUrl(member.profilePath, "w185")!}
                  alt={member.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg text-white/40">
                  ?
                </div>
              )}
            </div>
            <span className="line-clamp-2 text-[10px] font-medium text-white/80">
              {member.name}
            </span>
            <span className="line-clamp-1 text-[9px] text-white/40">{member.character}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

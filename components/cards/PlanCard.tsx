import Link from "next/link";
import Badge from "@/components/ui/Badge";

type PlanFeature = {
  text: string;
};

type PlanCardProps = {
  badge?: string;
  name: string;
  subtitle: string;
  price: string;
  priceNote?: string;
  description: string;
  features: PlanFeature[];
  instruments?: string[];
  highlighted: boolean;
};

export default function PlanCard({
  badge,
  name,
  subtitle,
  price,
  priceNote,
  description,
  features,
  instruments,
  highlighted,
}: PlanCardProps) {
  return (
    <div
      className={`relative rounded-2xl p-8 flex flex-col border transition-all duration-500 ${
        highlighted
          ? "bg-white/[0.08] backdrop-blur-xl border-[#ff7a00]/30 shadow-2xl shadow-[#ff7a00]/10 hover:shadow-[#ff7a00]/25 hover:border-[#ff7a00]/60 hover:-translate-y-1"
          : "bg-white/[0.04] backdrop-blur-xl border-white/10 shadow-lg hover:shadow-2xl hover:bg-white/[0.07] hover:border-white/20 hover:-translate-y-1"
      }`}
    >
      {badge && <Badge>{badge}</Badge>}

      <div className="mb-6">
        <h3 className="text-lg font-bold text-white font-poppins">
          {name}
        </h3>
        <p className="text-[#ff7a00] font-semibold text-sm mt-1 drop-shadow-[0_0_8px_rgba(255,122,0,0.3)] font-poppins">
          {subtitle}
        </p>
      </div>

      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] font-poppins">
          {price}
        </span>
        {priceNote && (
          <span className="text-sm text-white/40">{priceNote}</span>
        )}
      </div>

      <p className="text-white/50 text-sm mb-6 leading-relaxed font-roboto">
        {description}
      </p>

      {instruments && instruments.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-white/30 uppercase tracking-[0.15em] mb-3 font-poppins">
            Instrumentos
          </p>
          <div className="flex flex-wrap gap-2">
            {instruments.map((inst) => (
              <span
                key={inst}
                className="text-xs px-3 py-1 rounded-full bg-white/[0.06] text-white/50 border border-white/10 font-roboto"
              >
                {inst}
              </span>
            ))}
          </div>
        </div>
      )}

      <ul className="space-y-3 mb-8 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-white/60 font-roboto">
            <span className="text-[#ff7a00] font-bold mt-0.5 drop-shadow-[0_0_4px_rgba(255,122,0,0.4)] flex-shrink-0" aria-hidden="true">✓</span>
            <span>{f.text}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/mi-cuenta/login"
        className={`w-full text-center text-white font-semibold py-3.5 rounded-full text-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
          highlighted
            ? "shadow-xl shadow-[#ff7a00]/25 hover:shadow-2xl hover:shadow-[#ff7a00]/40 hover:-translate-y-0.5"
            : "hover:shadow-lg hover:shadow-[#ff7a00]/20"
        }`}
        style={{ backgroundColor: "#ff7a00", fontFamily: "'Poppins', sans-serif" }}
      >
        Elegir plan
      </Link>
    </div>
  );
}

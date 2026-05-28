import Button from "@/components/ui/Button";
import OptimizedImage from "@/components/ui/OptimizedImage";

const stats = [
  { number: "+1.200", label: "Estudiantes" },
  { number: "+25", label: "Cursos" },
  { number: "4.9/5", label: "Valoración" },
];

const statsRow = (
  <div className="flex gap-2">
    {stats.map((stat) => (
      <div
        key={stat.label}
        className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2.5 text-center min-w-[95px] shadow-xl"
      >
        <p className="text-[#ff7a00] font-bold text-sm font-poppins">{stat.number}</p>
        <p className="text-white/60 text-[10px] font-roboto">{stat.label}</p>
      </div>
    ))}
  </div>
);

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[680px] overflow-hidden bg-black pt-16">
      <div className="absolute inset-0">
        <OptimizedImage
          src="/images/hero/banner-principal.jpg"
          alt="4uStudio Academy — estudio de música profesional"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 65% 50%, rgba(255, 122, 0, 0.06) 0%, transparent 60%)' }} />

      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-6 lg:px-8 h-full">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-10 lg:gap-0 min-h-[616px] pt-8 lg:pt-12">
          <div className="max-w-[480px] w-full">
            <p className="text-sm md:text-base font-medium tracking-[0.2em] uppercase text-[#ff7a00] mb-4 font-poppins">
              🎵 LA MÚSICA TE TRANSFORMA
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-5 font-poppins tracking-[-0.02em]">
              Cumple tus{" "}
              <span className="text-[#ff7a00]">sueños</span>
              {" "}musicales
            </h1>
            <p className="text-base md:text-lg text-white/60 max-w-md mb-8 leading-relaxed font-roboto">
              Aprende, crea y conecta con tu pasión. Cursos para niños, adolescentes y adultos de todos los niveles.
            </p>

            <div className="flex lg:hidden mb-8">
              {statsRow}
            </div>

            <div className="flex flex-wrap gap-4">
              <Button href="/planes" size="md">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Ver Video
              </Button>
              <Button href="/planes" variant="secondary" size="md">
                Ver Cursos
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-4">
            <div className="hidden lg:flex">
              {statsRow}
            </div>

            <div className="hidden lg:block w-[260px] lg:w-[300px] h-[320px] lg:h-[360px] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <div className="w-full h-full bg-gradient-to-br from-[#ff7a00]/10 via-[#ff7a00]/5 to-transparent flex flex-col items-center justify-center gap-3">
                <svg className="w-12 h-12 text-white/20" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
                  <path d="M192 0C139 0 96 43 96 96V256c0 53 43 96 96 96s96-43 96-96V96c0-53-43-96-96-96zM64 216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 89.1 66.2 162.7 152 174.4V464H120c-13.3 0-24 10.7-24 24s10.7 24 24 24h72 72c13.3 0 24-10.7 24-24s-10.7-24-24-24H216V430.4c85.8-11.7 152-85.3 152-174.4V216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 66.3-53.7 120-120 120s-120-53.7-120-120V216z"/>
                </svg>
                <span className="text-white/15 text-xs font-poppins tracking-wider uppercase">Estudiantes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

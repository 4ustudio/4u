import StatsCard from "@/components/cards/StatsCard";
import GlowEffect from "@/components/ui/GlowEffect";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import OptimizedImage from "@/components/ui/OptimizedImage";

const stats = [
  { number: "+1.200", label: "Estudiantes" },
  { number: "+25", label: "Cursos" },
  { number: "4.9/5", label: "Valoración" },
];

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[90dvh] overflow-hidden bg-black flex items-center justify-center pt-16">
      <div className="absolute inset-0">
        <OptimizedImage
          src="/images/hero/banner-principal.jpg"
          alt="4uStudio Academy — estudio de música profesional"
          fill
          priority
          className="object-cover object-[center_right]"
          sizes="100vw"
        />
      </div>

      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 50%, rgba(255, 122, 0, 0.10) 0%, transparent 60%)' }} />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-black/5" />
      <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-orange-500/10 to-transparent" />

      <GlowEffect position="top-right" size="w-[500px] h-[500px]" opacity="bg-orange-500/30" />
      <GlowEffect position="bottom-left" size="w-[250px] h-[250px]" opacity="bg-orange-500/8" />

      <div className="relative z-10 w-full">
        <Container>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 lg:gap-10">
            <div className="max-w-lg">
              <p className="text-sm md:text-base font-medium tracking-[0.2em] uppercase text-[#ff7a00] mb-4 font-poppins">
                🎵 LA MÚSICA TE TRANSFORMA
              </p>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.08] mb-6 font-poppins tracking-[-0.02em]">
                Cumple tus{" "}
                <span className="text-[#ff7a00] drop-shadow-[0_0_15px_rgba(255,122,0,0.4)]">sueños</span>
                {" "}musicales
              </h1>

              <p className="text-base md:text-lg text-white/60 max-w-md mb-8 leading-relaxed font-roboto">
                Aprende, crea y conecta con tu pasión. Cursos para niños, adolescentes y adultos de todos los niveles.
              </p>

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

            <div className="flex flex-col gap-4 w-full lg:w-auto">
              {stats.map((stat) => (
                <StatsCard key={stat.label} number={stat.number} label={stat.label} />
              ))}
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}

import Link from "next/link";
import StatsCard from "@/components/cards/StatsCard";
import GlowEffect from "@/components/ui/GlowEffect";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

const stats = [
  { number: "+1.200", label: "Estudiantes" },
  { number: "+25", label: "Cursos" },
  { number: "4.9/5", label: "Valoración" },
];

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-black flex items-center justify-center pt-20">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/banner-principal.jpg')",
          backgroundPosition: 'center right',
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

      <GlowEffect position="top-right" />
      <GlowEffect position="bottom-left" size="w-[400px] h-[400px]" opacity="bg-orange-500/10" />

      <div className="relative z-10 w-full">
        <Container>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12">
            <div className="max-w-xl">
              <p
                className="text-sm md:text-base font-medium tracking-[0.2em] uppercase text-[#ff7a00] mb-6"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                🎵 LA MÚSICA TE TRANSFORMA
              </p>

              <h1
                className="text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.05] mb-8"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Cumple tus{" "}
                <span className="text-[#ff7a00] drop-shadow-[0_0_20px_rgba(255,122,0,0.5)]">sueños</span>
                {" "}musicales
              </h1>

              <p
                className="text-base md:text-lg text-white/60 max-w-lg mb-10 leading-relaxed"
                style={{ fontFamily: "'Roboto', sans-serif" }}
              >
                Aprende, crea y conecta con tu pasión. Cursos para niños, adolescentes y adultos de todos los niveles.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button href="/planes" size="md">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  Ver Video
                </Button>
                <Button href="/planes" variant="secondary" size="md">
                  Ver Cursos
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-5 w-full lg:w-auto">
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

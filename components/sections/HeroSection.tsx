import Button from "@/components/ui/Button";
import OptimizedImage from "@/components/ui/OptimizedImage";

const stats = [
  { number: "+1.200", label: "Estudiantes" },
  { number: "+25", label: "Cursos" },
  { number: "4.9/5", label: "Valoración" },
];

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[700px] overflow-hidden bg-black pt-16">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-black to-gray-950" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 60% 50%, rgba(255, 122, 0, 0.07) 0%, transparent 60%)' }} />

      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_1.4fr] items-center min-h-[636px] gap-10 lg:gap-14">
          <div className="max-w-[480px]">
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

          <div className="relative">
            <div className="flex gap-2 mb-4 justify-end">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/10 backdrop-blur border border-white/10 rounded-xl px-3.5 py-2.5 text-center min-w-[100px] shadow-xl"
                >
                  <p className="text-[#ff7a00] font-bold text-base font-poppins">{stat.number}</p>
                  <p className="text-white/60 text-[10px] font-roboto">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="relative w-full h-[480px] lg:h-[560px] rounded-2xl overflow-hidden shadow-2xl">
              <OptimizedImage
                src="/images/hero/banner-principal.jpg"
                alt="4uStudio Academy — estudio de música profesional"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            </div>

            <div className="absolute -bottom-4 -left-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3.5 shadow-xl">
              <div className="flex items-center gap-1 mb-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-3 h-3 text-yellow-400" viewBox="0 0 576 512" fill="currentColor">
                    <path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.4 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L380.9 150.3 316.9 18z" />
                  </svg>
                ))}
              </div>
              <p className="text-white/70 text-[11px] font-roboto">Valoración 4.9 · +1.200 estudiantes</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import Button from "@/components/ui/Button";

const features = [
  "Grabación profesional en estudio",
  "Clases personalizadas",
  "Sin contratos largos",
];

export default function CTASection() {
  return (
    <section className="w-full py-20 md:py-28 bg-gradient-to-b from-gray-950 via-gray-900 to-black relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/[0.12] blur-3xl rounded-full animate-[softPulse_4s_ease-in-out_infinite]" />
      <div className="absolute top-0 -left-40 w-64 h-64 bg-orange-500/8 blur-3xl rounded-full" />
      <div className="absolute bottom-0 -right-40 w-64 h-64 bg-orange-500/8 blur-3xl rounded-full" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <div className="flex items-center justify-center gap-6 md:gap-10 mb-10">
          {[
            { number: "+1.200", label: "Estudiantes" },
            { number: "+25", label: "Cursos" },
            { number: "4.9/5", label: "Valoración" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-[#ff7a00] font-bold text-xl md:text-2xl font-poppins">
                {stat.number}
              </p>
              <p className="text-white/60 text-xs mt-1 font-roboto">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="w-16 h-px bg-white/20 mx-auto mb-10" />

        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight font-poppins tracking-tight">
          ¿Listo para{" "}
          <span className="text-[#ff7a00] drop-shadow-[0_0_10px_rgba(255,122,0,0.3)]">transformar tu pasión</span>{" "}
          en tu camino?
        </h2>
        <p className="text-white/60 text-base leading-relaxed mb-8 max-w-xl mx-auto font-roboto">
          Únete a más de 1.200 estudiantes que están viviendo la música en 4uStudio Academy.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {features.map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1.5 text-xs text-white/60 bg-white/[0.08] border border-white/20 rounded-full px-3.5 py-1.5 font-roboto"
            >
              <svg className="w-3 h-3 text-[#ff7a00]" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
                <path d="M256 48C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48zm86.6 190.6l-112 112c-12.5 12.5-32.8 12.5-45.3 0l-48-48c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l25.4 25.4 89.4-89.4c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3z" />
              </svg>
              {f}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <Button href="/contacto" size="lg">
            Agendar Clase
            <svg className="w-5 h-5 fill-current" viewBox="0 0 320 512" aria-hidden="true" focusable="false">
              <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z" />
            </svg>
          </Button>
          <Button href="/planes" variant="secondary" size="lg">
            Conocer más
          </Button>
        </div>
      </div>
    </section>
  );
}

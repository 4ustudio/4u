import Button from "@/components/ui/Button";

export default function CTASection() {
  return (
    <section className="w-full py-32 md:py-40 bg-black relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/15 blur-3xl rounded-full" />
      <div className="absolute top-0 -left-40 w-80 h-80 bg-orange-500/5 blur-3xl rounded-full" />
      <div className="absolute bottom-0 -right-40 w-80 h-80 bg-orange-500/5 blur-3xl rounded-full" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight font-poppins">
          ¿Listo para{" "}
          <span className="text-[#ff7a00] drop-shadow-[0_0_15px_rgba(255,122,0,0.4)]">transformar tu pasión</span>{" "}
          en tu camino?
        </h2>
        <p className="text-white/50 text-lg leading-relaxed mb-12 max-w-2xl mx-auto font-roboto">
          Únete a más de 1.200 estudiantes que están viviendo la música en 4uStudio Academy.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button href="/contacto" size="lg">
            Agendar Clase
            <svg className="w-5 h-5 fill-current" viewBox="0 0 320 512" aria-hidden="true" focusable="false">
              <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"/>
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

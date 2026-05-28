import Link from "next/link";
import Button from "@/components/ui/Button";

export default function CTASection() {
  return (
    <section className="w-full py-24 md:py-32 bg-gradient-to-b from-amber-50/30 to-stone-50 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#ff7a00]/5 blur-3xl rounded-full" />

      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight font-poppins tracking-tight">
          ¿Listo para{" "}
          <span className="text-[#ff7a00]">transformar tu pasión</span>{" "}
          en tu camino?
        </h2>
        <p className="text-gray-500 text-base leading-relaxed mb-10 max-w-lg mx-auto font-roboto">
          Únete a más de 1.200 estudiantes que están viviendo la música en 4uStudio Academy.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Button href="/contacto" size="lg">
            Agendar Clase
            <svg className="w-5 h-5 fill-current" viewBox="0 0 320 512" aria-hidden="true" focusable="false">
              <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z" />
            </svg>
          </Button>
          <Link
            href="/planes"
            className="inline-flex items-center gap-2 font-semibold rounded-full transition-all duration-300 px-10 py-4 text-lg border-2 border-stone-200 text-stone-500 hover:border-[#ff7a00]/40 hover:text-[#ff7a00] hover:-translate-y-0.5"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Conocer más
          </Link>
        </div>
      </div>
    </section>
  );
}

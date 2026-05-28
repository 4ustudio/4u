import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Producción",
  description: "Servicios de producción musical profesional: grabación, mezcla y masterización para artistas en 4uStudio Academy.",
};

export default function ProduccionPage() {
  return (
    <PageLayout>
      <section className="relative w-full overflow-hidden">
        <div className="absolute top-1/4 -left-40 w-96 h-96 bg-orange-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-1/4 -right-40 w-80 h-80 bg-orange-500/5 blur-3xl rounded-full" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight font-poppins">
              Producción{" "}
              <span className="text-[#ff7a00] drop-shadow-[0_0_12px_rgba(255,122,0,0.3)]">Musical</span>
            </h1>
          </div>

          <div className="w-full bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl max-w-4xl">
            <p className="text-white/60 text-lg leading-relaxed mb-8 font-roboto">
              Ofrecemos servicios de producción musical profesional para artistas que quieren
              llevar su música al siguiente nivel. Desde la grabación hasta la mezcla y
              masterización, nuestro equipo está listo para hacer realidad tu visión artística.
            </p>
            <Link
              href="/contacto"
              className="inline-block text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 shadow-xl shadow-[#ff7a00]/20 hover:shadow-2xl hover:shadow-[#ff7a00]/40 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a00]/50"
              style={{ backgroundColor: "#ff7a00", fontFamily: "'Poppins', sans-serif" }}
            >
              Solicitar cotización
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

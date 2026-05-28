import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";

export const metadata: Metadata = {
  title: "Nosotros",
  description: "Conoce 4uStudio Academy — academia de música profesional con instructores especializados y estudios de grabación.",
};

export default function NosotrosPage() {
  return (
    <PageLayout>
      <section className="relative w-full overflow-hidden">
        <div className="absolute top-1/4 -left-40 w-96 h-96 bg-orange-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-1/4 -right-40 w-80 h-80 bg-orange-500/5 blur-3xl rounded-full" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.08)] font-poppins">
              Sobre{" "}
              <span className="text-[#ff7a00] drop-shadow-[0_0_12px_rgba(255,122,0,0.3)]">4uStudio</span>
            </h1>
          </div>

          <div className="w-full bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl max-w-4xl">
            <p className="text-white/60 text-lg leading-relaxed font-roboto">
              4ustudio Academy es una academia de música dedicada a convertir tu pasión
              musical en realidad. Contamos con instructores especializados, estudios
              profesionales y planes diseñados para cada etapa de tu desarrollo artístico.
            </p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

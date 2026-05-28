import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";
import PlanCard from "@/components/cards/PlanCard";
import { PLANES } from "@/data/plans-adults";

export const metadata: Metadata = {
  title: "Planes",
  description: "Planes de música para jóvenes y adultos: graba tu canción, conviértete en artista.",
};

export default function PlanesPage() {
  return (
    <PageLayout>
      <section className="relative w-full overflow-hidden flex items-end pb-12 pt-28 px-6 lg:px-8"
        style={{ minHeight: "320px" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-10" />
        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-[500px] h-[500px] bg-orange-500/20 blur-3xl rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-orange-500/8 blur-3xl rounded-full" />

        <div className="relative z-20 max-w-7xl mx-auto w-full">
          <h1
            className="text-white font-bold text-3xl md:text-4xl lg:text-5xl drop-shadow-[0_0_15px_rgba(255,255,255,0.08)] font-poppins"
          >
            Planes para Jóvenes y{" "}
            <span className="text-[#ff7a00] drop-shadow-[0_0_12px_rgba(255,122,0,0.3)]">Adultos</span>
          </h1>
          <p
            className="text-white/50 mt-4 text-lg max-w-xl font-roboto"
          >
            Graba tu canción, conviértete en artista, construye tu proyecto musical.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24 px-6 lg:px-8 bg-black">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PLANES.map((plan) => (
            <PlanCard key={`${plan.name}-${plan.subtitle}`} {...plan} />
          ))}
        </div>
      </section>
    </PageLayout>
  );
}

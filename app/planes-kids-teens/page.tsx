import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";
import PlanCard from "@/components/cards/PlanCard";
import { PLANES_KIDS } from "@/data/plans-kids";

export const metadata: Metadata = {
  title: "Planes Kids & Teens",
  description: "Planes de música para niños y adolescentes: descubre la música, graba tu canción.",
};

export default function PlanesKidsTeensPage() {
  return (
    <PageLayout>
      <section className="relative w-full overflow-hidden flex items-end pb-16 pt-32 px-6 lg:px-8"
        style={{ minHeight: "380px" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-10" />
        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-[500px] h-[500px] bg-orange-500/20 blur-3xl rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-orange-500/8 blur-3xl rounded-full" />

        <div className="relative z-20 max-w-7xl mx-auto w-full">
          <h1
            className="text-white font-bold text-4xl md:text-5xl lg:text-6xl drop-shadow-[0_0_15px_rgba(255,255,255,0.08)] font-poppins"
          >
            Planes{" "}
            <span className="text-[#ff7a00] drop-shadow-[0_0_12px_rgba(255,122,0,0.3)]">Kids &amp; Teens</span>
          </h1>
          <p
            className="text-white/50 mt-4 text-lg max-w-xl font-roboto"
          >
            Desarrolla confianza, autoestima y amor por la música desde temprana edad.
          </p>
        </div>
      </section>

      <section className="py-20 md:py-28 px-6 lg:px-8 bg-black">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {PLANES_KIDS.map((plan) => (
            <PlanCard key={plan.subtitle} {...plan} />
          ))}
        </div>
      </section>
    </PageLayout>
  );
}

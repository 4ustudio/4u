import type { Metadata } from "next";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import OptimizedImage from "@/components/ui/OptimizedImage";
import PlanCardsSection from "./_components/PlanCardsSection";

export const metadata: Metadata = {
  title: "Planes para Jóvenes y Adultos",
  description: "Planes musicales para jóvenes y adultos de 4U Studio Academy.",
};

export default function PlanesJovenesAdultosPage() {
  return (
    <PageLayout>
      <section className="relative -mt-16 overflow-hidden bg-black px-6 pb-6 pt-20 lg:px-8">
        <OptimizedImage
          src="/images/hero/Banner.png"
          alt="Planes para jóvenes y adultos"
          fill
          priority
          className="object-cover object-[65%_45%] opacity-35"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/45" />
        <div className="plans-frame relative flex min-h-[170px] items-end">
          <div className="border-l-4 border-[#ff7a00] pl-8">
            <h1 className="text-5xl font-extrabold tracking-normal text-white font-poppins">
              Nuestros Planes
            </h1>
            <p className="mt-4 text-lg text-white/85 font-roboto">
              Elige el plan que se adapta a tu nivel y metas musicales.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 pb-28 pt-7 text-gray-950 lg:px-8">
        <div className="plans-frame">
          <PlanCardsSection />

          <div className="mt-8 grid items-center gap-6 rounded-xl bg-white p-6 shadow-xl shadow-gray-950/10 ring-1 ring-gray-200 md:grid-cols-[1.5fr_1fr_1fr]">
            <div className="flex items-center gap-5">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#ff6b00] text-[#ff6b00]">
                <svg className="h-8 w-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M4 16h5l3-8 5 15 4-11 3 4h4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <h2 className="text-2xl font-extrabold font-poppins">¿No sabes qué plan es para ti?</h2>
                <p className="text-gray-500 font-roboto">Te ayudamos a elegir el mejor camino.</p>
              </div>
            </div>
            <CTAItem title="Agenda tu Clase" text="Conoce nuestras instalaciones" href="/mi-cuenta/login" />
            <CTAItem title="Solicita asesoría" text="Hablemos de tu proyecto" href="/contacto" />
          </div>
        </div>
      </section>
    </PageLayout>
  );
}


function CTAItem({ title, text, href }: { title: string; text: string; href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-4 border-l border-gray-200 pl-8">
      <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-orange-50 text-[#ff6b00]">
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M8 2v4M16 2v4M4 10h16M6 4h12a2 2 0 0 1 2 2v14H4V6a2 2 0 0 1 2-2Z" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-lg font-extrabold font-poppins">{title}</strong>
        <span className="text-gray-500 font-roboto">{text}</span>
      </span>
      <span className="text-2xl" aria-hidden="true">→</span>
    </Link>
  );
}

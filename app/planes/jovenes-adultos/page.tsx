import type { Metadata } from "next";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { PLANES_ADULTOS } from "@/data/plans-adults";

export const metadata: Metadata = {
  title: "Planes para Jóvenes y Adultos",
  description: "Planes musicales para jóvenes y adultos de 4U Studio Academy.",
};

const FILTERS = ["Todos", "Inicial", "Artista", "Profesional", "Empresas"];

export default function PlanesJovenesAdultosPage() {
  return (
    <PageLayout>
      <section className="relative -mt-16 overflow-hidden bg-black px-6 pb-6 pt-20 lg:px-8">
        <OptimizedImage
          src="/images/hero/banner-principal.jpg"
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
          <div className="mb-6 flex flex-wrap justify-center gap-4">
            {FILTERS.map((filter, index) => (
              <button
                key={filter}
                className={`inline-flex min-w-[132px] items-center justify-center gap-3 rounded-lg px-6 py-3 text-sm font-bold shadow-md font-poppins ${
                  index === 0 ? "bg-[#ff6b00] text-white shadow-orange-500/25" : "bg-white text-gray-950 ring-1 ring-gray-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {PLANES_ADULTOS.map((plan) => (
              <AdultPlanCard key={plan.id} plan={plan} />
            ))}
          </div>

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
            <CTAItem title="Agenda tu Clase" text="Conoce nuestras instalaciones" href="/agendar" />
            <CTAItem title="Solicita asesoría" text="Hablemos de tu proyecto" href="/contacto" />
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

function AdultPlanCard({ plan }: { plan: typeof PLANES_ADULTOS[0] }) {
  const featured = !!plan.highlighted;
  return (
    <article className={`overflow-hidden rounded-xl shadow-xl shadow-gray-950/10 ring-1 ring-gray-200 ${featured ? "bg-gray-950 text-white" : "bg-white text-gray-950"}`}>
      <div className="relative h-[165px]">
        <OptimizedImage
          src={plan.image}
          alt={plan.name}
          fill
          className={`object-cover ${plan.imagePosition ?? ""}`}
          sizes="(max-width: 1024px) 100vw, 33vw"
        />
        <span className="absolute left-5 top-5 rounded-md bg-[#ff6b00] px-3 py-2 text-base font-extrabold text-white font-poppins">
          {String(plan.id).padStart(2, "0")}
        </span>
        {plan.highlighted && (
          <span className="absolute right-5 top-5 rounded-full bg-[#ff6b00] px-3 py-1 text-xs font-bold text-white font-poppins">
            {plan.badge}
          </span>
        )}
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#ff6b00] font-roboto mb-1">{plan.subtitle}</p>
        <h2 className="text-xl font-extrabold leading-tight font-poppins">{plan.name}</h2>
        <p className={`mt-2 text-sm ${featured ? "text-white/80" : "text-gray-600"} font-roboto`}>{plan.description}</p>
        <ul className="mt-4 space-y-1.5">
          {plan.features.map((f) => (
            <li key={f} className={`flex items-start gap-2 text-xs font-roboto ${featured ? "text-white/75" : "text-gray-600"}`}>
              <span className="mt-0.5 text-[#ff6b00] shrink-0">◎</span> {f}
            </li>
          ))}
        </ul>
        {plan.instruments && (
          <p className={`mt-3 text-xs font-roboto ${featured ? "text-white/50" : "text-gray-400"}`}>
            Instrumentos: {plan.instruments.join(", ")}
          </p>
        )}
        {plan.limitedOffer && (
          <p className="mt-2 text-[11px] text-[#ff6b00] font-roboto font-semibold">
            ⏳ Oferta por tiempo limitado · Proceso cada 3 meses
          </p>
        )}
        {plan.priceAlt && (
          <p className={`mt-2 text-[11px] font-roboto ${featured ? "text-white/50" : "text-gray-400"}`}>
            {plan.priceAlt}
          </p>
        )}
        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-lg font-extrabold font-poppins">{plan.price}</p>
          <Link href="/agendar" className={`inline-flex items-center gap-3 rounded-lg border px-5 py-2.5 text-sm font-bold font-poppins ${featured ? "border-[#ff6b00] text-[#ff6b00]" : "border-[#ff6b00]/50 text-[#ff6b00]"}`}>
            Ver plan <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
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

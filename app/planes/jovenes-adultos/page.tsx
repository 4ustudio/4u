import type { Metadata } from "next";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import OptimizedImage from "@/components/ui/OptimizedImage";

export const metadata: Metadata = {
  title: "Planes para Jóvenes y Adultos",
  description: "Planes musicales para jóvenes y adultos de 4U Studio Academy.",
};

const plans = [
  {
    index: "01",
    title: "Plan Base - Cumplo mi sueño",
    description: "Comienza tu experiencia musical con lo esencial.",
    price: "$1.100.000",
    tags: ["8 clases al mes", "Clases grupales", "Estudio básico"],
    featured: true,
    imagePosition: "object-[35%_45%]",
  },
  {
    index: "02",
    title: "Plan Base Plus - Más estudio",
    description: "Más práctica y recursos para avanzar.",
    price: "$1.600.000",
    tags: ["8 clases al mes", "Clases grupales", "Más estudio"],
    imagePosition: "object-[55%_52%]",
  },
  {
    index: "03",
    title: "Plan Artista - Tengo mi canción",
    description: "Produce tu canción original de inicio a fin.",
    price: "$3.500.000",
    tags: ["Producción musical", "6 clases", "Grabación"],
    imagePosition: "object-[72%_45%]",
  },
  {
    index: "04",
    title: "Plan Artista Pro - Proyecto artístico",
    description: "Desarrolla tu identidad y lanza tu proyecto.",
    price: "$4.500.000",
    tags: ["Producción avanzada", "Coaching", "Estrategia"],
    imagePosition: "object-[45%_72%]",
  },
  {
    index: "05",
    title: "Plan Profesional - Construyo mi carrera",
    description: "Formación integral para una carrera sólida.",
    price: "Según cotización",
    tags: ["Formación completa", "Producción", "Difusión"],
    imagePosition: "object-[62%_52%]",
  },
  {
    index: "06",
    title: "Plan Corporativo - Audio para marcas",
    description: "Soluciones de audio profesional para tu empresa.",
    price: "Según cotización",
    tags: ["Voice over", "Audio branding", "Entrega profesional"],
    imagePosition: "object-[80%_52%]",
  },
];

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
            {["Todos", "Inicial", "Artista", "Profesional", "Empresas"].map((filter, index) => (
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
            {plans.map((plan) => (
              <AdultPlanCard key={plan.index} {...plan} />
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

function AdultPlanCard({
  index,
  title,
  description,
  price,
  tags,
  featured,
  imagePosition,
}: {
  index: string;
  title: string;
  description: string;
  price: string;
  tags: string[];
  featured?: boolean;
  imagePosition: string;
}) {
  return (
    <article className={`overflow-hidden rounded-xl shadow-xl shadow-gray-950/10 ring-1 ring-gray-200 ${featured ? "bg-gray-950 text-white" : "bg-white text-gray-950"}`}>
      <div className="relative h-[165px]">
        <OptimizedImage
          src="/images/hero/banner-principal.jpg"
          alt={title}
          fill
          className={`object-cover ${imagePosition}`}
          sizes="(max-width: 1024px) 100vw, 33vw"
        />
        <span className="absolute left-5 top-5 rounded-md bg-[#ff6b00] px-3 py-2 text-base font-extrabold text-white font-poppins">
          {index}
        </span>
      </div>
      <div className="p-5">
        <h2 className="text-xl font-extrabold leading-tight font-poppins">{title}</h2>
        <p className={`mt-2 text-sm ${featured ? "text-white/80" : "text-gray-600"} font-roboto`}>{description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 font-roboto ${featured ? "bg-white/5 text-white/85 ring-white/15" : "bg-white text-gray-700 ring-gray-200"}`}>
              <span className="text-[#ff6b00]">◎</span> {tag}
            </span>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-lg font-extrabold font-poppins">{price}</p>
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

import type { Metadata } from "next";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import OptimizedImage from "@/components/ui/OptimizedImage";

export const metadata: Metadata = {
  title: "Planes Kids & Teens",
  description: "Planes de música para niños y adolescentes: descubre la música, graba tu canción.",
};

const kidsPlans = [
  {
    label: "Plan Kids & Teens",
    title: "Plan",
    accent: "Kids & Teens",
    price: "$1.100.000",
    color: "#ff6b00",
    imagePosition: "object-[25%_55%]",
    image: "/images/courses/plan-kids/Plan 1 Kids.png",
    description: "Plan completo para niños y adolescentes: clases especializadas, grabación profesional trimestral y presentaciones en tarima ante el público.",
    features: [
      "8 clases mensuales",
      "Canción acústica grabada profesionalmente cada 3 meses, mezclada y masterizada, lista para compartir con familiares, amigos o publicar en plataformas digitales",
      "Presentaciones en vivo en tarima durante los eventos de la academia (marzo, junio, septiembre y diciembre)*",
      "Clases con profesores especializados en: Técnica vocal · Guitarra · Bajo · Teclado · Batería · Otros instrumentos según disponibilidad",
      "Metodología lúdica, dinámica y creativa",
      "Desarrollo de la musicalidad integral: Entrenamiento auditivo · Sentido rítmico · Interpretación y expresión artística",
      "4 de las 8 clases grabadas y entregadas en formato MP3 (audio original sin edición), como herramienta de análisis, seguimiento y aprendizaje",
    ],
    objective: "Que el niño o adolescente aprenda, cree y se exprese musicalmente en un ambiente divertido e inspirador, culminando con una grabación profesional que queda como recuerdo.",
  },
  {
    label: "Plan Premium",
    title: "Plan Premium",
    accent: "Kids & Teens",
    price: "$1.600.000",
    color: "#1397a5",
    imagePosition: "object-[70%_55%]",
    image: "/images/courses/plan-kids/Plan 2 Teens.png",
    description: "La experiencia más completa: grabación profesional todos los meses, presentaciones en vivo y acompañamiento artístico integral mes a mes.",
    features: [
      "8 clases mensuales",
      "Canción acústica grabada profesionalmente cada mes, mezclada y masterizada, lista para compartir con familiares, amigos o publicar en plataformas digitales",
      "Presentaciones en vivo en tarima durante los eventos de la academia (marzo, junio, septiembre y diciembre)*",
      "Clases con profesores especializados en: Técnica vocal · Guitarra · Bajo · Teclado · Batería · Otros instrumentos según disponibilidad",
      "Metodología lúdica, dinámica y creativa",
      "Desarrollo de la musicalidad integral: Entrenamiento auditivo · Sentido rítmico · Interpretación y expresión artística",
      "4 de las 8 clases grabadas y entregadas en formato MP3 (audio original sin edición), como herramienta de análisis, seguimiento y aprendizaje",
    ],
    objective: "Vivir la emoción de grabar una canción profesional cada mes, construyendo confianza, autoestima y un portafolio musical propio.",
  },
];

export default function PlanesKidsTeensPage() {
  return (
    <PageLayout>
      <section className="relative -mt-16 overflow-hidden bg-black px-6 pb-7 pt-20 lg:px-8">
        <OptimizedImage
          src="/images/hero/Banner.png"
          alt="Planes Kids & Teens"
          fill
          priority
          className="object-cover object-[82%_45%] opacity-40"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/35" />
        <div className="plans-frame relative grid min-h-[220px] items-center gap-8 md:grid-cols-[120px_1fr]">
          <div className="hidden text-[#ff6b00] md:block">
            <svg className="h-28 w-28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
              <path d="M4 14a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h2v-5H4ZM20 14a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-2v-5h2Z" />
            </svg>
          </div>
          <div className="border-l-4 border-[#ff6b00] pl-8">
            <h1 className="text-5xl font-extrabold leading-tight tracking-normal text-white md:text-6xl font-poppins">
              Nuestros <br />
              Planes <span className="text-[#ff6b00]">Kids & Teens</span>
            </h1>
            <p className="mt-5 max-w-3xl text-xl leading-relaxed text-white font-roboto">
              Planes diseñados para niños y adolescentes que quieren aprender, crear y vivir la música en un ambiente divertido, seguro e inspirador.
            </p>
          </div>
        </div>
      </section>

      <section className="relative bg-white px-6 py-9 text-gray-950 lg:px-8">
        <div className="plans-frame grid gap-8 lg:grid-cols-2">
          {kidsPlans.map((plan) => (
            <KidsPlanCard key={plan.label} {...plan} />
          ))}
        </div>

        <p className="plans-frame mt-4 text-xs text-gray-400 font-roboto">
          *Aplica para estudiantes activos al momento de cada presentación.
        </p>

        <div className="plans-frame mt-8 grid items-center gap-6 rounded-2xl bg-white p-7 shadow-xl shadow-gray-950/10 ring-1 ring-gray-200 md:grid-cols-[1.2fr_1fr_1fr_auto]">
          <FooterInfo title="¿No sabes qué plan elegir?" text="Te ayudamos a encontrar el plan ideal para el talento y los sueños de tu hijo." />
          <FooterInfo title="Agenda una clase" text="Conoce nuestras instalaciones y vive la experiencia 4U." />
          <FooterInfo title="Hablemos de tu proyecto" text="Cuéntanos sus intereses y objetivos y te guiamos en el camino." />
          <Link href="/mi-cuenta/login" className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#ff6b00] px-8 py-4 text-base font-bold text-white shadow-lg shadow-orange-500/25 font-poppins">
            Agenda tu Clase
            <span aria-hidden="true">▦</span>
          </Link>
        </div>
      </section>
    </PageLayout>
  );
}

function KidsPlanCard({
  label,
  title,
  accent,
  price,
  color,
  imagePosition,
  image,
  description,
  features,
  objective,
}: {
  label: string;
  title: string;
  accent: string;
  price: string;
  color: string;
  imagePosition: string;
  image: string;
  description: string;
  features: string[];
  objective: string;
}) {
  return (
    <article className="grid overflow-hidden rounded-2xl bg-white shadow-xl shadow-gray-950/10 ring-1 lg:grid-cols-[42%_58%]" style={{ borderColor: `${color}55` }}>
      <div className="relative min-h-[370px]">
        <OptimizedImage
          src={image}
          alt={accent}
          fill
          className={`object-cover ${imagePosition}`}
          sizes="(max-width: 1024px) 100vw, 40vw"
        />
      </div>
      <div className="p-5">
        <span className="inline-flex rounded-lg px-4 py-2 text-sm font-extrabold uppercase text-white font-poppins" style={{ backgroundColor: color }}>
          {label}
        </span>
        <h2 className="mt-4 text-xl font-extrabold uppercase leading-tight font-poppins">
          {title}
          <br />
          <span className="normal-case" style={{ color }}>{accent}</span>
        </h2>
        <p className="mt-3 text-[13px] leading-relaxed text-gray-700 font-roboto">{description}</p>
        <ul className="mt-4 space-y-1.5">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-[13px] text-gray-800 font-roboto">
              <span className="mt-0.5" style={{ color }}>◎</span>
              {feature}
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-xl p-3.5" style={{ backgroundColor: `${color}12` }}>
          <p className="font-extrabold font-poppins" style={{ color }}>Objetivo</p>
          <p className="mt-1 text-[13px] leading-relaxed text-gray-700 font-roboto">{objective}</p>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <p className="text-2xl font-extrabold font-poppins">{price}</p>
          <Link href="/mi-cuenta/login" className="inline-flex items-center gap-3 rounded-lg px-6 py-3 text-sm font-bold text-white shadow-lg font-poppins" style={{ backgroundColor: color }}>
            Inscríbete
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

function FooterInfo({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex items-center gap-5 md:border-r md:border-gray-200 md:pr-6">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[#ff6b00]">
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M8 2v4M16 2v4M4 10h16M6 4h12a2 2 0 0 1 2 2v14H4V6a2 2 0 0 1 2-2Z" />
        </svg>
      </span>
      <span>
        <strong className="block text-lg font-extrabold font-poppins">{title}</strong>
        <span className="text-gray-500 font-roboto">{text}</span>
      </span>
    </div>
  );
}

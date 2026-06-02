import type { Metadata } from "next";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { PLANES_ADULTOS } from "@/data/plans-adults";

export const metadata: Metadata = {
  title: "Planes de estudio",
  description: "Elige entre planes para jóvenes y adultos o planes Kids & Teens.",
};

const adultPlans = PLANES_ADULTOS.slice(0, 3).map((p) => p.name);

const kidsPlans = [
  "Plan Kids & Teens 1",
  "Descubro la Música",
  "Grabo Mi Canción",
];

export default function PlanesPage() {
  return (
    <PageLayout>
      <section className="bg-white px-6 pb-24 pt-16 text-gray-950 lg:px-8">
        <div className="plans-frame">
          <div className="mb-10 text-center">
            <p className="mb-3 flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-[0.08em] text-[#ff7a00] font-poppins">
              <span className="h-px w-12 bg-[#ff7a00]" />
              <span>Planes de estudio</span>
              <span className="h-px w-12 bg-[#ff7a00]" />
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-normal md:text-6xl font-poppins">
              Elige el plan ideal para{" "}
              <br className="hidden sm:block" />
              <span className="text-[#ff7a00]">tu camino musical</span>
            </h1>
            <p className="mt-4 text-lg text-gray-500 font-roboto">
              Programas diseñados para cada etapa de tu aprendizaje. Aprende, crea y vive la música.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <PlanPathCard
              title="Para Jóvenes y Adultos"
              description="Desarrolla tu talento, crea tu sonido y alcanza tus metas musicales con guía profesional."
              href="/planes/jovenes-adultos"
              button="Explorar planes para Jóvenes y Adultos"
              icon="single"
              imagePosition="object-[45%_50%]"
              imageSrc="/images/courses/plan-adultos/Hombre-plan adultos.png"
              bullets={[
                { text: "Desarrolla tu estilo único", icon: "spark" },
                { text: "Aprende con mentores expertos", icon: "mentor" },
                { text: "Lleva tu proyecto al siguiente nivel", icon: "growth" },
              ]}
              plans={adultPlans}
            />
            <PlanPathCard
              title="Kids & Teens"
              description="Descubre la música, diviértete aprendiendo y expresa tu creatividad sin límites."
              href="/planes-kids-teens"
              button="Explorar planes para Kids & Teens"
              icon="group"
              imagePosition="object-[70%_50%]"
              imageSrc="/images/courses/plan-kids/nina-plan-kids.png"
              bullets={[
                { text: "Aprende de forma divertida y práctica", icon: "fun" },
                { text: "Clases dinámicas y motivadoras", icon: "energy" },
                { text: "Aumenta tu confianza y creatividad", icon: "idea" },
              ]}
              plans={kidsPlans}
            />
          </div>

          <div className="mt-10 grid items-center gap-6 rounded-2xl bg-[#fff6ef] px-8 py-8 shadow-sm md:grid-cols-[1fr_auto_1fr]">
            <div className="flex items-center gap-5">
              <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-white text-[#ff7a00] shadow-lg">
                <svg className="h-11 w-11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </span>
              <h2 className="text-3xl font-extrabold leading-tight font-poppins">
                Convierte tu pasión musical <span className="text-[#ff7a00]">en realidad</span>
              </h2>
            </div>
            <span className="hidden h-20 w-px bg-orange-200 md:block" />
            <div>
              <p className="mb-4 text-lg text-gray-600 font-roboto">
                Da el siguiente paso hoy y forma parte de la comunidad 4U Studio Academy.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/planes/jovenes-adultos" className="inline-flex items-center gap-2 rounded-lg bg-[#ff6b00] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 font-poppins">
                  Jóvenes y Adultos
                </Link>
                <Link href="/planes-kids-teens" className="inline-flex items-center gap-2 rounded-lg border border-[#ff6b00] px-8 py-3 text-sm font-bold text-gray-950 font-poppins">
                  Kids & Teens
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

function PlanPathCard({
  title,
  description,
  href,
  button,
  icon,
  imagePosition,
  imageSrc,
  bullets,
  plans,
}: {
  title: string;
  description: string;
  href: string;
  button: string;
  icon: "single" | "group";
  imagePosition: string;
  imageSrc: string;
  bullets: { text: string; icon: string }[];
  plans: string[];
}) {
  return (
    <article className="rounded-2xl bg-white shadow-2xl shadow-gray-950/10 ring-1 ring-gray-200 flex flex-col h-full">
      <div className="relative h-[315px] shrink-0 overflow-hidden rounded-t-2xl">
        <OptimizedImage
          src={imageSrc}
          alt={title}
          fill
          className={`object-cover ${imagePosition}`}
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
      </div>
      <div className="relative px-8 pb-8 pt-7 text-center flex flex-col flex-1">
        <span className="absolute -top-16 left-8 flex h-24 w-24 items-center justify-center rounded-full bg-white text-[#ff7a00] shadow-xl ring-4 ring-white">
          <PathIcon type={icon} />
        </span>
        <h2 className="text-3xl font-extrabold font-poppins">{title}</h2>
        <p className="mx-auto mt-3 max-w-md text-lg leading-relaxed text-gray-500 font-roboto">{description}</p>
        <div className="mt-7 grid gap-4 border-b border-gray-200 pb-7 md:grid-cols-3">
          {bullets.map((item) => (
            <div key={item.text} className="flex items-center gap-3 text-left text-sm font-bold text-gray-900 font-roboto">
              <span className="shrink-0 text-[#ff7a00]">
                <BulletIcon name={item.icon} />
              </span>
              {item.text}
            </div>
          ))}
        </div>
        <div className="divide-y divide-gray-200 py-3 text-left flex-1">
          {plans.map((plan) => (
            <div key={plan} className="flex items-center gap-4 rounded-lg px-4 py-3 font-medium text-gray-950 font-poppins">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[#ff7a00]">♫</span>
              {plan}
            </div>
          ))}
        </div>
        <Link href={href} className="mt-3 flex w-full items-center justify-center gap-3 rounded-lg bg-[#ff6b00] px-6 py-4 text-base font-bold text-white shadow-lg shadow-orange-500/20 font-poppins">
          {button}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

function PathIcon({ type }: { type: "single" | "group" }) {
  return (
    <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      {type === "single" ? (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
        </>
      ) : (
        <>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M3 21c0-3.7 2.7-7 6-7s6 3.3 6 7M14 15c3 0 5 2.5 5 6" />
        </>
      )}
    </svg>
  );
}

function BulletIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    spark: ( // estilo único
      <>
        <path d="M12 3v3M12 18v3M5 12H2M22 12h-3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    mentor: ( // mentores expertos
      <>
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c0 1 2 3 6 3s6-2 6-3v-5" />
      </>
    ),
    growth: ( // siguiente nivel
      <>
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M17 7h4v4" />
      </>
    ),
    fun: ( // divertida y práctica
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <path d="M9 9h.01M15 9h.01" />
      </>
    ),
    energy: ( // dinámicas y motivadoras
      <path d="M13 2L3 14h9l-1 8 10-12h-9z" />
    ),
    idea: ( // confianza y creatividad
      <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z" />
    ),
  };

  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] ?? <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3Z" />}
    </svg>
  );
}

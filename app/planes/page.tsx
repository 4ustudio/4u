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
              Elige el plan ideal para <span className="text-[#ff7a00]">tu camino musical</span>
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
              bullets={["Desarrolla tu estilo único", "Aprende con mentores expertos", "Lleva tu proyecto al siguiente nivel"]}
              plans={adultPlans}
            />
            <PlanPathCard
              title="Kids & Teens"
              description="Descubre la música, diviértete aprendiendo y expresa tu creatividad sin límites."
              href="/planes-kids-teens"
              button="Explorar planes para Kids & Teens"
              icon="group"
              imagePosition="object-[70%_50%]"
              imageSrc="/images/courses/plan-kids/Niña-Plan kids.png"
              bullets={["Aprende de forma divertida y práctica", "Clases dinámicas y motivadoras", "Aumenta tu confianza y creatividad"]}
              plans={kidsPlans}
            />
          </div>

          <div className="mt-10 grid items-center gap-6 rounded-2xl bg-[#fff6ef] px-8 py-8 shadow-sm md:grid-cols-[1fr_auto_1fr]">
            <div className="flex items-center gap-5">
              <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-white text-[#ff7a00] shadow-lg">
                <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m8 18 8-8M9 7l8 8M14 4l6 6M4 14l6 6" />
                  <path d="M7 7c-1.8 1.8-1.8 4.7 0 6.5s4.7 1.8 6.5 0" />
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
  bullets: string[];
  plans: string[];
}) {
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-2xl shadow-gray-950/10 ring-1 ring-gray-200">
      <div className="relative h-[315px]">
        <OptimizedImage
          src={imageSrc}
          alt={title}
          fill
          className={`object-cover ${imagePosition}`}
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
      </div>
      <div className="relative px-8 pb-8 pt-7 text-center">
        <span className="absolute -top-16 left-8 flex h-24 w-24 items-center justify-center rounded-full bg-white text-[#ff7a00] shadow-xl">
          <PathIcon type={icon} />
        </span>
        <h2 className="text-3xl font-extrabold font-poppins">{title}</h2>
        <p className="mx-auto mt-3 max-w-md text-lg leading-relaxed text-gray-500 font-roboto">{description}</p>
        <div className="mt-7 grid gap-4 border-b border-gray-200 pb-7 md:grid-cols-3">
          {bullets.map((item) => (
            <div key={item} className="flex items-center gap-3 text-left text-sm font-bold text-gray-900 font-roboto">
              <span className="text-[#ff7a00]">
                <StarIcon />
              </span>
              {item}
            </div>
          ))}
        </div>
        <div className="divide-y divide-gray-200 py-3 text-left">
          {plans.map((plan) => (
            <Link key={plan} href={href} className="flex items-center justify-between rounded-lg px-4 py-3 font-medium text-gray-950 transition-colors hover:bg-orange-50 font-poppins">
              <span className="flex items-center gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-[#ff7a00]">♫</span>
                {plan}
              </span>
              <span aria-hidden="true">›</span>
            </Link>
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

function StarIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
    </svg>
  );
}

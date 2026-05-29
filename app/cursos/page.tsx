import type { Metadata } from "next";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import OptimizedImage from "@/components/ui/OptimizedImage";
import CourseCardFull from "@/components/cards/CourseCardFull";
import { ACADEMY } from "@/lib/constants";
import { courses } from "@/data/courses";

export const metadata: Metadata = {
  title: "Cursos de Música | 4U Studio Academy",
  description:
    "Clases de guitarra, piano, canto, batería, bajo y producción musical en Bogotá. Aprende con profesores profesionales en un ambiente creativo y moderno.",
  openGraph: {
    title: "Cursos de Música | 4U Studio Academy",
    description:
      "Clases de guitarra, piano, canto, batería, bajo y producción musical en Bogotá.",
  },
};

const waLink = `https://api.whatsapp.com/send/?phone=${ACADEMY.phone}&text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20los%20cursos%20de%204U%20Studio%20Academy`;

const audiences = [
  {
    title: "Niños",
    description: "Aprendizaje divertido y adaptado a cada edad.",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21v-2a6 6 0 0 0-4.5-5.8" />
        <path d="M8.5 13.2A6 6 0 0 0 4 19v2" />
        <path d="M12 14v5" />
        <path d="M10 16h4" />
      </svg>
    ),
  },
  {
    title: "Adolescentes",
    description: "Desarrollo artístico y acompañamiento profesional.",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="7" r="4" />
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <path d="M17 13.5a4 4 0 0 1 3 6.5" />
        <path d="M20 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
      </svg>
    ),
  },
  {
    title: "Adultos",
    description: "Aprende a tu ritmo sin importar tu experiencia previa.",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21v-2a6 6 0 0 0-4.5-5.8" />
        <path d="M4 21v-2a6 6 0 0 1 3-5.3" />
        <path d="M12 12v6" />
        <path d="M9 18h6" />
      </svg>
    ),
  },
];

const methodologyCards = [
  {
    title: "Clases personalizadas",
    description: "Atención individual para cada estudiante. Cada clase se adapta a tu nivel, ritmo y objetivos musicales.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: "Profesores expertos",
    description: "Músicos profesionales con experiencia real en escenarios, grabación y enseñanza.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z" />
        <path d="M8 7h8" />
        <path d="M8 11h8" />
        <path d="M8 15h5" />
      </svg>
    ),
  },
  {
    title: "Estudio equipado",
    description: "Espacios diseñados para aprender y crear con equipos profesionales para cada instrumento.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    title: "Seguimiento constante",
    description: "Avance medible en cada etapa con retroalimentación periódica y ajuste continuo del plan de aprendizaje.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
];

export default function CursosPage() {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative w-full min-h-[600px] lg:min-h-[650px] bg-black overflow-hidden flex items-stretch">
        <div className="absolute inset-0">
          <OptimizedImage
            src="/images/hero/Banner-2.jpg.jpeg"
            alt="Cursos de música 4U Studio Academy"
            fill
            priority
            className="object-cover object-center scale-105"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/40" />
          <div className="absolute inset-0 bg-black/50 lg:hidden" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-28 flex items-center">
          <div className="max-w-[580px]">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-8 bg-[#ff7a00]" />
              <span className="text-[#ff7a00] text-xs font-bold uppercase tracking-[0.2em] font-poppins">
                4U Studio Academy
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold leading-[1.05] text-white mb-5 font-poppins">
              Nuestros{" "}
              <span className="text-[#ff7a00]">Cursos</span>
            </h1>
            <p className="text-base md:text-lg text-white/70 max-w-[500px] mb-6 leading-relaxed font-roboto">
              Clases personalizadas para niños, adolescentes y adultos.
              Aprende con profesores profesionales en un ambiente creativo y moderno.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#cursos"
                className="inline-flex items-center gap-2.5 bg-[#ff7a00] text-white font-semibold px-7 py-3.5 rounded-full text-sm transition-all duration-300 hover:bg-[#e66e00] hover:-translate-y-0.5 shadow-xl shadow-[#ff7a00]/25 hover:shadow-2xl hover:shadow-[#ff7a00]/40 font-poppins"
              >
                Ver cursos
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 13l5 5 5-5" />
                  <path d="M7 6l5 5 5-5" />
                </svg>
              </a>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-[#25D366] text-white font-semibold px-7 py-3.5 rounded-full text-sm transition-all duration-300 hover:bg-[#20bd5a] hover:-translate-y-0.5 shadow-xl shadow-[#25D366]/20 hover:shadow-2xl hover:shadow-[#25D366]/40 font-poppins"
              >
                <svg className="h-5 w-5 fill-white shrink-0" viewBox="0 0 448 512" aria-hidden="true">
                  <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6z" />
                </svg>
                Hablar por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Grid de cursos */}
      <section id="cursos" className="relative w-full bg-black py-20 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-black to-black pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="h-px w-8 bg-[#ff7a00]/60" />
              <span className="text-[#ff7a00] text-xs font-bold uppercase tracking-[0.2em] font-poppins">
                Encuentra tu curso
              </span>
              <span className="h-px w-8 bg-[#ff7a00]/60" />
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white font-poppins leading-tight">
              Todos nuestros{" "}
              <span className="text-[#ff7a00]">cursos</span>
            </h2>
            <p className="mt-4 text-white/50 max-w-2xl mx-auto font-roboto text-sm md:text-base">
              Elige el instrumento o disciplina que más te apasione y comienza tu viaje musical con nosotros.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {courses.map((course) => (
              <CourseCardFull key={course.title} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* ¿Para quién son nuestros cursos? */}
      <section className="relative w-full bg-zinc-950 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[#ff7a00] text-xs font-bold uppercase tracking-[0.2em] font-poppins">
              Para todos
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mt-4 font-poppins leading-tight">
              ¿Para quién son nuestros{" "}
              <span className="text-[#ff7a00]">cursos</span>?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {audiences.map((item) => (
              <div
                key={item.title}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] p-8 md:p-10 text-center transition-all duration-500 hover:border-[#ff7a00]/20 hover:bg-white/[0.06]"
              >
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#ff7a00]/10 text-[#ff7a00] transition-transform duration-500 group-hover:scale-110 group-hover:bg-[#ff7a00]/20">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 font-poppins">
                  {item.title}
                </h3>
                <p className="text-white/55 leading-relaxed font-roboto text-sm">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Metodología */}
      <section className="relative w-full bg-black py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#ff7a00] blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[#ff7a00] text-xs font-bold uppercase tracking-[0.2em] font-poppins">
              Metodología
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mt-4 font-poppins leading-tight">
              Así se vive una clase en{" "}
              <span className="text-[#ff7a00]">4U Studio Academy</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {methodologyCards.map((card) => (
              <div
                key={card.title}
                className="group rounded-2xl border border-white/5 bg-white/[0.03] p-8 transition-all duration-500 hover:border-[#ff7a00]/20 hover:bg-white/[0.06] hover:-translate-y-1"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-[#ff7a00]/10 text-[#ff7a00] transition-colors duration-300 group-hover:bg-[#ff7a00]/20">
                  {card.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-3 font-poppins">
                  {card.title}
                </h3>
                <p className="text-white/55 leading-relaxed font-roboto text-sm">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA principal */}
      <section className="relative w-full bg-zinc-950 py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#ff7a00] blur-[150px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#25D366] blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white font-poppins leading-tight">
            ¿Listo para comenzar tu{" "}
            <span className="text-[#ff7a00]">camino musical</span>?
          </h2>
          <p className="mt-6 text-white/60 max-w-2xl mx-auto font-roboto text-base md:text-lg leading-relaxed">
            Escríbenos y te ayudaremos a elegir el curso ideal según tu edad, experiencia y objetivos.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-[#25D366] text-white font-semibold px-8 py-4 rounded-full text-base transition-all duration-300 hover:bg-[#20bd5a] hover:-translate-y-0.5 shadow-xl shadow-[#25D366]/20 hover:shadow-2xl hover:shadow-[#25D366]/40 font-poppins"
            >
              <svg className="h-5 w-5 fill-white shrink-0" viewBox="0 0 448 512" aria-hidden="true">
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6z" />
              </svg>
              Hablar por WhatsApp
            </a>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

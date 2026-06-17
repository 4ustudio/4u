import type { Metadata } from "next";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import OptimizedImage from "@/components/ui/OptimizedImage";
import ProcesoSection from "./_components/ProcesoSection";
import TeamSection from "./_components/TeamSection";
import { instructors } from "@/data/instructors";

export const metadata: Metadata = {
  title: "Nosotros | 4U Studio Academy",
  description:
    "Conoce 4U Studio Academy — academia de música, estudio de producción y casa de desarrollo artístico en Bogotá. Clases personalizadas para niños, adolescentes y adultos.",
  openGraph: {
    title: "Nosotros | 4U Studio Academy",
    description:
      "Academia de música + producción + desarrollo artístico en Bogotá.",
  },
};

const values = [
  {
    title: "Pasión",
    description: "Amamos la música\ny la enseñanza.",
    icon: (
      <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    title: "Disciplina",
    description: "El crecimiento artístico\nrequiere constancia.",
    icon: (
      <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    title: "Creatividad",
    description: "Cada estudiante desarrolla\nsu propia identidad.",
    icon: (
      <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    title: "Comunidad",
    description: "Creamos espacios donde\nla música conecta personas.",
    icon: (
      <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

const processSteps = [
  "Soñar",
  "Aprender",
  "Practicar",
  "Grabar",
  "Escuchar",
  "Mejorar",
  "Mostrar",
  "Sentirse artista",
];

const personSchema = {
  "@context": "https://schema.org",
  "@graph": instructors.map((i) => ({
    "@type": "Person",
    name: i.name,
    jobTitle: i.role,
    description: i.bio,
    knowsAbout: i.specialties,
    worksFor: { "@type": "Organization", name: "4U Studio Academy" },
    image: `https://4ustudio.co${i.photo}`,
  })),
};

export default function NosotrosPage() {
  return (
    <PageLayout>
      {/* ──────── 1. Hero institucional ──────── */}
      <section className="relative w-full min-h-[580px] sm:min-h-[620px] lg:min-h-[650px] bg-black overflow-hidden flex items-stretch">

        {/* Imagen de fondo — posición ajustada por breakpoint */}
        <div className="absolute inset-0">
          <OptimizedImage
            src="/images/hero/Banner-Nosotros.jpg.jpeg"
            alt="4U Studio Academy"
            fill
            priority
            className="object-cover object-center lg:object-left lg:scale-110 lg:translate-x-[12%]"
            sizes="100vw"
          />
        </div>

        {/* ── Overlays cinematográficos ── */}

        {/* 1a. Degradado desktop: negro intenso izq → transparente der */}
        <div
          className="absolute inset-0 z-[1] hidden lg:block"
          style={{
            background:
              'linear-gradient(to right, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.72) 30%, rgba(20,8,0,0.38) 55%, rgba(255,122,0,0.08) 72%, transparent 100%)',
          }}
        />

        {/* 1b. Degradado móvil: negro abajo → semitransparente arriba (legibilidad sobre los artistas) */}
        <div
          className="absolute inset-0 z-[1] lg:hidden"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.60) 40%, rgba(0,0,0,0.85) 100%)',
          }}
        />

        {/* 2. Viñeta perimetral (ambos breakpoints) */}
        <div
          className="absolute inset-0 z-[2]"
          style={{
            boxShadow: 'inset 0 0 120px 40px rgba(0,0,0,0.55)',
          }}
        />

        {/* Contenido */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-28 sm:py-32 lg:py-28 flex items-end lg:items-center">
          <div className="max-w-[580px]">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-8 bg-[#ff7a00]" />
              <span className="text-[#ff7a00] text-xs font-bold uppercase tracking-[0.2em] font-poppins drop-shadow-md">
                4U Studio Academy
              </span>
            </div>
            <h1
              className="text-4xl md:text-5xl lg:text-7xl font-extrabold leading-[1.05] text-white mb-5 font-poppins"
              style={{ textShadow: '0 4px 20px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.40)' }}
            >
              ¿Quiénes{" "}
              <span className="text-[#ff7a00]">somos</span>?
            </h1>
            <p
              className="text-base md:text-lg text-white/60 max-w-[520px] mb-3 font-roboto font-semibold tracking-wide uppercase"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.50)' }}
            >
              Academia + Producción + Desarrollo Artístico
            </p>
            <p
              className="text-base md:text-lg text-white/80 max-w-[500px] mb-4 leading-relaxed font-roboto"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.45)' }}
            >
              Somos una academia y estudio musical creado para personas que aman la música y desean desarrollar su talento de forma profesional.
            </p>
            <p
              className="text-base md:text-lg text-white/80 max-w-[500px] mb-8 leading-relaxed font-roboto"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.45)' }}
            >
              Acompañamos a niños, adolescentes y adultos en su proceso artístico mediante clases personalizadas, producción musical y experiencias creativas reales.
            </p>
            <Link
              href="/planes"
              className="inline-flex items-center gap-2.5 bg-[#ff7a00] text-white font-semibold px-7 py-3.5 rounded-full text-sm transition-all duration-300 hover:bg-[#e66e00] hover:-translate-y-0.5 shadow-xl shadow-[#ff7a00]/25 hover:shadow-2xl hover:shadow-[#ff7a00]/40 font-poppins"
            >
              Conoce nuestros planes
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ──────── 3. Frase institucional ──────── */}
      <section className="relative w-full bg-black overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-6 py-14 lg:py-20">
            {/* Text left */}
            <div>
              <span className="block text-6xl text-[#ff7a00]/30 mb-4 font-poppins leading-none">&ldquo;</span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white font-poppins leading-tight mb-4">
                En 4U Studio Academy no enseñamos<br />
                música como una materia.&rdquo;
              </h2>
              <p className="text-lg md:text-xl text-[#ff7a00] font-bold font-poppins">
                La enseñamos como un sueño que se construye.
              </p>
            </div>
            {/* Video right — visible en todos los breakpoints */}
            <div className="relative h-[220px] sm:h-[300px] lg:h-[420px] rounded-2xl overflow-hidden">
              <video
                src="/images/hero/hf_20260603_132024_66aa16f3-508a-4fd7-9e4f-a228b9963941.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent lg:bg-gradient-to-r lg:from-black lg:via-black/30 lg:to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ──────── 4. Historia / Misión / Filosofía ──────── */}
      <section className="relative w-full bg-black py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-[#ff7a00] text-xs font-bold uppercase tracking-[0.2em] font-poppins">
              Nuestra esencia
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mt-4 font-poppins leading-tight">
              Lo que nos{" "}
              <span className="text-[#ff7a00]">define</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Historia */}
            <article className="group rounded-2xl border border-white/5 bg-white/[0.03] overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-[#ff7a00]/20 hover:shadow-2xl hover:shadow-[#ff7a00]/5">
              <div className="relative h-72 overflow-hidden">
                <OptimizedImage
                  src="/images/hero/Nuestra historia.png"
                  alt="Nuestra Historia"
                  fill
                  className="object-cover object-[50%_50%] transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
              <div className="p-7">
                <h3 className="text-xl font-bold text-white font-poppins mb-3">
                  Nuestra Historia
                </h3>
                <p className="text-white/55 leading-relaxed font-roboto text-sm">
                  Guiamos a estudiantes de todas las edades para desarrollar su talento y convertir sus ideas en proyectos reales.
                </p>
              </div>
            </article>

            {/* Misión */}
            <article className="group rounded-2xl border border-white/5 bg-white/[0.03] overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-[#ff7a00]/20 hover:shadow-2xl hover:shadow-[#ff7a00]/5">
              <div className="relative h-72 overflow-hidden">
                <OptimizedImage
                  src="/images/hero/Nuestra mision.png"
                  alt="Nuestra Misión"
                  fill
                  className="object-cover object-[50%_35%] transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
              <div className="p-7">
                <h3 className="text-xl font-bold text-white font-poppins mb-3">
                  Nuestra Misión
                </h3>
                <p className="text-white/55 leading-relaxed font-roboto text-sm">
                  Formar artistas seguros, creativos y preparados para expresarse a través de la música.
                </p>
              </div>
            </article>

            {/* Filosofía */}
            <article className="group rounded-2xl border border-white/5 bg-white/[0.03] overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-[#ff7a00]/20 hover:shadow-2xl hover:shadow-[#ff7a00]/5">
              <div className="relative h-72 overflow-hidden">
                <OptimizedImage
                  src="/images/hero/Nuestra filosofia 2.png"
                  alt="Nuestra Filosofía"
                  fill
                  className="object-cover object-[50%_45%] transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
              <div className="p-7">
                <h3 className="text-xl font-bold text-white font-poppins mb-3">
                  Nuestra Filosofía
                </h3>
                <p className="text-white/55 leading-relaxed font-roboto text-sm">
                  Crear un entorno inspirador donde cada estudiante descubra y potencie su identidad artística.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ──────── 5. Nuestro proceso ──────── */}
      <ProcesoSection />

      {/* ──────── 6. Valores ──────── */}
      <section className="relative w-full bg-black py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[#ff7a00] text-xs font-bold uppercase tracking-[0.2em] font-poppins">
              Nuestros valores
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mt-4 font-poppins leading-tight">
              Lo que nos{" "}
              <span className="text-[#ff7a00]">impulsa</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="group rounded-2xl border border-white/5 bg-white/[0.03] p-8 text-center transition-all duration-500 hover:border-[#ff7a00]/20 hover:bg-white/[0.06] hover:-translate-y-1"
              >
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-[#ff7a00]/10 text-[#ff7a00] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#ff7a00]/20">
                  {value.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2 font-poppins">
                  {value.title}
                </h3>
                <p className="text-white/55 leading-relaxed font-roboto text-sm whitespace-pre-line">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────── 7. Team 4U ──────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <TeamSection />

      {/* ──────── 8. CTA final ──────── */}
      <section className="relative w-full bg-zinc-950 py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-[#ff7a00] blur-[150px]" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white font-poppins leading-tight mb-4">
            Convierte tu pasión musical<br className="hidden md:block" />{" "}
            en{" "}
            <span className="text-[#ff7a00]">realidad</span>
          </h2>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/planes/jovenes-adultos"
              className="inline-flex items-center gap-2.5 bg-[#ff7a00] text-white font-semibold px-7 py-3.5 rounded-full text-sm transition-all duration-300 hover:bg-[#e66e00] hover:-translate-y-0.5 shadow-xl shadow-[#ff7a00]/25 hover:shadow-2xl hover:shadow-[#ff7a00]/40 font-poppins"
            >
              Planes Jóvenes y Adultos
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </Link>
            <Link
              href="/planes-kids-teens"
              className="inline-flex items-center gap-2.5 border border-white/20 text-white font-semibold px-7 py-3.5 rounded-full text-sm transition-all duration-300 hover:bg-white/10 hover:-translate-y-0.5 hover:border-[#ff7a00]/40 shadow-lg font-poppins"
            >
              Planes Kids &amp; Teens
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

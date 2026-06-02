import type { Metadata } from "next";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import OptimizedImage from "@/components/ui/OptimizedImage";
import ProcesoSection from "./_components/ProcesoSection";

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
    description: "Amamos la música y la enseñanza.",
    icon: (
      <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    title: "Disciplina",
    description: "El crecimiento artístico requiere constancia.",
    icon: (
      <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    title: "Creatividad",
    description: "Cada estudiante desarrolla su propia identidad.",
    icon: (
      <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    title: "Comunidad",
    description: "Creamos espacios donde la música conecta personas.",
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

export default function NosotrosPage() {
  return (
    <PageLayout>
      {/* ──────── 1. Hero institucional ──────── */}
      <section className="relative w-full min-h-[580px] sm:min-h-[620px] lg:min-h-[650px] bg-black overflow-hidden flex items-stretch">

        {/* Imagen de fondo — posición ajustada por breakpoint */}
        <div className="absolute inset-0">
          <OptimizedImage
            src="/images/hero/Banner.png"
            alt="4U Studio Academy"
            fill
            priority
            className="object-cover object-[55%_35%] sm:object-[60%_35%] lg:object-[center_35%] [transform:scaleX(-1)]"
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
              className="text-base md:text-lg text-white/80 max-w-[500px] mb-8 leading-relaxed font-roboto"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.45)' }}
            >
              En 4U Studio Academy transformamos la pasión por la música en experiencias reales de aprendizaje, creación y crecimiento artístico.
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

      {/* ──────── 2. Studio 4U Academy ──────── */}
      <section className="relative w-full bg-black py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#ff7a00] blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="h-px w-8 bg-[#ff7a00]" />
                <span className="text-[#ff7a00] text-xs font-bold uppercase tracking-[0.2em] font-poppins">
                  Quiénes somos
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white font-poppins leading-tight mb-6">
                STUDIO 4U<br />
                <span className="text-[#ff7a00]">ACADEMY</span>
              </h2>
              <p className="text-white/65 leading-relaxed font-roboto mb-5">
                Somos una academia y estudio musical creado para personas que aman la música y desean desarrollar su talento de forma profesional.
              </p>
              <p className="text-white/65 leading-relaxed font-roboto">
                Acompañamos a niños, adolescentes y adultos en su proceso artístico mediante clases personalizadas, producción musical y experiencias creativas reales.
              </p>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-full max-w-[400px] aspect-square rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center p-10 shadow-2xl">
                <OptimizedImage
                  src="/images/icons/Recurso 1.png"
                  alt="4U Studio Academy"
                  width={320}
                  height={120}
                  className="w-full h-auto object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────── 3. Frase institucional ──────── */}
      <section className="relative w-full min-h-[380px] lg:min-h-[420px] bg-black overflow-hidden flex items-center">
        <div className="absolute inset-0">
          <OptimizedImage
            src="/images/hero/Banner.png"
            alt=""
            fill
            className="object-cover object-[50%_30%]"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/60 to-black/75" />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 lg:px-8 py-16 text-center">
          <span className="block text-5xl md:text-6xl lg:text-7xl text-[#ff7a00]/20 mb-6 font-poppins leading-none">
            &ldquo;
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white font-poppins leading-tight mb-4">
            En STUDIO 4U Academy no enseñamos<br />
            música como una materia.
          </h2>
          <p className="text-lg md:text-xl text-[#ff7a00] font-bold font-poppins">
            La enseñamos como un sueño que se construye.
          </p>
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
              <div className="relative h-[200px] overflow-hidden">
                <OptimizedImage
                  src="/images/courses/planes-tipos/Plan 1.png"
                  alt="Nuestra Historia"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
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
              <div className="relative h-[200px] overflow-hidden">
                <OptimizedImage
                  src="/images/courses/planes-tipos/Plan 2.png"
                  alt="Nuestra Misión"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
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
              <div className="relative h-[200px] overflow-hidden">
                <OptimizedImage
                  src="/images/courses/planes-tipos/Plan 3.png"
                  alt="Nuestra Filosofía"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
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
                <p className="text-white/55 leading-relaxed font-roboto text-sm">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────── 7. CTA final ──────── */}
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

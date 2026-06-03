import type { Metadata } from "next";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import OptimizedImage from "@/components/ui/OptimizedImage";
import KidsPlansSection from "./_components/KidsPlansSection";

export const metadata: Metadata = {
  title: "Planes Kids & Teens",
  description: "Planes de música para niños y adolescentes: descubre la música, graba tu canción.",
};

export default function PlanesKidsTeensPage() {
  return (
    <PageLayout>
      {/* Hero */}
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
              Nuestros Planes<br />
              <span className="text-[#ff6b00]">Kids & Teens</span>
            </h1>
            <p className="mt-5 max-w-3xl text-xl leading-relaxed text-white font-roboto">
              Planes diseñados para niños y adolescentes que quieren aprender, crear y vivir<br />
              la música en un ambiente divertido, seguro e inspirador.
            </p>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="relative bg-white px-6 py-9 text-gray-950 lg:px-8">
        <KidsPlansSection />

        <p className="plans-frame mt-4 text-xs text-gray-400 font-roboto">
          *Aplica para estudiantes activos al momento de cada presentación.
        </p>

        <div className="plans-frame mt-8 grid items-center gap-7 rounded-2xl bg-white p-7 shadow-xl shadow-gray-950/10 ring-1 ring-gray-200 lg:grid-cols-[1.25fr_1.2fr_1.35fr_auto]">
          <FooterInfo
            title="¿No sabes qué plan elegir?"
            text="Te ayudamos a encontrar el plan ideal para tu hijo."
            icon={
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
            }
          />
          <FooterInfo
            title="Agenda una clase"
            text="Conoce las instalaciones y vive la experiencia 4U."
            icon={
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M8 2v4M16 2v4M4 10h16M6 4h12a2 2 0 0 1 2 2v14H4V6a2 2 0 0 1 2-2Z" />
                <path d="m9 16 2 2 4-4" />
              </svg>
            }
          />
          <FooterInfo
            title="Hablemos de tu proyecto"
            text="Cuéntanos sus intereses y objetivos para guiarte en el camino."
            icon={
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
              </svg>
            }
          />
          <Link href="/mi-cuenta/login" className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#ff6b00] px-8 py-4 text-base font-bold text-white shadow-lg shadow-orange-500/25 font-poppins">
            Agenda tu Clase
            <span aria-hidden="true">▦</span>
          </Link>
        </div>
      </section>
    </PageLayout>
  );
}

function FooterInfo({ title, text, icon }: { title: string; text: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-5 lg:border-r lg:border-gray-200 lg:pr-7">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[#ff6b00]">
        {icon}
      </span>
      <span>
        <strong className="block text-lg font-extrabold leading-snug font-poppins text-balance">{title}</strong>
        <span className="block text-gray-500 leading-relaxed font-roboto">{text}</span>
      </span>
    </div>
  );
}

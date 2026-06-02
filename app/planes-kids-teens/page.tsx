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

function FooterInfo({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex items-center gap-5 md:border-r md:border-gray-200 md:pr-6">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[#ff6b00]">
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M8 2v4M16 2v4M4 10h16M6 4h12a2 2 0 0 1 2 2v14H4V6a2 2 0 0 1 2-2Z" />
        </svg>
      </span>
      <span>
        <strong className="block text-lg font-extrabold font-poppins text-balance">{title}</strong>
        <span className="text-gray-500 font-roboto text-balance">{text}</span>
      </span>
    </div>
  );
}

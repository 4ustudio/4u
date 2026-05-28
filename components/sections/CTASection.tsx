import Link from "next/link";
import Button from "@/components/ui/Button";

export default function CTASection() {
  return (
    <section className="w-full bg-white py-4">
      <div className="home-frame">
        <div className="flex flex-col items-start justify-between gap-4 rounded-md bg-stone-50 px-6 py-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#ff7a00] text-[#ff7a00]">
              <svg className="h-7 w-7" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path d="M3 17h5l3-8 5 15 4-11 3 4h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <h2 className="text-[18px] font-extrabold leading-tight text-gray-900 font-poppins">
                ¿Listo para transformar tu pasión en tu camino?
              </h2>
              <p className="text-[12px] text-gray-500 font-roboto">
                Únete a más de 1,200 estudiantes que ya están viviendo de la música.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-wrap gap-3 md:w-auto md:justify-end">
            <Button href="/contacto" size="sm" className="px-6 py-2.5">
              Agendar mi clase
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M8 2v4M16 2v4M4 10h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Button>
            <Link
              href="/planes"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-6 py-2.5 text-[13px] font-semibold text-gray-900 transition-colors hover:border-[#ff7a00]/50 hover:text-[#ff7a00] font-poppins"
            >
              Conocer más
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Agenda tu primera clase de música por WhatsApp. Contáctanos para recibir información sobre planes y horarios.",
};

const WA_LINK =
  "https://api.whatsapp.com/send/?phone=573107639163&text=Hola%20quiero%20más%20información%20sobre%204ustudioacademy.com";

export default function ContactoPage() {
  return (
    <PageLayout>
      <section className="relative w-full overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-orange-500/10 blur-3xl rounded-full" />
        <div className="absolute top-0 -right-40 w-80 h-80 bg-orange-500/5 blur-3xl rounded-full" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.08)] font-poppins">
              Contáctanos
            </h1>

            <div className="w-full bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl">
              <p className="text-white/60 text-lg leading-relaxed mb-10 font-roboto">
                ¿Tienes preguntas sobre nuestros planes o quieres agendar tu primera clase?
                Escríbenos por WhatsApp y te atenderemos de inmediato.
              </p>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 text-white font-semibold px-10 py-4 rounded-full text-lg transition-all duration-300 shadow-xl shadow-[#25D366]/20 hover:shadow-2xl hover:shadow-[#25D366]/40 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/50"
                style={{ backgroundColor: "#25D366", fontFamily: "'Poppins', sans-serif" }}
              >
                <svg className="w-6 h-6 fill-white flex-shrink-0" viewBox="0 0 448 512" aria-hidden="true" focusable="false">
                  <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6z"/>
                </svg>
                <span>Agendar por WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

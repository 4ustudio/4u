import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";
import ContactForm from "@/components/sections/ContactForm";
import WATracker from "@/components/ui/WATracker";
import { ACADEMY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Agenda tu primera clase de música. Contáctanos por formulario o WhatsApp para recibir información sobre planes y horarios.",
};

const WA_LINK = ACADEMY.waUrl;

function SocialIcon({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <a
      href="#"
      target="_blank"
      rel="noopener noreferrer"
      className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-[#ff7a00] hover:border-[#ff7a00]/30 hover:bg-white/5 transition-all duration-300"
      aria-label={label}
    >
      {children}
    </a>
  );
}

export default function ContactoPage() {
  return (
    <PageLayout>
      <section
        className="relative w-full overflow-hidden"
        style={{
          backgroundImage: "url('/images/hero/Banner-contactanos.jpg.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/75" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-500/10 blur-3xl rounded-full" />
        <div className="absolute top-0 -right-40 w-80 h-80 bg-orange-500/5 blur-3xl rounded-full" />
        <div className="absolute bottom-0 -left-40 w-80 h-80 bg-orange-500/5 blur-3xl rounded-full" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.08)] font-poppins">
                Contáctanos
              </h1>
              <p className="text-white/60 text-lg leading-relaxed max-w-xl mx-auto font-roboto">
                ¿Tienes preguntas sobre nuestros planes o quieres agendar tu primera clase? Escríbenos y te atenderemos a la brevedad.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
              <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                <h2 className="text-white font-semibold text-lg mb-6 font-poppins">
                  Envíanos un mensaje
                </h2>
                <ContactForm />
              </div>

              <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#25D366]/15 flex items-center justify-center mb-5">
                  <svg className="w-8 h-8 fill-[#25D366]" viewBox="0 0 448 512" aria-hidden="true" focusable="false">
                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6z" />
                  </svg>
                </div>
                <h2 className="text-white font-semibold text-lg mb-2 font-poppins">
                  Respuesta inmediata
                </h2>
                <p className="text-white/60 text-sm leading-relaxed mb-6 font-roboto">
                  Escríbenos por WhatsApp y te atenderemos de inmediato. Es la forma más rápida.
                </p>
                <WATracker
                  href={WA_LINK}
                  source="contacto"
                  className="inline-flex items-center gap-2.5 text-white font-semibold px-8 py-3.5 rounded-full text-sm transition-all duration-300 shadow-xl shadow-[#25D366]/20 hover:shadow-2xl hover:shadow-[#25D366]/40 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/50"
                >
                  <svg className="w-5 h-5 fill-white flex-shrink-0" viewBox="0 0 448 512" aria-hidden="true" focusable="false">
                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6z" />
                  </svg>
                  <span>Agendar por WhatsApp</span>
                </WATracker>
              </div>
            </div>

            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-white font-semibold text-base mb-5 font-poppins">
                    Información de contacto
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-white/60" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
                          <path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4 0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-white/40 font-roboto">Correo electrónico</p>
                        <a href={`mailto:${ACADEMY.email}`} className="text-sm text-white/80 hover:text-[#ff7a00] transition-colors font-roboto">
                          {ACADEMY.email}
                        </a>
                      </div>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-white/60" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
                          <path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-white/40 font-roboto">Dirección</p>
                        <p className="text-sm text-white/80 font-roboto">{ACADEMY.address}</p>
                      </div>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 fill-[#25D366]" viewBox="0 0 448 512" aria-hidden="true">
                          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-white/40 font-roboto">WhatsApp</p>
                        <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="text-sm text-white/80 hover:text-[#25D366] transition-colors font-roboto">
                          {ACADEMY.phoneDisplay}
                        </a>
                      </div>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-semibold text-base mb-5 font-poppins">
                    Síguenos
                  </h3>
                  <p className="text-sm text-white/50 mb-5 font-roboto">
                    Conoce más sobre nuestra academia en redes sociales.
                  </p>
                  <div className="flex items-center gap-3">
                    <SocialIcon label="Instagram">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 448 512" aria-hidden="true">
                        <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8z" />
                      </svg>
                    </SocialIcon>
                    <SocialIcon label="YouTube">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 576 512" aria-hidden="true">
                        <path d="M549.7 124.1c-6.3-23.7-24.8-42.3-48.3-48.6C458.8 64 288 64 288 64S117.2 64 74.6 75.5c-23.5 6.3-42 24.9-48.3 48.6-11.4 42.9-11.4 132.3-11.4 132.3s0 89.4 11.4 132.3c6.3 23.7 24.8 41.5 48.3 47.8C117.2 448 288 448 288 448s170.8 0 213.4-11.5c23.5-6.3 42-24.2 48.3-47.8 11.4-42.9 11.4-132.3 11.4-132.3s0-89.4-11.4-132.3zm-317.5 213.5V175.2l142.7 81.2-142.7 81.2z" />
                      </svg>
                    </SocialIcon>
                    <SocialIcon label="TikTok">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 448 512" aria-hidden="true">
                        <path d="M448 209.9a210.1 210.1 0 0 1-122.8-39.3V349.4A142.5 142.5 0 1 1 197.9 215l.1 66.2a76.1 76.1 0 1 0 54.2 72.4V0h65.3a114.4 114.4 0 0 0 2.6 26.5A129.3 129.3 0 0 0 369.2 90.8c17.7 11.2 38.6 17.9 61 19.6v99.5z" />
                      </svg>
                    </SocialIcon>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

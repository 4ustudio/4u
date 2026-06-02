import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";
import ContactForm from "@/components/sections/ContactForm";
import WATracker from "@/components/ui/WATracker";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { ACADEMY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Agenda tu primera clase de música. Contáctanos por formulario o WhatsApp para recibir información sobre planes y horarios.",
};

const WA_LINK   = ACADEMY.waUrl;
const MAPS_LINK = ACADEMY.mapsUrl;

function SocialIcon({ label, href, children }: { label: string; href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
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

              <div className="relative bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center justify-end text-center min-h-[360px]">
                {/* Imagen de fondo */}
                <div className="absolute inset-0">
                  <OptimizedImage
                    src="/images/hero/Servicio al cliente.png"
                    alt="Servicio al cliente 4U Studio Academy"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
                </div>
                {/* Contenido sobre la imagen */}
                <div className="relative z-10 p-8 w-full">
                  <h2 className="text-white font-semibold text-lg mb-2 font-poppins">
                    Respuesta inmediata
                  </h2>
                  <p className="text-white/70 text-sm leading-relaxed mb-6 font-roboto">
                    Escríbenos por WhatsApp y te atenderemos de inmediato. Es la forma más rápida.
                  </p>
                  <WATracker
                    href={WA_LINK}
                    source="contacto"
                    className="inline-flex items-center justify-center gap-2.5 w-full text-white font-semibold px-8 py-3.5 rounded-full text-sm transition-all duration-300 shadow-xl shadow-[#25D366]/30 hover:shadow-2xl hover:shadow-[#25D366]/50 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/50"
                    style={{ backgroundColor: '#25D366' }}
                  >
                    <svg className="w-5 h-5 fill-white flex-shrink-0" viewBox="0 0 448 512" aria-hidden="true" focusable="false">
                      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6z" />
                    </svg>
                    <span>Agendar por WhatsApp</span>
                  </WATracker>
                </div>
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
                        <a
                          href={MAPS_LINK}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-white/80 hover:text-[#ff7a00] transition-colors font-roboto"
                        >
                          {ACADEMY.address}
                        </a>
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
                    <SocialIcon label="Instagram" href="https://www.instagram.com/4ustudioacademy/">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                        <circle cx="12" cy="12" r="4"/>
                        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
                      </svg>
                    </SocialIcon>
                    <SocialIcon label="Facebook" href="https://www.facebook.com/4Ustudioacademy">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 512 512" aria-hidden="true">
                        <path d="M512 256C512 114.6 397.4 0 256 0S0 114.6 0 256C0 376 82.7 476.8 194.2 504.5V334.2H141.4V256h52.8V222.3c0-87.1 39.4-127.5 125-127.5c16.2 0 44.2 3.2 55.7 6.4V172c-6-.6-16.5-1-29.6-1c-42 0-58.2 15.9-58.2 57.2V256h83.6l-14.4 78.2H287V510.1C413.8 494.8 512 386.9 512 256h0z"/>
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

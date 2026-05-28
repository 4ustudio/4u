import Link from "next/link";

const WA_LINK =
  "https://api.whatsapp.com/send/?phone=573107639163&text=Hola%20quiero%20más%20información%20sobre%204ustudioacademy.com";

export default function Footer() {
  return (
    <>
      <a
        href={WA_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float"
        aria-label="WhatsApp"
      >
        <div className="w-14 h-14 rounded-full bg-[#25D366] shadow-lg flex items-center justify-center hover:scale-110 hover:shadow-xl hover:shadow-[#25D366]/30 transition-all duration-300">
          <svg className="w-7 h-7 fill-white" viewBox="0 0 448 512" aria-hidden="true" focusable="false">
            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6z"/>
          </svg>
        </div>
      </a>

      <footer className="w-full bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <span className="text-xl font-bold text-white font-poppins">
                4U <span className="text-[#ff7a00]">Studio</span>
              </span>
              <p className="mt-3 text-sm leading-relaxed text-white/60 font-roboto">
                Cumple tus sueños musicales. Academia de música profesional para todas las edades.
              </p>
            </div>

            <div>
              <h4 className="text-white/80 font-semibold mb-4 text-sm uppercase tracking-[0.15em] font-poppins">
                Enlaces
              </h4>
              <ul className="space-y-3">
                {[
                  { href: "/", label: "Inicio" },
                  { href: "/nosotros", label: "Nosotros" },
                  { href: "/planes", label: "Planes" },
                  { href: "/contacto", label: "Contacto" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-[#ff7a00] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a00]/50 rounded"
                      style={{ fontFamily: "'Roboto', sans-serif" }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white/80 font-semibold mb-4 text-sm uppercase tracking-[0.15em] font-poppins">
                Servicios
              </h4>
              <ul className="space-y-3">
                {[
                  "Clases de música",
                  "Producción musical",
                  "Grabación profesional",
                ].map((s) => (
                  <li key={s} className="text-sm text-white/60 font-roboto">
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white/80 font-semibold mb-4 text-sm uppercase tracking-[0.15em] font-poppins">
                Contacto
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href={WA_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/60 hover:text-[#ff7a00] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a00]/50 rounded"
                    style={{ fontFamily: "'Roboto', sans-serif" }}
                  >
                    WhatsApp: +57 310 763 9163
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40 font-roboto">
              © {new Date().getFullYear()} 4uStudio Academy. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

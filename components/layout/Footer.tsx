import Link from "next/link";

const WA_LINK =
  "https://api.whatsapp.com/send/?phone=573107639163&text=Hola%20quiero%20más%20información%20sobre%204ustudioacademy.com";

const socialLinks = [
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 448 512" aria-hidden="true" focusable="false">
        <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8z"/>
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "#",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 576 512" aria-hidden="true" focusable="false">
        <path d="M549.7 124.1c-6.3-23.7-24.8-42.3-48.3-48.6C458.8 64 288 64 288 64S117.2 64 74.6 75.5c-23.5 6.3-42 24.9-48.3 48.6-11.4 42.9-11.4 132.3-11.4 132.3s0 89.4 11.4 132.3c6.3 23.7 24.8 41.5 48.3 47.8C117.2 448 288 448 288 448s170.8 0 213.4-11.5c23.5-6.3 42-24.2 48.3-47.8 11.4-42.9 11.4-132.3 11.4-132.3s0-89.4-11.4-132.3zm-317.5 213.5V175.2l142.7 81.2-142.7 81.2z"/>
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "#",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 448 512" aria-hidden="true" focusable="false">
        <path d="M448 209.9a210.1 210.1 0 0 1-122.8-39.3V349.4A142.5 142.5 0 1 1 197.9 215l.1 66.2a76.1 76.1 0 1 0 54.2 72.4V0h65.3a114.4 114.4 0 0 0 2.6 26.5A129.3 129.3 0 0 0 369.2 90.8c17.7 11.2 38.6 17.9 61 19.6v99.5z"/>
      </svg>
    ),
  },
];

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

      <footer className="w-full bg-stone-950 border-t border-stone-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div className="col-span-2 md:col-span-1">
              <span className="text-xl font-bold text-white font-poppins">
                4U <span className="text-[#ff7a00]">Studio</span>
              </span>
              <p className="mt-3 text-sm leading-relaxed text-stone-400 font-roboto">
                Cumple tus sueños musicales. Academia de música profesional para todas las edades.
              </p>
              <p className="mt-3 text-xs text-stone-500 italic font-roboto">
                Tu música, tu estudio, tu momento.
              </p>
              <div className="flex items-center gap-3 mt-6">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-stone-800/50 border border-stone-700/50 flex items-center justify-center text-stone-400 hover:text-[#ff7a00] hover:border-[#ff7a00]/30 hover:bg-stone-800 transition-all duration-300"
                    aria-label={s.label}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-stone-300 font-semibold mb-5 text-sm uppercase tracking-[0.15em] font-poppins">
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
                      className="text-sm text-stone-400 hover:text-[#ff7a00] transition-colors duration-300 tracking-wide font-roboto"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-stone-300 font-semibold mb-5 text-sm uppercase tracking-[0.15em] font-poppins">
                Servicios
              </h4>
              <ul className="space-y-3">
                {[
                  "Clases de música",
                  "Producción musical",
                  "Grabación profesional",
                ].map((s) => (
                  <li key={s} className="text-sm text-stone-400 font-roboto tracking-wide">
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-stone-300 font-semibold mb-5 text-sm uppercase tracking-[0.15em] font-poppins">
                Contacto
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href={WA_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-stone-400 hover:text-[#ff7a00] transition-colors duration-300 tracking-wide font-roboto"
                  >
                    WhatsApp: +57 310 763 9163
                  </a>
                </li>
                <li className="text-sm text-stone-500 font-roboto tracking-wide">
                  Medellín, Colombia
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-900">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-sm text-stone-500 font-roboto">
              © {new Date().getFullYear()} 4uStudio Academy. Todos los derechos reservados.
            </p>
            <p className="text-xs text-stone-600 font-roboto tracking-wide">
              Hecho con 🎵 en Colombia
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

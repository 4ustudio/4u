import Link from "next/link";
import Image from "next/image";
import WATracker from "@/components/ui/WATracker";
import { ACADEMY } from "@/lib/constants";

const WA_LINK = ACADEMY.waUrl;

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/4ustudioacademy/",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/4Ustudioacademy",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 512 512" aria-hidden="true" focusable="false">
        <path d="M512 256C512 114.6 397.4 0 256 0S0 114.6 0 256C0 376 82.7 476.8 194.2 504.5V334.2H141.4V256h52.8V222.3c0-87.1 39.4-127.5 125-127.5c16.2 0 44.2 3.2 55.7 6.4V172c-6-.6-16.5-1-29.6-1c-42 0-58.2 15.9-58.2 57.2V256h83.6l-14.4 78.2H287V510.1C413.8 494.8 512 386.9 512 256h0z"/>
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <>
      <WATracker
        href={WA_LINK}
        source="float"
        className="whatsapp-float"
      >
        <div className="w-14 h-14 rounded-full bg-[#25D366] shadow-lg flex items-center justify-center hover:scale-110 hover:shadow-xl hover:shadow-[#25D366]/30 transition-all duration-300">
          <svg className="w-7 h-7 fill-white" viewBox="0 0 448 512" aria-hidden="true" focusable="false">
            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6z"/>
          </svg>
        </div>
      </WATracker>

      <footer className="w-full bg-stone-950 border-t border-stone-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div className="col-span-2 md:col-span-1">
              <Image
                src="/images/icons/Recurso 1.png"
                alt="4U Studio"
                width={140}
                height={46}
                className="h-10 w-auto"
              />
              <p className="mt-3 text-sm leading-relaxed text-stone-400 font-roboto">
                Cumple tus sueños musicales. Academia de música profesional para todas las edades.
              </p>
              <p className="mt-3 text-xs text-stone-500 italic font-roboto tracking-wide">
                Tu música. Tu estudio. Tu momento.
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
                  { label: "Clases de música",    href: "/cursos" },
                  { label: "Producción musical",   href: "/produccion" },
                  { label: "Grabación profesional", href: "/contacto" },
                ].map((s) => (
                  <li key={s.label}>
                    <Link
                      href={s.href}
                      className="text-sm text-stone-400 hover:text-[#ff7a00] transition-colors duration-300 tracking-wide font-roboto"
                    >
                      {s.label}
                    </Link>
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
                    WhatsApp: {ACADEMY.phoneDisplay}
                  </a>
                </li>
                <li className="text-sm text-stone-500 font-roboto tracking-wide">
                  {ACADEMY.address}
                </li>
                <li>
                  <a
                    href={`mailto:${ACADEMY.email}`}
                    className="text-sm text-stone-400 hover:text-[#ff7a00] transition-colors duration-300 tracking-wide font-roboto"
                  >
                    {ACADEMY.email}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-800">
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

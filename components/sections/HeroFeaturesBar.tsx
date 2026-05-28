const benefits = [
  { title: "Clases para todos", label: "Niños, adolescentes y adultos", icon: "users" },
  { title: "Aprende a tu ritmo", label: "Modalidad presencial y online", icon: "chart" },
  { title: "Profesores expertos", label: "Músicos profesionales", icon: "guitar" },
  { title: "Certificación", label: "Al finalizar tu curso", icon: "award" },
];

export default function HeroFeaturesBar() {
  return (
    <section className="features-home relative z-20 bg-white pb-3">
      <div className="home-frame">
        <div className="rounded-md border border-white/10 bg-black/90 px-8 py-5 shadow-2xl">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-white/10">
            {benefits.map((b) => (
              <div key={b.title} className="flex items-center gap-4 lg:px-6 first:pl-0">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-[#ff7a00]/10 text-[#ff7a00]">
                  <FeatureIcon name={b.icon} />
                </div>
                <div>
                  <p className="text-base font-bold text-white font-poppins">{b.title}</p>
                  <p className="text-sm text-white/65 font-roboto">{b.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureIcon({ name }: { name: string }) {
  const common = "h-6 w-6";

  if (name === "chart") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M4 19V9m6 10V5m6 14v-7m4 7H2" />
      </svg>
    );
  }

  if (name === "guitar") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m15 5 4 4M14 6l4 4M9 14l-4 4m8-8L6 17a2 2 0 1 0 3 3l7-7" />
        <path d="M16 4h4v4" />
      </svg>
    );
  }

  if (name === "award") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="m8.5 12.5-1 7 4.5-2 4.5 2-1-7" />
      </svg>
    );
  }

  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM22 19c0-1.7-1-3.2-2.5-3.8M17 5.3a3 3 0 0 1 0 5.4M2 19c0-1.7 1-3.2 2.5-3.8M7 5.3a3 3 0 0 0 0 5.4" />
    </svg>
  );
}

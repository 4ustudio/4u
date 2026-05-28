const highlights = [
  {
    title: "Metodología práctica",
    description: "Aprende haciendo música desde el primer día con un enfoque práctico y motivador.",
    icon: (
      <path d="M12 3 3 7.5l9 4.5 9-4.5L12 3Zm-6 7v4.5c0 2 2.7 3.5 6 3.5s6-1.5 6-3.5V10" />
    ),
  },
  {
    title: "Clases presenciales y online",
    description: "Elige la modalidad que mejor se adapte a tu estilo de vida. Tú decides dónde y cuándo aprender.",
    icon: (
      <path d="M4 6h16v10H4zM8 20h8m-4-4v4" />
    ),
  },
  {
    title: "Acompañamiento personalizado",
    description: "Te guiamos en cada paso de tu proceso para que sigas creciendo con seguridad y confianza.",
    icon: (
      <path d="M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM22 19c0-1.7-1-3.2-2.5-3.8M17 5.3a3 3 0 0 1 0 5.4" />
    ),
  },
];

export default function MethodologySection() {
  return (
    <section className="relative w-full bg-white py-3">
      <div className="home-frame">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {highlights.map((item) => (
            <article key={item.title} className="flex gap-4 rounded-md bg-stone-50 px-5 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-[#ff7a00] shadow-sm">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {item.icon}
                </svg>
              </div>
              <div>
                <h3 className="mb-1 text-[13px] font-bold text-gray-900 font-poppins">{item.title}</h3>
                <p className="text-[11px] leading-relaxed text-gray-500 font-roboto">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

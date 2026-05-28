const benefits = [
  { label: "Clases personalizadas" },
  { label: "Grabación profesional" },
  { label: "Sin contratos largos" },
  { label: "Todos los niveles" },
];

export default function HeroFeaturesBar() {
  return (
    <section className="relative z-20 -mt-20 pb-8">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl px-8 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {benefits.map((b, i) => (
              <div key={b.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ff7a00]/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#ff7a00] text-xs font-bold font-poppins">{i + 1}</span>
                </div>
                <span className="text-sm text-white/80 font-medium font-poppins">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

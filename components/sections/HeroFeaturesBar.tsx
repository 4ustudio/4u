const benefits = [
  { label: "Clases personalizadas" },
  { label: "Grabación profesional" },
  { label: "Sin contratos largos" },
  { label: "Todos los niveles" },
];

export default function HeroFeaturesBar() {
  return (
    <section className="relative z-20 -mt-16 pb-10 md:pb-12">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg border border-stone-100 px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {benefits.map((b, i) => (
              <div key={b.label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#ff7a00]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#ff7a00] text-sm font-bold font-poppins">{i + 1}</span>
                </div>
                <span className="text-sm text-gray-700 font-medium font-poppins">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const brands = [
  { name: "Yamaha", color: "#4a90d9" },
  { name: "Fender", color: "#c0392b" },
  { name: "Roland", color: "#e67e22" },
  { name: "Shure", color: "#2c3e50" },
  { name: "AKG", color: "#1a1a2e" },
  { name: "Berklee", color: "#8e44ad" },
];

export default function TrustBarSection() {
  return (
    <section className="w-full py-12 md:py-16 bg-stone-50 border-t border-stone-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <p className="text-center text-[11px] font-medium tracking-[0.25em] uppercase text-stone-300 mb-10 font-poppins">
          Trabajamos con las mejores marcas
        </p>
        <div className="flex flex-wrap items-center justify-center gap-10 md:gap-14 lg:gap-20">
          {brands.map((brand) => (
            <span
              key={brand.name}
              className="text-base md:text-lg font-bold tracking-[0.15em] text-stone-300 hover:text-[#ff7a00] transition-colors duration-300 font-poppins cursor-default"
            >
              {brand.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

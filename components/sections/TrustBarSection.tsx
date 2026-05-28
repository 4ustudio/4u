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
    <section className="w-full bg-white pb-7 pt-1">
      <div className="home-frame">
        <p className="mb-3 text-center text-[11px] font-medium text-stone-500 font-roboto">
          Confían en nosotros
        </p>
        <div className="flex flex-wrap items-center justify-center gap-7 md:gap-11">
          {brands.map((brand) => (
            <span
              key={brand.name}
              className="cursor-default text-sm font-bold tracking-[0.04em] text-stone-300 transition-colors duration-300 hover:text-[#ff7a00] md:text-base font-poppins"
            >
              {brand.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

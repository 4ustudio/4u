import OptimizedImage from "@/components/ui/OptimizedImage";

export default function TestimonialStrip() {
  return (
    <section className="w-full bg-white py-3">
      <div className="home-frame">
        <div className="relative grid min-h-[230px] grid-cols-1 overflow-hidden rounded-xl bg-zinc-900 md:min-h-[250px] md:grid-cols-[70%_30%]">
          {/* Imagen del pianista — protagonista, lado derecho */}
          <div className="absolute inset-0 md:relative md:col-start-2">
            <OptimizedImage
              src="/images/hero/Banner-principal-3.jpg.jpeg"
              alt="Pianista interpretando en 4U Studio Academy"
              fill
              className="scale-[1.35] object-cover object-[58%_46%] md:scale-[1.15]"
              sizes="(max-width: 768px) 100vw, 40vw"
            />
            {/* Degradado que funde la imagen con el texto (móvil: vertical / desktop: horizontal) */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/70 to-zinc-900/30 md:bg-gradient-to-r md:from-zinc-900 md:via-zinc-900/35 md:to-transparent" />
          </div>

          {/* Iluminación cálida naranja detrás del artista (identidad de marca) */}
          <div
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{ background: "radial-gradient(ellipse 45% 75% at 78% 50%, rgba(255,122,0,0.18), transparent 65%)" }}
            aria-hidden="true"
          />

          {/* Texto — 60% izquierda, centrado verticalmente */}
          <div className="relative z-10 flex flex-col justify-center px-7 py-8 md:col-start-1 md:row-start-1 md:px-10 md:py-10">
            <span className="mb-1 font-poppins text-5xl font-black leading-none text-[#ff7a00]">&ldquo;</span>
            <p className="max-w-3xl font-poppins text-xl font-extrabold italic leading-[1.2] text-white md:text-[26px] lg:text-[30px]">
              La música no solo cambia tu sonido,<br />
              <span className="text-[#ff7a00]">cambia tu vida.</span>
              <span className="ml-2 font-poppins text-5xl font-black leading-none text-[#ff7a00]">&rdquo;</span>
            </p>
            <p className="mt-3 max-w-md font-roboto text-sm italic leading-relaxed text-white/65">
              Atrévete a comenzar tu historia musical hoy.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

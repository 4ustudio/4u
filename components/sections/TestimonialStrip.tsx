export default function TestimonialStrip() {
  return (
    <section className="w-full bg-white py-3">
      <div className="home-frame">
        <div className="relative grid min-h-[230px] grid-cols-1 overflow-hidden rounded-xl bg-zinc-900 md:min-h-[250px] md:grid-cols-[70%_30%]">
          {/* Video — cubre todo el banner */}
          <div className="absolute inset-0">
            <video
              src="/images/hero/hf_20260603_135817_bc2bc082-82e4-46f3-bc75-4747aa356fee.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover object-center"
            />
          </div>

          {/* Overlay gradiente suave de izquierda a derecha sobre todo el ancho */}
          <div
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{
              background: "linear-gradient(90deg, rgba(0,0,0,.75) 0%, rgba(0,0,0,.45) 25%, rgba(0,0,0,.15) 50%, rgba(0,0,0,0) 100%)",
            }}
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

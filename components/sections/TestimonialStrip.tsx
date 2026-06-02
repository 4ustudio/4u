import OptimizedImage from "@/components/ui/OptimizedImage";

export default function TestimonialStrip() {
  return (
    <section className="w-full bg-white py-3">
      <div className="home-frame">
        <div className="grid grid-cols-1 overflow-hidden rounded-md bg-zinc-900 md:grid-cols-[1fr_38%]">
          <div className="flex items-center gap-4 px-6 py-5">
            <span className="self-start text-4xl font-black leading-none text-[#ff7a00] font-poppins">"</span>
            <p className="max-w-xl text-[15px] font-semibold italic leading-snug text-gray-100 font-roboto">
              La música no solo cambia tu sonido, cambia tu vida. Atrévete a comenzar tu historia musical hoy.
            </p>
          </div>
          <div className="relative hidden min-h-[150px] md:block">
            <OptimizedImage
              src="/images/hero/Banner-principal-3.jpg.jpeg"
              alt="Pianista en 4U Studio Academy"
              fill
              className="object-cover object-[center_35%]"
              sizes="40vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/10 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}

import OptimizedImage from "@/components/ui/OptimizedImage";
import { testimonials } from "@/data/testimonials";

export default function TestimonialStrip() {
  const featured = testimonials[0];

  return (
    <section className="w-full bg-white py-3">
      <div className="home-frame">
        <div className="grid grid-cols-1 overflow-hidden rounded-md bg-stone-50 md:grid-cols-[1fr_300px]">
          <div className="flex items-center gap-4 px-6 py-5">
            <span className="self-start text-4xl font-black leading-none text-[#ff7a00] font-poppins">“</span>
            <div>
              <p className="max-w-xl text-[15px] font-semibold italic leading-snug text-gray-800 font-roboto">
                La música no solo cambia tu sonido, cambia tu vida. Atrévete a comenzar tu historia musical hoy.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[#ff7a00]/15" />
                <div>
                  <p className="text-[12px] font-bold text-gray-900 font-poppins">María Fernanda L.</p>
                  <p className="text-[10px] text-gray-500 font-roboto">{featured.course}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative hidden min-h-[150px] md:block">
            <OptimizedImage
              src="/images/hero/banner-principal.jpg"
              alt="Estudiante de canto en 4U Studio"
              fill
              className="object-cover object-[82%_48%]"
              sizes="300px"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-50 via-stone-50/20 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}

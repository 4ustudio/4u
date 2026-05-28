import Container from "@/components/ui/Container";
import SectionTitle from "@/components/ui/SectionTitle";
import { methodology } from "@/data/methodology";
import { benefits } from "@/data/benefits";

export default function MethodologySection() {
  return (
    <section className="w-full py-24 md:py-32 bg-white relative">
      <Container>
        <SectionTitle
          label="Cómo funciona"
          title="Tu camino"
          accent="musical"
          description="Un método probado que te lleva desde tu primera clase hasta tu canción publicada."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mt-14">
          <div className="space-y-6">
            {methodology.map((step) => (
              <div
                key={step.number}
                className="flex gap-5 p-6 rounded-xl bg-white border border-stone-100 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#ff7a00]/10 border border-[#ff7a00]/20 flex items-center justify-center">
                  <span className="text-[#ff7a00] font-bold text-sm font-poppins">
                    {String(step.number).padStart(2, "0")}
                  </span>
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold text-lg mb-2 font-poppins">
                    {step.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-[1.7] font-roboto">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="flex flex-col p-5 rounded-xl bg-white border border-stone-100 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="mb-3 text-[#ff7a00] opacity-70">
                  {benefit.icon}
                </div>
                <h4 className="text-gray-900 font-semibold text-sm mb-1.5 font-poppins">
                  {benefit.title}
                </h4>
                <p className="text-gray-400 text-xs leading-relaxed font-roboto">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

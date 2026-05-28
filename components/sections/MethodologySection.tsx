import Container from "@/components/ui/Container";
import SectionTitle from "@/components/ui/SectionTitle";
import { methodology } from "@/data/methodology";
import { benefits } from "@/data/benefits";

export default function MethodologySection() {
  return (
    <section className="w-full py-20 md:py-28 bg-gray-50 relative overflow-hidden">
      <div className="absolute top-1/3 -left-40 w-80 h-80 bg-[#ff7a00]/5 blur-3xl rounded-full" />
      <div className="absolute bottom-1/3 -right-40 w-80 h-80 bg-[#ff7a00]/5 blur-3xl rounded-full" />

      <Container>
        <SectionTitle
          label="Cómo funciona"
          title="Tu camino"
          accent="musical"
          description="Un método probado que te lleva desde tu primera clase hasta tu canción publicada."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mt-12">
          <div className="space-y-6">
            {methodology.map((step) => (
              <div
                key={step.number}
                className="group flex gap-5 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-[#ff7a00]/10 transition-all duration-500"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#ff7a00]/10 border border-[#ff7a00]/20 flex items-center justify-center">
                  <span className="text-[#ff7a00] font-bold text-sm font-poppins">
                    {String(step.number).padStart(2, "0")}
                  </span>
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold text-lg mb-1.5 font-poppins">
                    {step.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed font-roboto">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="group flex flex-col p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-[#ff7a00]/10 hover:-translate-y-0.5 transition-all duration-500"
              >
                <div className="mb-3 text-[#ff7a00] opacity-70 group-hover:opacity-100 transition-opacity duration-300">
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

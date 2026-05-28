import Header from "@/components/layout/Header";
import HeroSection from "@/components/sections/HeroSection";
import TrustBarSection from "@/components/sections/TrustBarSection";
import CoursesSection from "@/components/sections/CoursesSection";
import MethodologySection from "@/components/sections/MethodologySection";
import TestimonialStrip from "@/components/sections/TestimonialStrip";
import CTASection from "@/components/sections/CTASection";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <HeroSection />
      <div className="h-24 bg-gradient-to-b from-black via-stone-900/50 to-stone-50 -mt-12" />
      <TrustBarSection />
      <div className="h-16 bg-gradient-to-b from-stone-50 via-stone-100/30 to-white" />
      <CoursesSection />
      <div className="h-12 bg-gradient-to-b from-white to-amber-50/20" />
      <MethodologySection />
      <div className="h-12 bg-gradient-to-b from-amber-50/20 to-white" />
      <TestimonialStrip />
      <div className="h-12 bg-gradient-to-b from-white to-gray-950" />
      <CTASection />
      <Footer />
    </>
  );
}

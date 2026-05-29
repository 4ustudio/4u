import Header from "@/components/layout/Header";
import HeroSection from "@/components/sections/HeroSection";
import HeroFeaturesBar from "@/components/sections/HeroFeaturesBar";
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
      <HeroFeaturesBar />
      <CoursesSection />
      <MethodologySection />
      <TestimonialStrip />
      <CTASection />
      <Footer />
    </>
  );
}

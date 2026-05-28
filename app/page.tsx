import Header from "@/components/layout/Header";
import HeroSection from "@/components/sections/HeroSection";
import CoursesSection from "@/components/sections/CoursesSection";
import CTASection from "@/components/sections/CTASection";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <HeroSection />
      <CoursesSection />
      <CTASection />
      <Footer />
    </>
  );
}

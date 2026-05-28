import Link from "next/link";
import CourseCard from "@/components/cards/CourseCard";
import Container from "@/components/ui/Container";
import SectionTitle from "@/components/ui/SectionTitle";
import { courses } from "@/data/courses";

export default function CoursesSection() {
  return (
    <section id="cursos" className="w-full py-20 md:py-28 bg-white relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-[#ff7a00]/20 rounded-b-full" />

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          <div className="lg:col-span-4">
            <SectionTitle
              label="Explora tu talento"
              title="Encuentra tu"
              accent="curso ideal"
              description="Descubre nuestra variedad de cursos diseñados para cada pasión musical. Todos los niveles, todas las edades."
            />
          </div>

          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard key={course.title} course={course} />
              ))}
            </div>

            <div className="text-center mt-10 group">
              <Link
                href="/planes"
                className="inline-flex items-center gap-2 text-[#ff7a00] font-semibold hover:text-stone-900 transition-colors duration-300 font-poppins"
              >
                Ver todos los cursos
                <svg className="w-5 h-5 fill-current transition-transform group-hover:translate-x-1" viewBox="0 0 320 512">
                  <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

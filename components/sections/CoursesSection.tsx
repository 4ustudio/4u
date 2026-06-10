import Link from "next/link";
import CourseCard from "@/components/cards/CourseCard";
import { courses } from "@/data/courses";

export default function CoursesSection() {
  return (
    <section id="lecciones" className="relative w-full bg-white py-16 md:py-20">
      <div className="home-frame">
        <div className="home-course-grid grid gap-8 lg:items-center">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#ff7a00] font-poppins">
              Explora tu talento
            </p>
            <h2 className="mb-4 text-[38px] font-extrabold leading-[1] tracking-normal text-gray-900 font-poppins">
              Encuentra <span className="text-[#ff7a00]">tu</span> <span className="text-[#ff7a00]">lección ideal</span>
            </h2>
            <p className="text-sm leading-relaxed text-gray-500 font-roboto">
              Descubre nuestra variedad<br />
              de lecciones diseñadas para cada<br />
              pasión musical.
            </p>
            <Link
              href="/lecciones"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#ff7a00]/35 px-4 py-2 text-[12px] font-semibold text-[#ff7a00] transition-colors hover:bg-[#ff7a00] hover:text-white font-poppins"
            >
              Ver todas las lecciones
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Link>
          </div>

          <div className="min-w-0">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {courses.filter((c) => c.title !== 'Producción Musical').map((course) => (
                <CourseCard key={course.title} course={course} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

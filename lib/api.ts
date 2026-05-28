import type { Course, Instructor, Testimonial, FAQ, Benefit, Step } from "@/types";

export async function getCourses(): Promise<Course[]> {
  const { courses } = await import("@/data/courses");
  return courses;
}

export async function getInstructors(): Promise<Instructor[]> {
  const { instructors } = await import("@/data/instructors");
  return instructors;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const { testimonials } = await import("@/data/testimonials");
  return testimonials;
}

export async function getFAQs(): Promise<FAQ[]> {
  const { faqs } = await import("@/data/faqs");
  return faqs;
}

export async function getBenefits(): Promise<Benefit[]> {
  const { benefits } = await import("@/data/benefits");
  return benefits;
}

export async function getMethodology(): Promise<Step[]> {
  const { methodology } = await import("@/data/methodology");
  return methodology;
}

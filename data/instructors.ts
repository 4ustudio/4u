import type { Instructor } from "@/types";

export const instructors: Instructor[] = [
  {
    id: "carlos-mendoza",
    name: "Carlos Mendoza",
    role: "Director Musical & Productor",
    bio: "Productor musical con más de 12 años de experiencia en grabación, mezcla y masterización. Ha trabajado con artistas locales e internacionales en géneros que van desde pop y rock hasta música urbana. Director de estudios de 4uStudio.",
    specialties: ["Producción musical", "Mezcla y masterización", "Composición"],
    social: {
      instagram: "@carlosmendozaprod",
      youtube: "carlosmendozamusic",
    },
  },
  {
    id: "valentina-rios",
    name: "Valentina Ríos",
    role: "Coach Vocal & Pianista",
    bio: "Cantante profesional y pianista con formación clásica y contemporánea. Especialista en técnica vocal, expresión escénica y dirección coral. Ha formado a más de 200 estudiantes en su carrera como docente.",
    specialties: ["Técnica vocal", "Piano clásico y moderno", "Dirección coral"],
    social: {
      instagram: "@valentinaríos vocal",
    },
  },
  {
    id: "andres-ospina",
    name: "Andrés Ospina",
    role: "Guitarrista & Bajista Principal",
    bio: "Guitarrista de sesión con más de 10 años de recorrido en escenarios nacionales. Experto en guitarra eléctrica, acústica y bajo. Ha sido músico de apoyo para diversos artistas colombianos y lidera su propia banda de rock.",
    specialties: ["Guitarra eléctrica", "Guitarra acústica", "Bajo", "Teoría musical"],
    social: {
      instagram: "@andresospinaguitar",
    },
  },
  {
    id: "diego-martinez",
    name: "Diego Martínez",
    role: "Baterista & Percusionista",
    bio: "Baterista profesional con énfasis en ritmos latinos y contemporáneos. Ha participado en montajes sinfónicos y grabaciones de estudio para múltiples proyectos. Su método de enseñanza combina técnica con exploración creativa.",
    specialties: ["Batería", "Percusión latina", "Ritmica y coordinación"],
    social: {
      instagram: "@diegobateria",
    },
  },
];

import type { Course } from "@/types";

export const courses: Course[] = [
  {
    title: "Guitarra",
    subtitle: "Acústica y eléctrica",
    status: "Básico a Avanzado",
    color: "#ff7a00",
    description: "Domina la guitarra desde los fundamentos hasta técnicas avanzadas. Acústica, eléctrica o ambas.",
    duration: "8 sesiones/mes",
    level: "Básico a Avanzado",
    instructorId: "andres-ospina",
    icon: (
      <svg className="w-16 h-16" viewBox="0 0 512 512" fill="white" opacity="0.3">
        <path d="M501.6 10.4c7.5 7.5 8.7 19.1 2.8 27.9L384 200.8V272c0 8.8-7.2 16-16 16s-16-7.2-16-16V208.8L216.2 392.1c-4.7 5.9-11.6 9.4-19 9.9L159 405l-20.9 41.7c-9.6 19.2-39.9 18.6-48.8-1L68.7 334.9c-6.8-17.3 6.4-36.9 24.6-36.9h5.8c9.8 0 19.1 4.9 24.6 13.3l20.8 33.6 38.2-19.1c6.2-3.1 13.2-4.1 20-2.9l51.2-74.1L0 55.1 55.1 0l233.7 256.9 120.5-162.4c8.2-11.1 22.3-15.6 35.1-11.3l45.1 18c6.5 2.6 12.1 7 16.1 12.7zM112 446.7c0 13-10.3 15.3-18 22c-4.2 3.7-8 7.5-11.3 11.3C73.3 491 64 480 64 480c0-8.8 7.2-16 16-16s16-7.2 16-16s7.2-16 16-16c8.8 0 16 7.2 16 16v14.7z"/>
      </svg>
    ),
  },
  {
    title: "Piano",
    subtitle: "Clásico y moderno",
    status: "Básico a Avanzado",
    color: "#488DEF",
    description: "Aprende piano clásico o moderno con método progresivo. Lectura de partituras, improvisación y más.",
    duration: "8 sesiones/mes",
    level: "Básico a Avanzado",
    instructorId: "valentina-rios",
    icon: (
      <svg className="w-16 h-16" viewBox="0 0 512 512" fill="white" opacity="0.3">
        <path d="M432 0H80C35.8 0 0 35.8 0 80v352c0 44.2 35.8 80 80 80h352c44.2 0 80-35.8 80-80V80c0-44.2-35.8-80-80-80zm0 64c8.8 0 16 7.2 16 16v80H336V64h96zM256 256h-64V64h64v192zm-112 256H80V64h64v192zm304 160c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16v-96h384v96zm0-128H336v-64h112v64z"/>
      </svg>
    ),
  },
  {
    title: "Canto",
    subtitle: "Técnica vocal",
    status: "Básico a Avanzado",
    color: "#ec4899",
    description: "Desarrolla tu voz con técnica vocal profesional. Respiración, afinación, proyección y repertorio.",
    duration: "8 sesiones/mes",
    level: "Básico a Avanzado",
    instructorId: "valentina-rios",
    icon: (
      <svg className="w-16 h-16" viewBox="0 0 512 512" fill="white" opacity="0.3">
        <path d="M256 0c13.3 0 24 10.7 24 24v3.7C367.9 45.9 440 112.8 464 199.4V256h8c13.3 0 24 10.7 24 24s-10.7 24-24 24h-8v64c0 79.5-64.5 144-144 144c-13.3 0-24-10.7-24-24s10.7-24 24-24c53 0 96-43 96-96V232c0-88.4-71.6-160-160-160S80 143.6 80 232v56c0 13.3-10.7 24-24 24s-24-10.7-24-24V199.4C72 112.8 144.1 45.9 232 27.7V24c0-13.3 10.7-24 24-24zM80 402.7V320h96v64c0 35.3-28.7 64-64 64c-17.7 0-33.8-7.2-45.5-18.7c-5.9-5.8-9.3-13.8-9.3-22.3c0-2.1.2-4.2.5-6.3zM400 320v64c0 17.7-7.2 33.8-18.7 45.5c-5.8 5.9-13.8 9.3-22.3 9.3c-2.1 0-4.2-.2-6.3-.5c-5.5-.6-10.7-2.4-15.3-5.1c-13.1-7.7-21.4-21.9-21.4-37.5V320h84z"/>
      </svg>
    ),
  },
  {
    title: "Batería",
    subtitle: "Ritmo y coordinación",
    status: "Básico a Avanzado",
    color: "#f59e0b",
    description: "Domina la batería desde los grooves básicos hasta fills avanzados. Técnica, independencia y creatividad.",
    duration: "8 sesiones/mes",
    level: "Básico a Avanzado",
    instructorId: "diego-martinez",
    icon: (
      <svg className="w-16 h-16" viewBox="0 0 512 512" fill="white" opacity="0.3">
        <path d="M256 64C132.3 64 32 149.9 32 256s100.3 192 224 192s224-85.9 224-192S379.7 64 256 64zM256 416c-97 0-176-71.6-176-160S159 96 256 96s176 71.6 176 160s-79 160-176 160zm0-48c-61.9 0-112-50.1-112-112s50.1-112 112-112s112 50.1 112 112s-50.1 112-112 112zm0-176c-35.3 0-64 28.7-64 64s28.7 64 64 64s64-28.7 64-64s-28.7-64-64-64z"/>
      </svg>
    ),
  },
  {
    title: "Bajo",
    subtitle: "Líneas y grooves",
    status: "Básico a Avanzado",
    color: "#10b981",
    description: "Construye la base rítmica de cualquier banda. Técnica de mano, grooves, walking bass y slap.",
    duration: "8 sesiones/mes",
    level: "Básico a Avanzado",
    instructorId: "andres-ospina",
    icon: (
      <svg className="w-16 h-16" viewBox="0 0 512 512" fill="white" opacity="0.3">
        <path d="M501.6 10.4c7.5 7.5 8.7 19.1 2.8 27.9L384 200.8V272c0 8.8-7.2 16-16 16s-16-7.2-16-16V208.8L216.2 392.1c-4.7 5.9-11.6 9.4-19 9.9L159 405l-20.9 41.7c-9.6 19.2-39.9 18.6-48.8-1L68.7 334.9c-6.8-17.3 6.4-36.9 24.6-36.9h8.9c9.8 0 19.1 4.9 24.6 13.3l20.8 33.6 38.2-19.1c6.2-3.1 13.2-4.1 20-2.9l51.2-74.1L55.1 0 0 55.1l233.7 256.9 120.5-162.4c8.2-11.1 22.3-15.6 35.1-11.3l45.1 18c6.5 2.6 12.1 7 16.1 12.7z"/>
      </svg>
    ),
  },
];

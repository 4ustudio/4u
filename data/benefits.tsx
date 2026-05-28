import type { Benefit } from "@/types";

export const benefits: Benefit[] = [
  {
    title: "Estudio profesional",
    description: "Grabación y producción en un estudio equipado con tecnología de primera línea. Sonido real, no simulado.",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 512 512" fill="none" stroke="#ff7a00" strokeWidth="2">
        <rect x="32" y="96" width="448" height="320" rx="16" stroke="currentColor" fill="none"/>
        <circle cx="256" cy="256" r="64" stroke="currentColor" fill="none"/>
        <path d="M192 256h-64M384 256h-64" stroke="currentColor" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: "Instructores expertos",
    description: "Músicos activos en la escena nacional con formación pedagógica. Aprendes de quien realmente vive la música.",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 512 512" fill="none" stroke="#ff7a00" strokeWidth="2">
        <circle cx="176" cy="144" r="64" stroke="currentColor" fill="none"/>
        <path d="M80 448c0-53 43-96 96-96s96 43 96 96" stroke="currentColor" fill="none" strokeLinecap="round"/>
        <path d="M320 96c53 0 96 43 96 96" stroke="currentColor" strokeLinecap="round"/>
        <path d="M304 160c35.3 0 64 28.7 64 64v96" stroke="currentColor" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: "Planes flexibles",
    description: "Elige el plan que se ajuste a tu nivel, disponibilidad y objetivos. Sin contratos largos ni compromisos rígidos.",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 512 512" fill="none" stroke="#ff7a00" strokeWidth="2">
        <rect x="48" y="96" width="416" height="320" rx="16" stroke="currentColor" fill="none"/>
        <line x1="48" y1="192" x2="464" y2="192" stroke="currentColor"/>
        <circle cx="160" cy="272" r="16" fill="#ff7a00"/>
        <circle cx="256" cy="272" r="16" fill="#ff7a00"/>
        <circle cx="352" cy="272" r="16" fill="#ff7a00"/>
      </svg>
    ),
  },
  {
    title: "Resultados reales",
    description: "Cada plan incluye entregables concretos: canciones grabadas, mezcladas y masterizadas. No solo aprendes, produces.",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 512 512" fill="none" stroke="#ff7a00" strokeWidth="2">
        <path d="M144 256l56 56 112-112" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M256 48C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48z" stroke="currentColor" fill="none"/>
      </svg>
    ),
  },
  {
    title: "Ambiente creativo",
    description: "Un espacio diseñado para que la música fluya. Clases en un entorno inspirador que despierta tu creatividad.",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 512 512" fill="none" stroke="#ff7a00" strokeWidth="2">
        <path d="M256 80c-97 0-176 79-176 176 0 97 79 176 176 176s176-79 176-176c0-97-79-176-176-176z" stroke="currentColor" fill="none"/>
        <path d="M208 192v128M304 192v128M192 256h128" stroke="currentColor" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: "Comunidad musical",
    description: "Formas parte de una red de artistas, músicos y creadores. Colaboraciones, presentaciones y eventos exclusivos.",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 512 512" fill="none" stroke="#ff7a00" strokeWidth="2">
        <path d="M368 128c0-53-43-96-96-96s-96 43-96 96v64c0 53 43 96 96 96s96-43 96-96v-64z" stroke="currentColor" fill="none"/>
        <path d="M128 272v48c0 70.7 57.3 128 128 128s128-57.3 128-128v-48" stroke="currentColor" strokeLinecap="round"/>
        <path d="M256 448v64M192 512h128" stroke="currentColor" strokeLinecap="round"/>
      </svg>
    ),
  },
];

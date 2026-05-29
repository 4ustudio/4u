import type { PlanCardProps } from "@/types";

// ─── Fuente única de datos para todos los planes adultos ──────────────────────
// Usar en: /planes, /planes/jovenes-adultos, cards de resumen, CTAs

export interface PlanDetail {
  id: number;
  slug: string;
  badge?: string;
  name: string;
  subtitle: string;
  price: string;
  priceNote?: string;
  priceAlt?: string;          // precio alternativo (ej. opción sin grabación)
  description: string;
  features: string[];
  instruments?: string[];
  highlighted?: boolean;
  image: string;
  imagePosition?: string;
  tag?: string;               // etiqueta corta para filtros
  limitedOffer?: boolean;
  priceOnRequest?: boolean;   // precio según cotización/artista
}

export const PLANES_ADULTOS: PlanDetail[] = [
  {
    id: 1,
    slug: "new-talent",
    badge: "Inicio",
    name: "Plan 1 – New Talent",
    subtitle: "Cumplo mi sueño",
    price: "$1.100.000",
    priceNote: "/ mes",
    description:
      "Para quienes desean vivir la emocionante experiencia de grabar su primera canción en estudio.",
    features: [
      "8 clases al mes",
      "4 clases grabadas y entregadas en MP3",
      "Metodología de estudio en casa",
    ],
    instruments: ["Canto", "Guitarra", "Batería", "Teclado", "Bajo"],
    highlighted: false,
    image: "/images/courses/planes-tipos/Plan 1.png",
    imagePosition: "object-[35%_45%]",
    tag: "Inicial",
  },
  {
    id: 2,
    slug: "fast-talent",
    badge: "Popular",
    name: "Plan 2 – Fast Talent",
    subtitle: "Cumplo mi sueño",
    price: "$1.900.000",
    priceNote: "/ mes",
    description:
      "Para quienes desean acelerar su proceso musical y obtener resultados en menos tiempo.",
    features: [
      "8 clases al mes",
      "4 clases grabadas y entregadas en MP3",
      "Metodología de estudio en casa",
      "Entrega final de una canción acústica mezclada e instrumentalizada",
    ],
    instruments: ["Canto", "Guitarra", "Batería", "Teclado", "Bajo"],
    highlighted: true,
    limitedOffer: true,
    image: "/images/courses/planes-tipos/Plan 1B.png",
    imagePosition: "object-[55%_52%]",
    tag: "Inicial",
  },
  {
    id: 3,
    slug: "artist",
    name: "Plan 3 – Artist",
    subtitle: "Tengo mi canción completa",
    price: "$3.500.000",
    priceNote: "/ mes",
    description:
      "Ideal para quienes quieren una canción profesional como obra artística real, con sonido profesional y acompañamiento creativo.",
    features: [
      "Instrumentos en grabación: guitarra, bajo, batería y voz",
      "Teclado opcional como adicional",
      "8 clases mensuales del instrumento elegido",
    ],
    instruments: ["Canto", "Guitarra", "Batería", "Bajo", "Teclado"],
    highlighted: false,
    image: "/images/courses/planes-tipos/Plan 2.png",
    imagePosition: "object-[72%_45%]",
    tag: "Artista",
  },
  {
    id: 4,
    slug: "professional",
    name: "Plan 4 – Professional",
    subtitle: "Tengo mi proyecto artístico",
    price: "$4.500.000",
    priceNote: "/ mes",
    priceAlt: "Sin grabación, mezcla y masterización: $3.000.000",
    description:
      "Pensado para artistas que quieren identidad visual, respaldo legal y presencia formal en plataformas.",
    features: [
      "Producción musical profesional",
      "Diseño de portada y fotografía artística",
      "Construcción de imagen del proyecto",
      "Mezcla y masterización",
      "Asesoría legal y preparación para distribución",
    ],
    highlighted: false,
    image: "/images/courses/planes-tipos/Plan 3.png",
    imagePosition: "object-[45%_72%]",
    tag: "Artista",
  },
  {
    id: 5,
    slug: "famous",
    name: "Plan 5 – Famous",
    subtitle: "Construyo mi carrera musical",
    price: "Según artista y necesidad",
    description:
      "Para quienes buscan hacer de la música su proyecto principal y desarrollar un álbum completo con visión profesional.",
    features: [
      "Planeación y dirección artística del disco",
      "Producción de varias canciones",
      "Grabación, mezcla y masterización avanzada",
      "Estrategia básica de posicionamiento artístico",
    ],
    highlighted: false,
    priceOnRequest: true,
    image: "/images/courses/planes-tipos/Plan 4.png",
    imagePosition: "object-[62%_52%]",
    tag: "Profesional",
  },
  {
    id: 6,
    slug: "corporativo",
    name: "Plan 6 – Corporativo",
    subtitle: "Audio estratégico para marcas y empresas",
    price: "Según cotización",
    description:
      "Soluciones de audio profesional para empresas que desean comunicar con identidad sonora y coherencia de marca.",
    features: [
      "Diagnóstico de marca sonora",
      "Jingles y audios corporativos",
      "Producción técnica profesional",
      "Entrega optimizada para cada medio",
      "Creatividad y estrategia",
    ],
    highlighted: false,
    priceOnRequest: true,
    image: "/images/courses/planes-tipos/Plan 5.png",
    imagePosition: "object-[80%_52%]",
    tag: "Empresas",
  },
];

// Compatibilidad con PlanCardProps para componentes existentes
export const PLANES: PlanCardProps[] = PLANES_ADULTOS.map((p) => ({
  badge: p.badge,
  name: p.name,
  subtitle: p.subtitle,
  price: p.price,
  priceNote: p.priceNote,
  description: p.description,
  features: p.features.map((text) => ({ text })),
  instruments: p.instruments,
  highlighted: p.highlighted,
}));

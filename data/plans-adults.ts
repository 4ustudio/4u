import type { PlanCardProps } from "@/types";

export interface PlanDetail {
  id: number;
  slug: string;
  badge?: string;
  name: string;
  subtitle: string;
  price: string;
  priceNote?: string;
  priceAlt?: string;
  description: string;
  features: string[];
  instruments?: string[];
  highlighted?: boolean;
  image: string;
  imagePosition?: string;
  tag?: string;
  limitedOffer?: boolean;
  priceOnRequest?: boolean;
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
      "Tiempo por clase y sesión: 50 min",
      "Presentación en vivo (tarima) Marzo, Junio, Septiembre y Diciembre",
      "Grabación de canción profesional cada 3 meses",
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
      "Tiempo por clase y sesión: 50 min",
      "Presentación en vivo (tarima) Marzo, Junio, Septiembre y Diciembre",
      "Grabación de canción profesional cada 3 meses",
      "Entrega final de una canción acústica mezclada y masterizada",
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
    slug: "bandas",
    name: "Plan 3 – Bandas",
    subtitle: "Garage Days",
    price: "$2.500.000",
    priceNote: "/ mes",
    priceAlt: "Con director de ensamble: $3.500.000  ·  Persona adicional: $600.000",
    description:
      "Para grupos y bandas que quieren ensayar, grabar y presentarse en vivo como artistas profesionales.",
    features: [
      "8 sesiones de 50 min cada una",
      "Máximo 4 personas por banda",
      "Persona adicional: $600.000",
      "Grabación de canción profesional cada 3 meses",
      "Presentación en vivo (tarima) Marzo, Junio, Septiembre y Diciembre",
      "Sin director de ensamble: $2.500.000",
      "Con director de ensamble: $3.500.000",
    ],
    highlighted: false,
    image: "/images/courses/planes-tipos/Plan 2.png",
    imagePosition: "object-[72%_45%]",
    tag: "Artista",
  },
  {
    id: 4,
    slug: "artist",
    name: "Plan 4 – Artist",
    subtitle: "Tengo mi proyecto artístico",
    price: "$4.500.000",
    priceNote: "/ mes",
    description:
      "Pensado para artistas que quieren identidad visual, respaldo legal y presencia formal en plataformas.",
    features: [
      "8 sesiones de producción musical",
      "Tiempo por clase y sesión: 50 min",
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
    slug: "professional",
    name: "Plan 5 – Professional",
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

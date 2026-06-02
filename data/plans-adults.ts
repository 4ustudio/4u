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
    name: "Plan New Talent",
    subtitle: "Cumplo mi sueño",
    price: "$1.100.000",
    priceNote: "/ mes",
    description:
      "Para quienes desean vivir la emocionante experiencia de grabar su primera canción en estudio.",
    features: [
      "8 clases mensuales",
      "Grabación profesional de canción acústica cada 3 meses (mezclada y masterizada)",
      "Presentaciones en vivo en tarima (marzo, junio, septiembre y diciembre)",
      "Clases con profesores especializados: Técnica vocal · Guitarra · Bajo · Teclado · Batería",
      "Metodología dinámica y práctica orientada al desarrollo artístico",
      "Entrenamiento auditivo, sentido rítmico e interpretación artística",
      "4 de las 8 clases grabadas y entregadas en MP3",
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
    name: "Plan Fast Talent",
    subtitle: "Cumplo mi sueño",
    price: "$1.900.000",
    priceNote: "/ mes",
    description:
      "Para quienes desean acelerar su proceso musical y obtener resultados en menos tiempo con grabación mensual.",
    features: [
      "8 clases mensuales",
      "Grabación profesional de canción acústica cada mes (mezclada y masterizada)",
      "Presentaciones en vivo en tarima (marzo, junio, septiembre y diciembre)",
      "Clases con profesores especializados: Técnica vocal · Guitarra · Bajo · Teclado · Batería",
      "Metodología dinámica y práctica orientada al desarrollo artístico",
      "Entrenamiento auditivo, sentido rítmico e interpretación artística",
      "4 de las 8 clases grabadas y entregadas en MP3",
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
    name: "Plan Bandas",
    subtitle: "Garage Days",
    price: "$2.500.000",
    priceNote: "/ mes",
    priceAlt: "Con Director de Ensamble: $3.500.000  ·  Integrante adicional: $600.000",
    description:
      "Diseñado para bandas que desean ensayar, fortalecer su ensamble y prepararse para presentaciones en vivo, grabaciones y proyectos artísticos.",
    features: [
      "8 sesiones mensuales de ensayo y trabajo de ensamble",
      "Grabación profesional con todos los integrantes cada 3 meses (mezclada y masterizada)",
      "Presentaciones en vivo en tarima (marzo, junio, septiembre y diciembre)",
      "4 de las 8 sesiones grabadas y entregadas en MP3",
      "Máximo 4 integrantes por banda",
      "Integrante adicional: $600.000 mensuales",
      "Sin Director de Ensamble: $2.500.000  ·  Con Director: $3.500.000",
    ],
    highlighted: false,
    image: "/images/courses/planes-tipos/Plan 2.png",
    imagePosition: "object-[72%_45%]",
    tag: "Artista",
  },
  {
    id: 4,
    slug: "artista",
    name: "Plan Artista",
    subtitle: "Tengo mi proyecto artístico",
    price: "$3.500.000",
    priceNote: "/ mes",
    description:
      "Diseñado para personas que desean producir una canción propia, una composición original o un cover, acompañados durante todo el proceso creativo y de producción.",
    features: [
      "8 sesiones mensuales de producción y grabación",
      "Producción musical · Grabación de voces e instrumentos",
      "Preparación artística e interpretación",
      "Clases del instrumento seleccionado por el alumno",
      "Acompañamiento del productor musical y/o coach del instrumento",
      "Grabación de: Voz · Guitarra · Bajo · Teclado · Batería",
      "Canción entregada mezclada y masterizada, lista para plataformas digitales",
    ],
    instruments: ["Voz", "Guitarra", "Bajo", "Teclado", "Batería"],
    highlighted: false,
    image: "/images/courses/planes-tipos/Plan 3.png",
    imagePosition: "object-[45%_72%]",
    tag: "Artista",
  },
  {
    id: 5,
    slug: "artista-premium",
    badge: "Premium",
    name: "Plan Artista Premium",
    subtitle: "Mi imagen artística profesional",
    price: "$4.500.000",
    priceNote: "/ mes",
    description:
      "Para artistas que desean desarrollar una canción y construir una imagen profesional para presentar su proyecto musical al público.",
    features: [
      "8 sesiones mensuales de producción y grabación",
      "Producción musical · Grabación de voces e instrumentos",
      "Preparación artística e interpretación",
      "Canción entregada mezclada y masterizada, lista para plataformas digitales",
      "Diseño profesional de portada para plataformas digitales",
      "Sesión fotográfica artística para el proyecto musical",
      "Desarrollo y construcción de la imagen artística del proyecto",
      "Asesoría en identidad visual, estilo y presentación artística",
    ],
    instruments: ["Voz", "Guitarra", "Bajo", "Teclado", "Batería"],
    highlighted: true,
    image: "/images/courses/planes-tipos/Plan 3.png",
    imagePosition: "object-[55%_52%]",
    tag: "Artista",
  },
  {
    id: 6,
    slug: "professional",
    name: "Plan Profesional",
    subtitle: "Construyo mi carrera musical",
    price: "Cotización personalizada",
    description:
      "Para artistas que desean desarrollar un proyecto musical profesional: álbum, EP o catálogo de canciones con visión comercial y estratégica.",
    features: [
      "Planeación y dirección artística integral del proyecto",
      "Desarrollo conceptual y creativo del álbum o producción",
      "Producción, grabación, mezcla y masterización de múltiples canciones",
      "Desarrollo y construcción de identidad artística",
      "Dirección de imagen del artista y diseño gráfico del proyecto",
      "Diseño de portadas y piezas visuales para el lanzamiento",
      "Equipo multidisciplinario: productores, músicos, ingenieros y creativos",
      "Reunión de diagnóstico y planeación requerida",
    ],
    highlighted: false,
    priceOnRequest: true,
    image: "/images/courses/planes-tipos/Plan 4.png",
    imagePosition: "object-[62%_52%]",
    tag: "Profesional",
  },
  {
    id: 7,
    slug: "corporativo",
    name: "Plan Corporativo",
    subtitle: "Audio estratégico para marcas y empresas",
    price: "Cotización personalizada",
    description:
      "Para empresas que desean fortalecer su comunicación con soluciones de audio profesional, construyendo una identidad sonora coherente y alineada con su marca.",
    features: [
      "Diagnóstico y análisis de marca sonora",
      "Desarrollo de identidad sonora corporativa",
      "Creación de jingles comerciales y publicitarios",
      "Locuciones profesionales para campañas, videos y canales digitales",
      "Diseño de audiobranding y musicalización de contenidos",
      "Producción para radio, TV, redes sociales y eventos corporativos",
      "Acompañamiento estratégico para coherencia entre marca e identidad sonora",
      "Equipo: productores, creativos, locutores, músicos e ingenieros",
      "Reunión de diagnóstico requerida",
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

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
  priceOnRequest?: boolean;
  footerNote?: string;
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
      "Para quienes desean vivir la experiencia de grabar su primera canción en estudio y desarrollar su talento musical.",
    features: [
      "8 clases mensuales",
      "Canción acústica grabada profesionalmente cada 3 meses, mezclada y masterizada, lista para compartir o publicar en plataformas digitales",
      "Presentaciones en vivo en tarima (marzo, junio, septiembre y diciembre)*",
      "Clases con profesores especializados en: Técnica vocal · Guitarra · Bajo · Teclado · Batería · Otros instrumentos según disponibilidad",
      "Metodología dinámica y práctica orientada al desarrollo artístico",
      "Desarrollo de la musicalidad integral: Entrenamiento auditivo · Sentido rítmico · Interpretación y expresión artística",
      "4 de las 8 clases grabadas y entregadas en formato MP3 (audio original sin edición)",
    ],
    instruments: ["Canto", "Guitarra", "Batería", "Teclado", "Bajo"],
    highlighted: false,
    image: "/images/courses/planes-tipos/Plan 1.png",
    imagePosition: "object-[35%_45%]",
    tag: "Inicial",
    footerNote: "*Aplica para estudiantes activos al momento de cada presentación.",
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
      "Para quienes desean acelerar su proceso musical con grabación profesional mensual y resultados visibles en menos tiempo.",
    features: [
      "8 clases mensuales",
      "Canción acústica grabada profesionalmente cada mes, mezclada y masterizada, lista para compartir o publicar en plataformas digitales",
      "Presentaciones en vivo en tarima (marzo, junio, septiembre y diciembre)*",
      "Clases con profesores especializados en: Técnica vocal · Guitarra · Bajo · Teclado · Batería · Otros instrumentos según disponibilidad",
      "Metodología dinámica y práctica orientada al desarrollo artístico",
      "Desarrollo de la musicalidad integral: Entrenamiento auditivo · Sentido rítmico · Interpretación y expresión artística",
      "4 de las 8 clases grabadas y entregadas en formato MP3 (audio original sin edición)",
    ],
    instruments: ["Canto", "Guitarra", "Batería", "Teclado", "Bajo"],
    highlighted: true,
    image: "/images/courses/planes-tipos/Plan 1B.png",
    imagePosition: "object-[55%_52%]",
    tag: "Inicial",
    footerNote: "*Aplica para estudiantes activos al momento de cada presentación.",
  },
  {
    id: 3,
    slug: "bandas",
    name: "Plan Bandas",
    subtitle: "Garage Days",
    price: "$2.500.000",
    priceNote: "/ mes",
    priceAlt: "Con Director de Ensamble: $3.500.000  ·  Integrante adicional: $600.000/mes",
    description:
      "Diseñado para bandas que desean ensayar, fortalecer su ensamble musical y prepararse para presentaciones en vivo, grabaciones y proyectos artísticos.",
    features: [
      "8 sesiones mensuales de ensayo y trabajo de ensamble",
      "Canción grabada profesionalmente con todos los integrantes cada 3 meses, mezclada y masterizada, lista para compartir o publicar en plataformas digitales",
      "Presentaciones en vivo en tarima (marzo, junio, septiembre y diciembre)*",
      "4 de las 8 sesiones grabadas y entregadas en formato MP3 como herramienta de análisis, seguimiento y mejora del desempeño grupal",
      "Máximo 4 integrantes por banda",
      "Valor adicional por integrante extra: $600.000 mensuales",
      "Sin Director de Ensamble: $2.500.000 mensuales",
      "Con Director de Ensamble: $3.500.000 mensuales",
    ],
    highlighted: false,
    image: "/images/courses/planes-tipos/Plan 2.png",
    imagePosition: "object-[72%_45%]",
    tag: "Artista",
    footerNote: "*Aplica para bandas activas al momento de cada presentación.",
  },
  {
    id: 4,
    slug: "artista",
    name: "Plan Artista",
    subtitle: "Tengo mi proyecto artístico",
    price: "$3.500.000",
    priceNote: "/ mes",
    description:
      "Diseñado para personas que ya tienen una canción propia, una composición original o desean realizar una versión/cover, acompañados durante todo el proceso creativo, musical y de producción.",
    features: [
      "8 sesiones mensuales",
      "Sesiones para: Producción musical · Grabación de voces · Grabación de instrumentos · Preparación artística e interpretación · Clases del instrumento seleccionado",
      "Acompañamiento y dirección artística del productor musical y/o coach del instrumento seleccionado",
      "Grabación que incluye: Voz · Guitarra · Bajo · Teclado · Batería",
      "Canción entregada mezclada y masterizada, lista para compartir con familiares, amigos o publicar en plataformas digitales",
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
      "Diseñado para artistas que desean desarrollar una canción y construir una imagen profesional para presentar su proyecto musical al público.",
    features: [
      "8 sesiones mensuales",
      "Sesiones para: Producción musical · Grabación de voces · Grabación de instrumentos · Preparación artística e interpretación · Clases del instrumento seleccionado",
      "Acompañamiento y dirección artística del productor musical y/o coach del instrumento seleccionado",
      "Grabación que incluye: Voz · Guitarra · Bajo · Teclado · Batería",
      "Canción entregada mezclada y masterizada, lista para publicar en plataformas digitales",
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
      "Diseñado para artistas que desean desarrollar un proyecto musical de manera profesional, construir una propuesta artística sólida y producir un álbum, EP o catálogo de canciones con visión comercial y estratégica.",
    features: [
      "Planeación y dirección artística integral del proyecto",
      "Desarrollo conceptual y creativo del álbum o producción musical",
      "Producción de múltiples canciones",
      "Grabación profesional de voces e instrumentos",
      "Dirección e interpretación vocal e instrumental",
      "Arreglos y producción musical",
      "Mezcla y masterización profesional de todas las canciones del proyecto",
      "Desarrollo y construcción de la identidad artística",
      "Dirección de imagen del artista y del proyecto musical",
      "Diseño gráfico y conceptual del proyecto",
      "Diseño de portadas y piezas visuales asociadas al lanzamiento",
      "Acompañamiento estratégico durante el desarrollo artístico y creativo del proyecto",
      "Equipo multidisciplinario: productores, músicos, ingenieros y profesionales creativos según las necesidades",
      "📅 Reunión de diagnóstico y planeación requerida",
      "💰 Cotización personalizada según alcance, número de canciones y requerimientos del proyecto",
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
      "Diseñado para empresas que desean fortalecer su comunicación mediante soluciones de audio profesional, construyendo una identidad sonora coherente, memorable y alineada con su marca.",
    features: [
      "Diagnóstico y análisis de marca sonora",
      "Desarrollo de identidad sonora corporativa",
      "Creación de jingles comerciales y publicitarios",
      "Producción de audios institucionales y corporativos",
      "Locuciones profesionales para campañas, videos, eventos y canales digitales",
      "Diseño y desarrollo de audiobranding",
      "Musicalización para contenidos de marca",
      "Producción de cápsulas informativas y educativas",
      "Producción de piezas para radio, televisión, redes sociales, plataformas digitales y eventos corporativos",
      "Desarrollo creativo y conceptual de campañas de audio",
      "Producción técnica profesional con estándares comerciales",
      "Optimización y entrega de piezas para cada medio de comunicación",
      "Acompañamiento estratégico para coherencia entre identidad de marca y comunicación sonora",
      "Equipo multidisciplinario: productores, creativos, locutores, músicos e ingenieros",
      "📅 Reunión de diagnóstico requerida",
      "💰 Cotización personalizada según objetivos, alcance y requerimientos de la empresa",
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

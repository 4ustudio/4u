import type { PlanCardProps } from "@/types";

export const PLANES_KIDS: PlanCardProps[] = [
  {
    name: "Plan Kids & Teens 1",
    subtitle: "Descubro la Música",
    price: "$1.100.000",
    priceNote: "/ mes",
    description:
      "Orientado a quienes se acercan a la música por primera vez, enfatizando el aprendizaje lúdico en un ambiente seguro.",
    features: [
      { text: "8 clases mensuales con especialistas" },
      { text: "Instrumento o canto adaptado a la edad" },
      { text: "Desarrollo auditivo y sentido rítmico" },
      { text: "Coordinación y trabajo en equipo" },
      { text: "Grabación profesional de canción acústica" },
      { text: "4 clases grabadas en MP3 como herramientas pedagógicas" },
    ],
    highlighted: false,
  },
  {
    badge: "Popular",
    name: "Plan Kids & Teens 2",
    subtitle: "Grabo Mi Canción",
    price: "$1.600.000",
    priceNote: "/ mes",
    description:
      "Para quienes desean la experiencia de grabación en estudio y crear como artistas.",
    features: [
      { text: "Todo lo incluido en el Plan 1" },
      { text: "Introducción al estudio de grabación" },
      { text: "Entrenamiento con micrófono" },
      { text: "Grabación trimestral de canción sencilla" },
      { text: "Mezcla profesional básica" },
      { text: "8 clases mensuales (4 entregadas grabadas en MP3)" },
    ],
    highlighted: true,
  },
];

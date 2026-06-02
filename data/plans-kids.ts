import type { PlanCardProps } from "@/types";

export const PLANES_KIDS: PlanCardProps[] = [
  {
    name: "Plan Kids & Teens",
    subtitle: "Aprende y Graba",
    price: "$1.100.000",
    priceNote: "/ mes",
    description:
      "Plan completo para niños y adolescentes: clases especializadas, grabación profesional cada 3 meses y presentaciones en tarima.",
    features: [
      { text: "8 clases mensuales con profesores especializados" },
      { text: "Grabación profesional acústica cada 3 meses (mezclada y masterizada)" },
      { text: "Presentaciones en vivo en tarima (marzo, junio, septiembre y diciembre)" },
      { text: "Técnica vocal · Guitarra · Bajo · Teclado · Batería" },
      { text: "Metodología lúdica, dinámica y creativa" },
      { text: "4 de las 8 clases grabadas y entregadas en MP3" },
    ],
    highlighted: false,
  },
  {
    badge: "Premium",
    name: "Plan Premium Kids & Teens",
    subtitle: "Graba Cada Mes",
    price: "$1.600.000",
    priceNote: "/ mes",
    description:
      "La experiencia completa: grabación profesional mensual, presentaciones en vivo y acompañamiento artístico integral.",
    features: [
      { text: "8 clases mensuales con profesores especializados" },
      { text: "Grabación profesional acústica cada mes (mezclada y masterizada)" },
      { text: "Presentaciones en vivo en tarima (marzo, junio, septiembre y diciembre)" },
      { text: "Técnica vocal · Guitarra · Bajo · Teclado · Batería" },
      { text: "Metodología lúdica, dinámica y creativa" },
      { text: "4 de las 8 clases grabadas y entregadas en MP3" },
    ],
    highlighted: true,
  },
];

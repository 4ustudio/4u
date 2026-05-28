import type { PlanCardProps } from "@/types";

export const PLANES: PlanCardProps[] = [
  {
    badge: "Inicio",
    name: "Plan 1A — Plan Base",
    subtitle: "Cumplo Mi Sueño",
    price: "$1.100.000",
    priceNote: "/ mes",
    description:
      "Para quienes desean vivir la emocionante experiencia de grabar su primera canción en estudio.",
    features: [
      { text: "8 clases mensuales" },
      { text: "4 clases grabadas entregadas en MP3" },
    ],
    instruments: ["Canto", "Guitarra", "Batería", "Teclado", "Bajo"],
    highlighted: false,
  },
  {
    badge: "Popular",
    name: "Plan 1B — Plan Base",
    subtitle: "Cumplo Mi Sueño",
    price: "$1.600.000",
    priceNote: "/ mes",
    description:
      "Igual que el Plan Base con un plus: una canción acústica mezclada y masterizada al final del mes.",
    features: [
      { text: "8 clases mensuales" },
      { text: "4 clases grabadas entregadas en MP3" },
      { text: "1 canción acústica mezclada y masterizada (oferta limitada)" },
    ],
    instruments: ["Canto", "Guitarra", "Batería", "Teclado", "Bajo"],
    highlighted: true,
  },
  {
    name: "Plan 2 — Plan Artista",
    subtitle: "Tengo Mi Canción Completa",
    price: "$3.500.000",
    priceNote: "/ mes",
    description:
      "Una canción producida como una obra artística real, con sonido profesional.",
    features: [
      { text: "8 clases mensuales del instrumento elegido" },
      { text: "Grabación profesional: Guitarra, Bajo, Batería, Voz" },
      { text: "Teclados opcionales" },
    ],
    highlighted: false,
  },
  {
    name: "Plan 3 — Plan Artista Pro",
    subtitle: "Tengo Mi Proyecto Artístico",
    price: "$4.500.000",
    priceNote: "/ mes",
    description:
      "Para artistas que quieren identidad visual, respaldo legal y presencia formal.",
    features: [
      { text: "Producción musical profesional" },
      { text: "Diseño de portada y fotografía artística" },
      { text: "Mezcla, masterización y asesoría legal" },
      { text: "Solo grabación/mezcla/masterización: $3.000.000" },
    ],
    highlighted: false,
  },
  {
    name: "Plan 4 — Plan Artista Profesional",
    subtitle: "Construyo Mi Carrera Musical",
    price: "Según artista",
    description:
      "Para quienes quieren hacer de la música su proyecto principal y desarrollar un álbum completo.",
    features: [
      { text: "Dirección artística del disco" },
      { text: "Producción de múltiples canciones" },
      { text: "Grabación, mezcla y masterización avanzada" },
      { text: "Estrategia de posicionamiento artístico" },
    ],
    highlighted: false,
  },
];

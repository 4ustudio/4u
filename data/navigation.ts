import type { NavLink } from "@/types";

export const navLinks: NavLink[] = [
  { href: "/", label: "Inicio" },
  {
    href: "/planes",
    label: "Planes",
    children: [
      {
        href: "/planes/jovenes-adultos",
        label: "Jóvenes y Adultos",
        description: "Para mayores de 15 años",
      },
      {
        href: "/planes-kids-teens",
        label: "Kids & Teens",
        description: "Para niños y adolescentes",
      },
    ],
  },
  { href: "/lecciones", label: "Lecciones" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

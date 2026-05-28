# 4uStudio Academy 🎵

Plataforma web para academia de música profesional. Dark premium UI con glassmorphism, showcase de cursos, pricing cards y sistema de planes.

## Stack

- **Framework:** Next.js 16 (App Router)
- **Runtime:** React 19
- **Language:** TypeScript 6
- **Styling:** Tailwind CSS v4
- **Build:** Turbopack

## Estructura

```
src/
├── app/                  # Rutas y layouts de Next.js
│   ├── page.tsx          # Home
│   ├── layout.tsx        # Root layout
│   ├── nosotros/         # About page
│   ├── contacto/         # Contact / WhatsApp
│   ├── planes/           # Pricing for adults
│   ├── planes-kids-teens/# Pricing for kids
│   ├── corporativo/      # Corporate audio
│   └── produccion/       # Music production
├── components/
│   ├── layout/           # Header, Footer, PageLayout
│   ├── sections/         # HeroSection, CoursesSection, CTASection
│   ├── ui/               # Container, GlassCard, Button, Badge, etc.
│   └── cards/            # CourseCard, PlanCard, StatsCard
├── data/                 # Static content (courses, plans, navigation)
├── types/                # TypeScript interfaces compartidas
├── lib/                  # Utilidades (cn helper)
├── constants/            # Tokens de diseño (colores, sombras)
└── public/               # Assets estáticos
    └── images/           # Imágenes (banner-principal.jpg)
```

## Rutas

| Ruta | Descripción |
|---|---|
| `/` | Home con Hero, cursos, CTA |
| `/planes` | Planes para jóvenes y adultos |
| `/planes-kids-teens` | Planes para niños y adolescentes |
| `/nosotros` | Sobre 4uStudio |
| `/contacto` | Contacto vía WhatsApp |
| `/corporativo` | Audio estratégico para marcas |
| `/produccion` | Producción musical profesional |

## Empezar

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Build

```bash
npm run build
```

## Diseño

- **Fondo:** `#000000`
- **Acento:** `#ff7a00` (naranja)
- **Cards:** Glassmorphism (`backdrop-blur-xl`, `border-white/10`)
- **Tipografía:** Poppins (headings) + Roboto (body)
- **Responsive:** Mobile-first, container `max-w-7xl`

## Próximos pasos

- Reemplazar placeholders SVG con imágenes reales de cursos
- Integrar CMS para contenido dinámico
- Dashboard de estudiantes
- Autenticación y perfiles

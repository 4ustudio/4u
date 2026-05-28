# Estructura de Assets Públicos

## Organización de carpetas

```
public/
├── images/              # Imágenes de contenido (banners, hero, cursos, etc.)
│   └── banner-principal.jpg
├── logos/               # Logos de la marca y partners
│   ├── logo-4ustudio.png
│   ├── logo-4ustudio-light.png
│   └── partners/        # Logos de marcas asociadas
├── icons/               # Iconos SVG o PNG (iconografía de la app)
│   ├── menu-icon.svg
│   ├── play-icon.svg
│   └── social-icons/
└── assets/              # Otros recursos (fuentes, documentos, etc.)
    └── fonts/
```

## Guía de uso

### Images (`/public/images/`)
- Banners y hero images
- Imágenes de cursos
- Fondos de secciones
- Fotos de profesores/estudiantes
- Cualquier imagen de contenido

### Logos (`/public/logos/`)
- Logo principal de 4uStudio
- Variantes de logo (light, dark)
- Logos de partners y marcas aliadas
- Favicon y app icons

### Icons (`/public/icons/`)
- Iconos SVG pequeños
- Iconografía de navegación
- Iconos de características
- Debe organizarse por categoría si crece

### Assets (`/public/assets/`)
- Fuentes personalizadas (si no usan Google Fonts)
- Documentos
- Otros recursos generales

## Instrucciones de referencia en código

```tsx
// Imágenes
<img src="/images/banner-principal.jpg" alt="Banner" />

// En backgroundImage
style={{ backgroundImage: "url('/images/banner-principal.jpg')" }}

// Logos
<img src="/logos/logo-4ustudio.png" alt="4uStudio" />

// Iconos
<img src="/icons/play-icon.svg" alt="Play" />
```

## Consideraciones

- Mantén los archivos optimizados (comprime imágenes grandes)
- Usa PNG para logos y transparencias
- Prefiere SVG para iconos (escalable y ligero)
- Mantén nombres de archivos descriptivos y en minúsculas con guiones

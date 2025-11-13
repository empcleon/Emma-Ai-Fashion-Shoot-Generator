# Virtual Styling Composer (Emma AI)

![Demo GIF](docs/placeholder_demo.gif)

Descripción
Una aplicación web avanzada impulsada por la API de Google Gemini para crear sesiones de fotos de moda profesionales, gestionar un armario virtual y usar herramientas de IA para generación de imágenes, edición y creación de contenidos para e‑commerce (por ejemplo, listados en Vinted).

Características principales
- Generación de sesiones de fotos con IA a partir de: foto de modelo + imágenes de prenda (vistas frontal/trasera).
  - Tomas de cuerpo entero (frontal/trasera), primeros planos y editoriales.
  - Poses y encuadres optimizados para venta online.
  - Intercambio posterior de accesorios (ej. zapatos).
- Armario virtual: subir, categorizar y reutilizar prendas en nuevas sesiones.
- Personalización profunda: controlar fidelidad del modelo, ajustar largo/fit de la prenda, añadir accesorios.
- Asistente para vendedores (Vinted): análisis de medidas, generación de fotos, títulos, descripciones y hashtags optimizados.
- Estilista de IA: sugerencias de outfits y accesorios fotorrealistas.
- Analizador de imágenes: preguntar a Gemini sobre una foto concreta (estilo, combinaciones).
- PWA: capacidades offline básicas a través de service worker.

Pila tecnológica
- Frontend: React + TypeScript + Tailwind CSS
- Modelos IA: Google Gemini (ej. gemini-2.5-flash-image, gemini-2.5-flash) via API
- Formatos de assets: glTF (.glb) para futuros maniquíes y prendas 3D
- Deploy: Vercel / Netlify / GitHub Pages (según preferencia)

Estado y roadmap
- Estado actual: Prototipo / MVP
- Próxima gran feature: Maniquí 2.5D personalizado (crear maniquí a partir de medidas del usuario para try‑on hiperrealista).
- Ideas futuras: integración WebXR/AR, escaneo con cámara para medidas, optimización móvil y LOD para assets 3D.

Requisitos
- Node.js >= 16
- npm o yarn
- Clave de API válida para Google Gemini (GEMINI_API_KEY)

Instalación rápida
```bash
git clone https://github.com/empcleon/Emma-Ai-Fashion-Shoot-Generator.git
cd Emma-Ai-Fashion-Shoot-Generator
npm install
# o yarn install
```

Variables de entorno
- Crea un archivo .env.local (no subir a repo) con:
```env
GEMINI_API_KEY=<TU_GOOGLE_GEMINI_API_KEY>
```
Asegúrate de añadir .env* a .gitignore.

Ejecución local
```bash
npm run dev        # entorno de desarrollo
npm run build      # construir
npm run start      # servir producción (si aplica)
```

Estructura propuesta
- /public — index.html, assets estáticos
- /src — código React, componentes UI, hooks
  - /src/scene — lógica de render 3D / carga de glTF
  - /src/services — integraciones con Gemini/API
  - /src/pages — vistas principales (generador, armario, asistente Vinted)
- /docs — capturas, GIFs, specs
- README.md, package.json, .gitignore

Buenas prácticas para assets 3D
- Usar glTF/glb optimizados; aplicar Draco si es necesario.
- Texturas PBR 512–1024 px según prioridad de calidad / rendimiento.
- Añadir metadata JSON por asset con medidas y puntos de anclaje.

Seguridad / antes de publicar el repo
- Elimina claves y secretos de commits y del repo.
- Añade .gitignore incluyendo .env*.
- Si necesitas mantener privado algún asset, ponlo fuera del repo o en un storage privado.

Cómo contribuir
- Fork -> branch feature/<nombre> -> PR
- Sigue linters y formato (prettier/eslint)
- Abrir issue para features grandes

Licencia
- Añade la licencia que prefieras (ej. MIT o Apache-2.0). Actualmente no incluida.

Contacto
- Autor: empcleon
- Repo: https://github.com/empcleon/Emma-Ai-Fashion-Shoot-Generator

Notas finales
- Reemplaza el GIF de demo en docs/placeholder_demo.gif por una demo real.
- Puedo adaptar este README con los scripts reales de package.json y crear issues iniciales si quieres.
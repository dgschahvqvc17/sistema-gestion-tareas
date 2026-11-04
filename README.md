Diego gay# 🃏 PokéCards

Mini aplicación web para **crear y visualizar cartas coleccionables** estilo Pokémon. HTML, CSS y JavaScript, sin build. Los datos base viven en dos archivos JSON.

![HTML](https://img.shields.io/badge/HTML-5-e34f26?logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-3-1572b6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-f7df1e?logo=javascript&logoColor=black)

## ✨ Funcionalidades

- **Galería de cartas** con efecto hover, brillo holográfico para cartas Épicas y Legendarias.
- **Crear cartas**: nombre, tipo, PS, rareza, descripción, hasta 2 ataques y debilidad automática según el tipo.
- **Arte personalizado**: usa un emoji o sube una imagen desde tu equipo (se optimiza automáticamente) o pega una URL.
- **Filtros por tipo** y **búsqueda** por nombre o descripción.
- **Vista de detalle** al hacer clic en una carta y opción de eliminarla.
- **Persistencia local**: los datos base se leen de `data/cartas.json` y `data/configuracion.json`; las cartas creadas o eliminadas se guardan en `localStorage`.
- Incluye 6 cartas de ejemplo definidas en `data/cartas.json`.

## 🚀 Cómo usar

1. Descarga o clona el repositorio.
2. Instala las dependencias de desarrollo (servidor estático):

   ```bash
   npm install
   ```

3. Arranca el proyecto:

   ```bash
   npm run dev
   ```

4. Abre <http://localhost:5173> en tu navegador.
5. Pulsa **Nueva carta**, completa los datos y guarda.

> También puedes usar cualquier otro servidor estático, por ejemplo `python -m http.server 8080`.
>
> Si abres `index.html` con doble clic (`file://`), el navegador bloquea la lectura de los JSON y la app mostrará un aviso.

## 📁 Estructura

```
.
├── index.html            # Estructura y modales
├── styles.css            # Estilos, cartas, holografía y responsive
├── app.js                # Lógica, render, filtros y persistencia
├── data/
│   ├── cartas.json       # Cartas base de la colección
│   └── configuracion.json # Tipos, debilidades, rarezas y almacenamiento
└── README.md
```

## 🧠 Notas

- Las imágenes subidas se redimensionan a un máximo de 640 px para no llenar el almacenamiento del navegador.
- Las cartas de `data/cartas.json` son de solo lectura: si eliminas una, se recuerda en `localStorage` y no vuelve a aparecer.
- Las cartas creadas viven en el navegador donde las creaste; si borras los datos del sitio, se pierden.
- Tipos disponibles: Fuego, Agua, Planta, Eléctrico, Psíquico, Oscuro, Hada y Normal.

# 🃏 PokéCards

Mini aplicación web para **crear y visualizar cartas coleccionables** estilo Pokémon. Sin frameworks, sin dependencias y sin build: solo abre `index.html`.

![HTML](https://img.shields.io/badge/HTML-5-e34f26?logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-3-1572b6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-f7df1e?logo=javascript&logoColor=black)

## ✨ Funcionalidades

- **Galería de cartas** con efecto hover, brillo holográfico para cartas Épicas y Legendarias.
- **Crear cartas**: nombre, tipo, PS, rareza, descripción, hasta 2 ataques y debilidad automática según el tipo.
- **Arte personalizado**: usa un emoji o sube una imagen desde tu equipo (se optimiza automáticamente) o pega una URL.
- **Filtros por tipo** y **búsqueda** por nombre o descripción.
- **Vista de detalle** al hacer clic en una carta y opción de eliminarla.
- **Persistencia local**: tus cartas se guardan en `localStorage`, no hace falta servidor ni cuenta.
- Incluye 6 cartas de ejemplo para empezar.

## 🚀 Cómo usar

1. Descarga o clona el repositorio.
2. Abre `index.html` en tu navegador (doble clic).
3. Pulsa **Nueva carta**, completa los datos y guarda.

> También puedes servirlo con cualquier servidor estático:
>
> ```bash
> npx serve .
> # o
> python -m http.server 8080
> ```

## 📁 Estructura

```
.
├── index.html   # Estructura y modales
├── styles.css   # Estilos, cartas, holografía y responsive
├── app.js       # Lógica, render, filtros y persistencia
└── README.md
```

## 🧠 Notas

- Las imágenes subidas se redimensionan a un máximo de 640 px para no llenar el almacenamiento del navegador.
- Las cartas viven en el navegador donde las creaste; si borras los datos del sitio, se pierden.
- Tipos disponibles: Fuego, Agua, Planta, Eléctrico, Psíquico, Oscuro, Hada y Normal.

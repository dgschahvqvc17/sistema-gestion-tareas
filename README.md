# 🃏 PokéCards

Mini aplicación web para **crear y visualizar cartas coleccionables** estilo Pokémon. Sin frameworks ni dependencias. Los datos base viven en dos archivos JSON.

![HTML](https://img.shields.io/badge/HTML-5-e34f26?logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-3-1572b6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-f7df1e?logo=javascript&logoColor=black)

## ✨ Funcionalidades

- **Galería de cartas** con efecto hover, brillo holográfico para cartas Épicas y Legendarias.
- **Crear cartas**: nombre, tipo, PS, rareza, descripción, hasta 2 ataques y debilidad automática según el tipo.
- **Arte personalizado**: usa un emoji o sube una imagen desde tu equipo (se optimiza automáticamente) o pega una URL.
- **Filtros por tipo** y **búsqueda** por nombre o descripción.
- **Vista de detalle** al hacer clic en una carta, con opciones para **editarla** o eliminarla.
- **Persistencia local**: los datos base se leen de `data/cartas.json` y `data/configuracion.json`; las cartas creadas, editadas o eliminadas se guardan en `localStorage`.
- Incluye 6 cartas de ejemplo definidas en `data/cartas.json`.

## 🚀 Cómo usar

1. Descarga o clona el repositorio.
2. Abre `index.html` en tu navegador (doble clic). La app usa los respaldos `data/cartas.js` y `data/configuracion.js` para funcionar con `file://`.
3. Pulsa **Nueva carta**, completa los datos y guarda. Para cambiar una existente, abre su detalle y pulsa **Editar carta**.

> También puedes servirla con un servidor estático, y así leerá directamente los JSON:
>
> ```bash
> npx serve .
> # o
> python -m http.server 8080
> ```

## ✏️ Editar los datos

Las cartas y la configuración se editan en `data/cartas.json` y `data/configuracion.json`.

Si vas a abrir `index.html` con doble clic, regenera los respaldos después de cada cambio:

```bash
node scripts/build-data.js
```

## 📁 Estructura

```
.
├── index.html              # Estructura y modales
├── styles.css              # Estilos, cartas, holografía y responsive
├── app.js                  # Lógica, render, filtros y persistencia
├── data/
│   ├── cartas.json         # Cartas base de la colección
│   ├── configuracion.json  # Tipos, debilidades, rarezas y almacenamiento
│   ├── cartas.js           # Respaldo generado para file://
│   └── configuracion.js    # Respaldo generado para file://
├── scripts/
│   └── build-data.js       # Regenera los respaldos .js desde los JSON
└── README.md
```

## 🧠 Notas

- Las imágenes subidas se redimensionan a un máximo de 640 px para no llenar el almacenamiento del navegador.
- Las cartas de `data/cartas.json` son de solo lectura en el repositorio: si las editas o eliminas, el cambio se recuerda en `localStorage` y no modifica el JSON.
- Las cartas creadas o editadas viven en el navegador donde las hiciste; si borras los datos del sitio, se pierden.
- Tipos disponibles: Fuego, Agua, Planta, Eléctrico, Psíquico, Oscuro, Hada y Normal.

# Toolkit impactese: 12 herramientas de planificación

## Qué hay
- `toolkit/`: 12 HTML autocontenidos + `index.html`. Se abren con doble clic. Cada uno guarda en `localStorage` del navegador.
- `fuente/`: cómo se generan. `tools/NN-nombre.js` define cada herramienta (objeto `TOOL`), `core.js` es el motor compartido y `core.css` los estilos. `python3 build.py` regenera los HTML.

## Orden del programa
1 prioridades · 2 bcg · 3 pestel · 4 stakeholders · 5 identidad (misión/visión/manifiesto → enunciado de posicionamiento) · 6 matriz · 7 finanzas · 8 digital · 9 roi · 10 okr · 11 presupuesto · 12 plan

## Para la plataforma (pedido)
1. **Login por mail**, un espacio por fundación. Cada una ve solo su toolkit. Cecilia ve lo que la fundación decida compartir (botón "Compartir con impactese", con consentimiento explícito).
2. **Persistencia por usuario en servidor.** Hoy `core.js` usa dos funciones: `load()` y `persist()` (clave `impactese:<id>`). Reemplazarlas por lectura y escritura en la base, con el mismo JSON (`st`). El resto no cambia.
3. **Logo y look and feel.** El usuario sube su logo. Redimensionarlo (máx. ~512 px de ancho, PNG/SVG), extraer 2 colores dominantes y guardarlos. Inyectar en cada herramienta: logo en el encabezado y estos tokens en `:root`: `--blue` (color principal), `--red` (acento), `--blue-soft`/`--red-soft` (versiones suaves), `--f-d`/`--f-b` (tipografías). Los modos claro y oscuro ya están definidos por tokens. Verificar contraste mínimo AA al elegir colores.
4. **Quitar** el aviso "Tu trabajo se guarda en este navegador" del pie (en `shell()` de `core.js`) y reemplazarlo por el estado de guardado en servidor.
5. **Índice con avance** por fundación (qué pasos empezó o terminó).

## Pendientes conocidos
- Los umbrales de `finanzas` son reglas prácticas, no normas. Revisarlos con una contadora.
- El BCG es de 5 preguntas con reglas simples. No incluye la versión grupal con consenso que se usó con clientes.
- No hay contacto ni llamado a la consultoría en el índice.
- Los datos de ejemplo están marcados como ficticios. No dejar datos reales de clientes.

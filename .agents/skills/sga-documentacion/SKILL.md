---
name: sga-documentacion
description: Estándares de formato, convenciones de nombres, estructura de directorios y reglas de consistencia para toda la documentación Markdown en el Sistema Colegio San Diego (SGA).
---

# Estándares de Documentación General — SGA

Esta skill define las reglas de formato, convenciones de nomenclatura, organización de directorios y consistencia cruzada para toda la documentación en formato Markdown (`.md`) dentro del proyecto Colegio San Diego.

---

## 1. Organización del Directorio de Documentación (`docs/`)

Toda la documentación del proyecto debe ubicarse de manera organizada según su propósito en las siguientes rutas dentro del espacio de trabajo:

* **[docs/design/](file:///c:/Users/josem/Documents/San_Diego/sga/docs/design/)**: Contiene los documentos de diseño de arquitectura, diagramas (PlantUML), alcance y requisitos.
  * **[docs/design/alcance/](file:///c:/Users/josem/Documents/San_Diego/sga/docs/design/alcance/)**: Documentos de definición de alcance técnico y límites del sistema.
  * **[docs/design/requirements/](file:///c:/Users/josem/Documents/San_Diego/sga/docs/design/requirements/)**: Catálogo formal de Requisitos Funcionales (RF) y No Funcionales (RNF).
  * **[docs/design/mockups/](file:///c:/Users/josem/Documents/San_Diego/sga/docs/design/mockups/)**: Diseños de pantallas e interfaces de usuario históricas y de referencia.
  * **[docs/design/use-case-scenarios/](file:///c:/Users/josem/Documents/San_Diego/sga/docs/design/use-case-scenarios/)**: Detalle de escenarios, flujos principales y alternos de los casos de uso.
* **[docs/generated/](file:///c:/Users/josem/Documents/San_Diego/sga/docs/generated/)**: Contiene la documentación técnica generada automáticamente o reportes específicos de auditoría.
  * **[docs/generated/audits/](file:///c:/Users/josem/Documents/San_Diego/sga/docs/generated/audits/)**: Informes de auditoría técnica de bases de datos y backend.
  * **[docs/generated/api-docs/](file:///c:/Users/josem/Documents/San_Diego/sga/docs/generated/api-docs/)**: Especificaciones de endpoints, routers tRPC y servicios de red.
* **[docs/taks/](file:///c:/Users/josem/Documents/San_Diego/sga/docs/taks/)** *(carpeta del workspace con typo original)*: Contiene cronogramas de avance diario, tareas de desarrollo y checklists de control.

---

## 2. Estándares de Formato y Estilo en Markdown

Para asegurar la calidad estética y consistencia visual de los documentos, se deben seguir estrictamente estas reglas:

### Jerarquía de Encabezados (Headings)
* Usar un único encabezado `# Título Principal` (H1) al inicio de cada archivo.
* Estructurar el contenido usando subdivisiones lógicas con `##` (H2) y `###` (H3).

### Enlaces a Archivos y Código
* **Regla de Formato:** Todos los enlaces a archivos, carpetas o secciones de código deben declararse utilizando la sintaxis de markdown con el esquema absoluto `file:///` y barras diagonales (forward slashes), incluso bajo el sistema operativo Windows.
  * **Correcto:** `[Alcance](file:///c:/Users/josem/Documents/San_Diego/sga/docs/design/alcance/Alcance_Colegio_San_Diego_V6.md)`
  * **Incorrecto:** `[Alcance](../design/alcance/Alcance_Colegio_San_Diego_V6.md)` o enlace rodeado de comillas invertidas.
* No rodear el texto del enlace con comillas invertidas (`[` `text` `](...)`), ya que rompe la estilización y el renderizado nativo.

### Alertas Visuales (Callouts estilo GitHub)
Utilizar llamadas de atención para resaltar notas y advertencias importantes del negocio:
```markdown
> [!NOTE]
> Información complementaria, contexto de diseño o explicaciones adicionales.

> [!IMPORTANT]
> Reglas de negocio obligatorias, validaciones estrictas y restricciones del sistema.

> [!WARNING]
> Acciones de alto impacto, advertencias técnicas o dependencias que pueden romper el flujo.
```
* **Restricción:** No colocar alertas consecutivas o anidadas.

### Tablas y Bloques de Código
* Utilizar tablas Markdown de manera preferente para comparar requerimientos, matrices de permisos, planes de pago o cronogramas, asegurando la legibilidad.
* Todo código técnico debe estar delimitado por bloques de código con su respectivo identificador de lenguaje (ej. `typescript`, `prisma`, `json`, `markdown`, `puml`, `bash`).

---

## 3. Integridad y Consistencia de la Información

* **Sin Marcadores de Posición:** Queda terminantemente prohibido utilizar placeholders como `TODO`, `...`, `[Pendiente]` o secciones vacías en documentos oficiales o entregables. Toda regla o sección listada debe estar completamente descrita y fundamentada.
* **Consistencia Sincronizada (Regla de Oro):** Al modificar o agregar una regla de negocio o comportamiento del sistema, el agente tiene la obligación de actualizar en bloque y mantener la consistencia en los siguientes documentos:
  1. El documento de alcance activo bajo `docs/design/alcance/`.
  2. El catálogo de requisitos bajo `docs/design/requirements/`.
  3. Los informes de auditoría o tareas relacionados.
  4. El historial de cambios en el artefacto `walkthrough.md`.

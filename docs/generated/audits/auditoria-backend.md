# Auditoría de Cumplimiento del Backend — Colegio San Diego

Este documento presenta una auditoría técnica del estado actual del backend (`packages/back-end`) y de la base de datos (`schema.prisma`), evaluando su capacidad para dar cumplimiento a los nuevos requisitos funcionales acordados en el diseño.

---

## 🔍 Resumen General de Gaps

| Módulo / Funcionalidad | Requisito de Diseño | Estado en el Backend Actual | Gap Identificado | Gravedad |
| :--- | :--- | :--- | :--- | :---: |
| **Becas y Promociones** | Estructura matricial (Promoción × Nivel × Grado) y exclusión mutua de becas. | Columna fija `porcentaje` en modelo `Beca`. Sin validaciones de exclusividad. | El modelo de datos y la lógica no soportan porcentajes dinámicos por nivel/grado. | 🔥 **Crítico** |
| **Planes de Pago** | Inscripción express con generación automática de 10 o 12 adeudos (diciembre doble cubre julio). | La inscripción solo vincula al alumno. No hay generación automatizada de adeudos. | Falta la rutina de desglose de mensualidades según el plan contratado. | ⚡ **Alto** |
| **Conceptos Abiertos** | Concepto "Otros" para registrar cobros extraordinarios imprevistos. | Campo `concepto` es String libre en la base de datos y esquema Zod. | El límite de caracteres en la base de datos (`VarChar(15)` / `VarChar(25)`) es muy corto. | 🟢 **Menor** |
| **Convenios de Pago** | Registro de convenios por rezagos, consolidación de adeudos y congelamiento de recargos. | No existe entidad ni lógica para convenios en la base de datos ni servicios. | Falta el modelo `ConvenioPago`, endpoints de control y congelación de recargos. | 🔥 **Crítico** |
| **Restricción de Materias** | No permitir reinscripción si el alumno tiene materias reprobadas en ciclo previo. | El servicio de inscripción solo valida cupo y duplicados. | Falta validación académica de materias reprobadas (curricular, taller, club). | ⚡ **Alto** |
| **Reportes Financieros** | Consulta de ingresos mensuales y visualización de alumnos al corriente (pagados). | El repositorio filtra estáticamente por adeudos vencidos (`VENCIDO`). | Falta parametrizar el reporte de alumnos para listar estados de "Al Corriente" (PAGADO). | 🟡 **Medio** |

---

## 🛠️ Detalle Técnico por Componente

### 1. Catálogo de Becas y Promociones
* **Ficheros analizados:** [schema.prisma](file:///c:/Users/josem/Documents/San_Diego/sga/packages/data-access/prisma/schema.prisma) (líneas 561-576), [becas.schema.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/modules/becas/becas.schema.ts), [becas.service.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/modules/becas/becas.service.ts).
* **Hallazgos:**
  * El modelo `Beca` en Prisma define `porcentaje Decimal @db.Decimal(5,2)`.
  * La estructura Zod `createBecaSchema` define `porcentaje: z.number()`.
* **Solución requerida:**
  1. Modificar `schema.prisma` para admitir una columna `matrizPorcentajes Json?` que permita almacenar un diccionario/objeto con claves del tipo `"NivelId_Grado"` y valores con el porcentaje correspondiente.
  2. Ajustar `becas.schema.ts` para que valide esta estructura en Zod.
  3. Modificar `becas.service.ts` para que al asignar becas se compruebe la regla de exclusión de doble beneficio (el alumno no puede tener una promoción de inscripción si ya tiene beca de hermanos activa).

### 2. Generación Automatizada de Planes de Pago (Inscripción Express)
* **Ficheros analizados:** [inscripciones.service.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/modules/inscripciones/inscripciones.service.ts) (líneas 61-101), [pagos.repository.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/modules/pagos/pagos.repository.ts).
* **Hallazgos:**
  * Actualmente, la creación de una inscripción (`createInscripcion`) se limita a insertar la fila en `InscripcionCiclo`. No interactúa con `CalendarioPago` para pre-generar los adeudos.
* **Solución requerida:**
  1. Implementar un generador de adeudos en lote al confirmar la inscripción.
  2. Si el plan es **10 Meses**: Generar de forma atómica 10 registros de `CalendarioPago` por el valor mensual de la colegiatura.
  3. Si el plan es **12 Meses**: Generar 12 mensualidades eximiendo de cobro a Julio e incrementando la cuota de Diciembre al doble (equivalente a Colegiatura de Diciembre + Colegiatura de Julio).

### 3. Conceptos Abiertos ("Otros")
* **Ficheros analizados:** [schema.prisma](file:///c:/Users/josem/Documents/San_Diego/sga/packages/data-access/prisma/schema.prisma) (línea 401 en `Tarifa` y línea 468 en `CalendarioPago`), [pagos.schema.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/modules/pagos/pagos.schema.ts).
* **Hallazgos:**
  * El concepto es de tipo `String` libre, lo cual es correcto.
  * El límite físico en la base de datos es `@db.VarChar(15)` en tarifas y `@db.VarChar(25)` en adeudos.
* **Solución requerida:**
  1. Cambiar los límites en `schema.prisma` a `@db.VarChar(100)` para dar espacio a nombres detallados de conceptos imprevistos.
  2. Ajustar `zod` en `pagos.schema.ts` para reflejar el incremento de longitud.

### 4. Convenios de Pago
* **Ficheros analizados:** Todo el módulo de pagos.
* **Hallazgos:**
  * No existe soporte alguno en base de datos ni lógica para convenios de pago por escrito.
* **Solución requerida:**
  1. Crear la tabla `ConvenioPago` en `schema.prisma` con relaciones hacia `Tutor` (creador) y hacia `CalendarioPago` (los adeudos vinculados).
  2. Modificar el cobro automatizado de recargos por mora para verificar si el adeudo tiene un `convenioId` activo con fecha de compromiso en el futuro; de ser así, no aplicar el recargo de $400.00 MXN.

### 5. Regla de No Arrastre Académico
* **Ficheros analizados:** [inscripciones.service.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/modules/inscripciones/inscripciones.service.ts).
* **Hallazgos:**
  * `createInscripcion` no valida las calificaciones del alumno en el ciclo anterior.
* **Solución requerida:**
  1. Antes de autorizar la inscripción en un ciclo nuevo, realizar una consulta a la tabla `Calificacion` del alumno en el ciclo escolar anterior.
  2. Si existe al menos una calificación curricular/extracurricular menor a 6.0, o taller con estatus `NO_ACREDITADO`, lanzar una excepción tRPC impidiendo la inscripción.

### 6. Reportes Financieros Completo
* **Ficheros analizados:** [reportes.repository.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/modules/reportes/reportes.repository.ts) (líneas 4-20).
* **Hallazgos:**
  * El reporte de deudores está acoplado fijamente al estado `VENCIDO`.
* **Solución requerida:**
  1. Parametrizar la consulta en `getDeudores()` para poder filtrar por `estadoCobro` ('PAGADO' o 'VENCIDO') permitiendo generar reportes de alumnos al corriente.

---

### 7. Lógica de Activación de Ciclos Paralelos (RESUELTO)
* **Ficheros analizados:** [grupos.repository.ts](file:///c:/Users/josem/Documents/San_Diego/sga/packages/back-end/src/modules/grupos/grupos.repository.ts).
* **Hallazgos de Ingeniería Inversa:**
  * La activación de un ciclo escolar ejecutaba una desactivación global de todos los demás ciclos (`where: { activo: true }, data: { activo: false }`), impidiendo que un ciclo Anual y uno Semestral estuvieran activos en paralelo.
* **Corrección aplicada:**
  1. Se modificó `updateCicloActivo` en `packages/back-end/src/modules/grupos/grupos.repository.ts` para buscar primero la `periodicidad` del ciclo destino.
  2. Ahora se ejecuta la transacción desactivando únicamente los ciclos activos que correspondan a su misma periodicidad (`where: { activo: true, periodicidad }`).
  3. Esto permite la coexistencia de un ciclo Anual activo y un ciclo Semestral activo de forma simultánea sin conflictos operativos.


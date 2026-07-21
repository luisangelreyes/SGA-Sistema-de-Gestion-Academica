# Documentación de API - Módulo `reportes`

Este módulo se encarga de la generación de informes consolidados de control de deudores, flujos de ingresos financieros e historiales detallados de asistencia de estudiantes por grupos y periodos.

## Procedimientos

### Generación de Reportes

---

#### `reportes.reporteDeudores` (Query)
Obtiene una lista consolidada de todos los adeudos vencidos o pendientes en el sistema, detallando el nombre del alumno, matrícula, información de contacto de su tutor principal, concepto del adeudo, mes correspondiente, monto del adeudo y los días exactos de atraso desde la fecha de vencimiento.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**: Ninguno
- **Outputs**:
  ```typescript
  Array<{
    alumno: string;          // Nombre completo del alumno
    matricula: string | null; // Matrícula del alumno
    tutorPrincipal: string;   // Nombre del tutor principal
    telefonoTutor: string;    // Teléfono de contacto del tutor principal o 'N/A'
    concepto: string;         // Concepto del cobro (ej: 'Mensualidad Septiembre')
    mes: string;              // Mes correspondiente al adeudo
    montoAdeudo: number;      // Saldo pendiente por liquidar
    diasAtraso: number;       // Cantidad de días de retraso a partir del vencimiento
  }>
  ```

---

#### `reportes.reporteIngresos` (Query)
Genera el reporte de pagos registrados dentro de un rango de fechas. Provee información sobre la fecha de pago, alumno, tutor pagador, método de pago, monto total y el nombre del cajero/usuario que capturó la transacción.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    fechaInicio: string; // Formato ISO datetime (ej: '2026-07-01T00:00:00Z')
    fechaFin: string;    // Formato ISO datetime (ej: '2026-07-06T23:59:59Z')
  }
  ```
- **Outputs**:
  ```typescript
  Array<{
    pagoId: number;      // Identificador único del pago
    fecha: Date;         // Fecha en que se efectuó el cobro
    alumno: string;      // Nombre completo del alumno beneficiario
    tutor: string;       // Nombre completo del tutor que realizó el pago
    metodo: string;      // Método de pago (ej: 'EFECTIVO', 'TRANSFERENCIA')
    montoTotal: number;  // Monto total cobrado
    cajero: string;      // Nombre completo del usuario del sistema que registró el pago
  }>
  ```
- **Errores Posibles**:
  * `BAD_REQUEST`: Si las fechas de entrada no cumplen el formato ISO datetime de Zod.

---

#### `reportes.listaAsistencia` (Query)
Obtiene la lista oficial de asistencia de alumnos inscritos en un determinado grupo académico, permitiendo filtrar el registro histórico de faltas o asistencias por mes y año.

- **Nivel de Acceso**: Docente (`docentProcedure`)
- **Inputs**:
  ```typescript
  {
    grupoId: number;   // ID del grupo a consultar
    mes?: number;      // Opcional. Número de mes entre 1 y 12
    anio?: number;     // Opcional. Año entre 2000 y 2100
  }
  ```
- **Outputs**:
  ```typescript
  {
    totalAlumnos: number; // Cantidad de alumnos activos en el grupo
    alumnos: string[];    // Lista de nombres completos de los alumnos activos
    registroDetallado: Array<{
      asistenciaId: number;
      alumnoId: number;
      grupoId: number;
      materiaId: number | null;
      fecha: Date;
      estado: 'ASISTENCIA' | 'FALTA' | 'RETARDO' | 'JUSTIFICADO';
      observaciones: string | null;
    }>
  }
  ```
- **Errores Posibles**:
  * `BAD_REQUEST`: Si el mes o el año están fuera de los rangos válidos.

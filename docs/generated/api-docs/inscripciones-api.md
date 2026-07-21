# Documentación de API - Módulo `inscripciones`

Este es el módulo orquestador que matricula a los alumnos en ciclos escolares y coordina los planes de pago y las ventanas promocionales de reinscripción.

> [!NOTE]
> Todos los procedimientos en este módulo están restringidos al rol de gestor (`gestorProcedure`) y requieren un token de autenticación válido de un gestor o administrador del sistema.

## Procedimientos

### Planes de Pago (`plan_pago`)

---

#### `inscripciones.getPlanesPago` (Query)
Obtiene el catálogo de planes de pago (ej. 10 meses, 12 meses, pago anual) disponibles en la institución.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**: Ninguno
- **Outputs**:
  ```typescript
  Array<{
    planPagoId: number;
    nombre: string;
    descripcion: string | null;
    mesesPlazo: number;      // Número de meses a pagar
    montoMatricula: number;  // Costo de inscripción/matrícula
    montoMensualidad: number; // Costo por mensualidad ordinaria
    activo: boolean;
  }>
  ```

---

#### `inscripciones.createPlanPago` (Mutation)
Genera un nuevo plan de pago, indicando el número de meses, monto de matrícula y mensualidad.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    nombre: string;
    descripcion?: string;
    mesesPlazo: number;
    montoMatricula: number;
    montoMensualidad: number;
  }
  ```

---

#### `inscripciones.updatePlanPago` (Mutation)
Actualiza parcialmente las propiedades de un plan de pago.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    planPagoId: number;
    nombre?: string;
    descripcion?: string;
    mesesPlazo?: number;
    montoMatricula?: number;
    montoMensualidad?: number;
    activo?: boolean;
  }
  ```

---

#### `inscripciones.deletePlanPago` (Mutation)
Mantenimiento y soft delete de los planes de pago (aplica `eliminadoEn`).

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**: `planPagoId: number`

---

### Ventanas de Inscripción Temprana (`ventana_inscripcion_temprana`)

---

#### `inscripciones.getVentanas` (Query)
Trae las configuraciones de inscripciones tempranas. Esto es usado administrativamente para dar descuentos automáticos si el tutor inscribe al alumno en fechas especiales (ej. "Inscripciones en Febrero 20%").

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**: Ninguno
- **Outputs**:
  ```typescript
  Array<{
    ventanaId: number;
    nombre: string;
    fechaInicio: Date;
    fechaFin: Date;
    cicloId: number;
    becaId: number;
    beca: {
      nombre: string;
      porcentajeDescuento: number;
    }
  }>
  ```

---

#### `inscripciones.createVentana` (Mutation)
Crea el rango de fechas (`fechaInicio`, `fechaFin`) ligado a un `cicloId` y a una `becaId` de descuento automático.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    nombre: string;
    fechaInicio: string; // ISO Date String
    fechaFin: string;    // ISO Date String
    cicloId: number;
    becaId: number;
  }
  ```

---

#### `inscripciones.updateVentana` (Mutation)
Actualiza las fechas o propiedades de la ventana de inscripción.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    ventanaId: number;
    nombre?: string;
    fechaInicio?: string;
    fechaFin?: string;
    cicloId?: number;
    becaId?: number;
  }
  ```

---

#### `inscripciones.deleteVentana` (Mutation)
Desactivación y baja lógica (Soft Delete) de la ventana.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**: `ventanaId: number`

---

### Inscripciones a Ciclos (`inscripcion_ciclo`)

---

#### `inscripciones.getInscripciones` (Query)
Consulta el padrón de alumnos matriculados. Opcionalmente puede ser filtrado por un ciclo escolar específico (`cicloId`). Incluye detalles del alumno, el grupo y el plan de pago seleccionado.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    cicloId?: number; // Opcional
  }
  ```
- **Outputs**:
  ```typescript
  Array<{
    inscripcionId: number;
    alumnoId: number;
    cicloId: number;
    planPagoId: number;
    grupoId: number | null;
    fechaIngreso: Date;
    estadoEnCiclo: 'INSCRITO' | 'PREINSCRITO' | 'EGRESADO' | 'ANULADA';
    estadoFinanciero: 'AL_CORRIENTE' | 'CON_ADEUDO' | 'EXENTO';
    esIngresoTardio: boolean;
    alumno: {
      nombreCompleto: string;
    };
    grupo: {
      nombre: string;
    } | null;
    planPago: {
      nombre: string;
    };
  }>
  ```

---

#### `inscripciones.createInscripcion` (Mutation)
Realiza el alta/matrícula de un alumno en un ciclo escolar.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    alumnoId: number;
    cicloId: number;
    planPagoId: number;
    fechaIngreso: string; // ISO Date String
    grupoId?: number;     // Opcional
    estadoEnCiclo: 'INSCRITO' | 'PREINSCRITO' | 'EGRESADO' | 'ANULADA';
    estadoFinanciero: 'AL_CORRIENTE' | 'CON_ADEUDO' | 'EXENTO';
    esIngresoTardio?: boolean;
  }
  ```
- **Restricción Zod/Prisma**: Rechaza la solicitud (`BAD_REQUEST` o `CONFLICT`) si el estudiante ya se encontraba inscrito previamente en ese mismo ciclo, garantizando que un alumno no pueda tener inscripciones duplicadas en el mismo año escolar.

---

#### `inscripciones.updateInscripcion` (Mutation)
Actualiza detalles de la inscripción (ej. reasignación de grupo o cambio de estado financiero).

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    inscripcionId: number;
    planPagoId?: number;
    grupoId?: number | null;
    estadoEnCiclo?: 'INSCRITO' | 'PREINSCRITO' | 'EGRESADO' | 'ANULADA';
    estadoFinanciero?: 'AL_CORRIENTE' | 'CON_ADEUDO' | 'EXENTO';
    esIngresoTardio?: boolean;
  }
  ```

---

#### `inscripciones.deleteInscripcion` (Mutation)
"Anula" o cancela la inscripción aplicando un Soft Delete y cambiando el estado a `ANULADA`.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**: `inscripcionId: number`

## Manejo de Errores
- `BAD_REQUEST`: Duplicidad en la tabla (ej. alumno ya matriculado en ese ciclo) o inconsistencias de validación Zod.
- `NOT_FOUND`: Registro a actualizar o eliminar no existe o ya fue anulado.

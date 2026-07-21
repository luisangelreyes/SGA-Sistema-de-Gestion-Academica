# Documentación de API - Módulo `becas`

Este módulo se encarga del registro del catálogo de becas, la recepción de solicitudes, y el procesamiento transaccional de resoluciones y asignaciones directas (RF-27, RF-28, RF-29, RF-30, RF-31).

> [!NOTE]
> Todos los procedimientos en este módulo están restringidos al rol de gestor (`gestorProcedure`) y requieren un token de autenticación válido. Las operaciones extraen automáticamente el ID del usuario (`usuarioId`) del contexto para registrar la autoría en auditorías de la base de datos (campos como `solicitadaPor`, `resueltaPor`, `asignadaPor`).

## Procedimientos

### Catálogo de Becas (`beca`)

---

#### `becas.getBecas` (Query)
Retorna el listado de becas vigentes en la institución.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**: Ninguno
- **Outputs**:
  ```typescript
  Array<{
    becaId: number;
    nombre: string;
    descripcion: string | null;
    porcentajeDescuento: number; // Porcentaje de descuento (0 a 100)
    activo: boolean;
  }>
  ```

---

#### `becas.createBeca` (Mutation)
Genera una nueva beca en el catálogo.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    nombre: string;
    descripcion?: string;
    porcentajeDescuento: number; // Decimal o entero entre 0 y 100
  }
  ```
- **Outputs**:
  ```typescript
  {
    success: boolean;
    becaId: number;
  }
  ```

---

#### `becas.updateBeca` (Mutation)
Modifica parámetros de una beca del catálogo, como la descripción o el porcentaje a descontar.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    becaId: number;
    nombre?: string;
    descripcion?: string;
    porcentajeDescuento?: number;
    activo?: boolean;
  }
  ```
- **Outputs**:
  ```typescript
  {
    success: boolean;
  }
  ```

---

#### `becas.deleteBeca` (Mutation)
Soft Delete de una beca del catálogo.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**: `becaId: number`
- **Outputs**:
  ```typescript
  {
    success: boolean;
  }
  ```

---

### Solicitudes de Beca (`solicitud_beca`)

---

#### `becas.getSolicitudes` (Query)
Obtiene un histórico de las solicitudes de beca registradas. Permite opcionalmente filtrar por ciclo escolar y/o alumno. Retorna además información completa del Alumno, la Beca y los usuarios que solicitaron/resolvieron la petición.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    cicloId?: number;  // Opcional
    alumnoId?: number; // Opcional
  }
  ```
- **Outputs**:
  ```typescript
  Array<{
    solicitudId: number;
    alumnoId: number;
    becaId: number;
    cicloId: number;
    motivo: string;
    estado: 'ACTIVA' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';
    observaciones: string | null;
    observacionesResolucion: string | null;
    solicitadoPor: number;
    resueltaPor: number | null;
    registradoEn: Date;
    alumno: {
      nombreCompleto: string;
    };
    beca: {
      nombre: string;
      porcentajeDescuento: number;
    };
    solicitante: {
      nombreCompleto: string;
    };
    resolvente: {
      nombreCompleto: string;
    } | null;
  }>
  ```

---

#### `becas.createSolicitud` (Mutation)
Ingresa una solicitud de beca a revisión para un alumno en un ciclo escolar específico.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    alumnoId: number;
    becaId: number;
    cicloId: number;
    motivo: string;
    observaciones?: string;
  }
  ```
- **Outputs**:
  ```typescript
  {
    success: boolean;
    solicitudId: number;
  }
  ```
- **Validación Especial**: Prisma rechaza internamente (`BAD_REQUEST` o `CONFLICT`) la solicitud si el alumno ya tiene una solicitud pendiente de revisión (`ACTIVA`) para esa misma beca en ese mismo ciclo.

---

#### `becas.resolverSolicitud` (Mutation)
Dictamina si una solicitud es aprobada o rechazada.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    solicitudId: number;
    aprobar: boolean; // Si es true, aprueba; si es false, rechaza.
    observacionesResolucion?: string;
  }
  ```
- **Outputs**:
  ```typescript
  {
    success: boolean;
  }
  ```
- **Comportamiento Transaccional**: Si `aprobar` es `true`, además de cambiar el estado de la solicitud a `APROBADA`, Prisma ejecutará en la misma transacción la inserción automática de un registro en `asignacion_beca` en el perfil del estudiante para el ciclo escolar correspondiente.

---

### Asignaciones (`asignacion_beca`)

---

#### `becas.assignBeca` (Mutation)
Provee una forma directa (sin mediación de solicitud) de asignarle inmediatamente un descuento a un estudiante para un ciclo escolar.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    alumnoId: number;
    becaId: number;
    cicloId: number;
    motivo?: string;
  }
  ```
- **Outputs**:
  ```typescript
  {
    success: boolean;
    asignacionId: number;
  }
  ```

## Manejo de Errores
- `BAD_REQUEST`: Duplicidad de solicitudes en el mismo ciclo, o si se intenta resolver una solicitud que ya estaba resuelta.
- `NOT_FOUND`: Si la solicitud referenciada no se encuentra o ya fue dada de baja.

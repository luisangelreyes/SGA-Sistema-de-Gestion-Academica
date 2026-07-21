# Documentación de API - Módulo `alumnos`

Este módulo maneja el registro y administración de los alumnos inscritos en la institución educativa, así como la vinculación relacional con sus tutores. Cubre las funcionalidades correspondientes a RF-20, RF-23 y RF-25.

> [!NOTE]
> Todos los procedimientos en este módulo están restringidos y requieren un token de autenticación. Las consultas son accesibles para personal docente y administrativo, mientras que la creación, actualización y baja de registros requieren privilegios de gestor o administrador. Las bajas (`delete`) ejecutan un Soft Delete marcando la fecha actual en la columna `eliminadoEn` y cambiando el estado a `BAJA_DEFINITIVA`.

## Procedimientos

### Alumnos (`alumno`)

---

#### `alumnos.getAll` (Query)
Obtiene una lista de todos los alumnos activos, ordenados por nombre completo. Incluye la información del nivel educativo al que pertenecen y un anidado de los tutores vinculados.

- **Nivel de Acceso**: Docente (`docentProcedure`)
- **Inputs**: Ninguno
- **Outputs**:
  ```typescript
  Array<{
    alumnoId: number;
    nombreCompleto: string;
    matricula: string | null;
    curp: string;
    fechaNacimiento: Date;
    sexo: string;
    estado: 'ACTIVO' | 'BAJA_DEFINITIVA' | 'BAJA_TEMPORAL' | 'EGRESADO' | 'TRANSICION_PENDIENTE';
    nivelId: number;
    diaLimitePago: number;
    nivelEducativo: {
      nombre: string;
    };
    tutoresAlumnos: Array<{
      tutor: {
        tutorId: number;
        nombreCompleto: string;
      }
    }>
  }>
  ```

---

#### `alumnos.getById` (Query)
Obtiene todo el expediente del alumno a través del `alumnoId`. Incluye nivel educativo, historial de inscripciones, y el listado de tutores con sus respectivos datos fiscales si cuentan con ellos.

- **Nivel de Acceso**: Docente (`docentProcedure`)
- **Inputs**: `alumnoId: number` (debe ser un entero positivo)
- **Outputs**:
  ```typescript
  {
    alumnoId: number;
    nombreCompleto: string;
    matricula: string | null;
    curp: string;
    fechaNacimiento: Date;
    sexo: string;
    estado: 'ACTIVO' | 'BAJA_DEFINITIVA' | 'BAJA_TEMPORAL' | 'EGRESADO' | 'TRANSICION_PENDIENTE';
    nivelId: number;
    diaLimitePago: number;
    nivelEducativo: {
      nombre: string;
    };
    tutoresAlumnos: Array<{
      tutor: {
        tutorId: number;
        nombreCompleto: string;
        datosFiscales: {
          rfc: string;
          razonSocial: string;
        } | null
      }
    }>;
    inscripciones: Array<{
      inscripcionId: number;
      cicloId: number;
      cicloEscolar: {
        nombre: string;
      }
    }>
  }
  ```

---

#### `alumnos.create` (Mutation)
Inscribe un nuevo alumno en la base de datos.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    matricula?: string | null;
    curp: string;           // 18 caracteres exactos
    nombreCompleto: string; // Mínimo 10, máximo 120 caracteres
    fechaNacimiento: string; // ISO Date String
    sexo: string;           // 1 carácter ('M' / 'F')
    nivelId: number;
    estado: 'ACTIVO' | 'BAJA_DEFINITIVA' | 'BAJA_TEMPORAL' | 'EGRESADO' | 'TRANSICION_PENDIENTE';
    diaLimitePago: number;  // Entero entre 1 y 31
    observaciones?: string;
  }
  ```
- **Outputs**:
  ```typescript
  {
    success: boolean;
    alumnoId: number;
  }
  ```
- **Validación Especial**: El servidor rechazará (`BAD_REQUEST` o `CONFLICT`) la solicitud si el CURP o la matrícula ya existen en otro alumno.

---

#### `alumnos.update` (Mutation)
Modifica el expediente del alumno. Además de los campos estándar, permite documentar una `fechaBaja` y un `motivoBaja` temporal o definitivo.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    alumnoId: number;
    matricula?: string | null;
    curp?: string;
    nombreCompleto?: string;
    fechaNacimiento?: string;
    sexo?: string;
    nivelId?: number;
    estado?: 'ACTIVO' | 'BAJA_DEFINITIVA' | 'BAJA_TEMPORAL' | 'EGRESADO' | 'TRANSICION_PENDIENTE';
    diaLimitePago?: number;
    fechaBaja?: string | null;
    motivoBaja?: string | null;
    observaciones?: string;
  }
  ```
- **Outputs**:
  ```typescript
  {
    success: boolean;
    alumnoId: number;
  }
  ```

---

#### `alumnos.delete` (Mutation)
Desactiva a un alumno, pasándolo a estado `BAJA_DEFINITIVA` y aplicando el Soft Delete en el campo `eliminadoEn`.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**: `alumnoId: number`
- **Outputs**:
  ```typescript
  {
    success: boolean;
  }
  ```

---

### Relación Alumno - Tutor (`tutor_alumno`)

---

#### `alumnos.linkTutor` (Mutation)
Vincula a un tutor ya existente con un alumno.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    alumnoId: number;
    tutorId: number;
    parentesco: string;
    esPrincipal: boolean;
  }
  ```
- **Comportamiento**: Si se define `esPrincipal: true`, el sistema revoca internamente esa bandera a cualquier otro tutor asociado al mismo alumno, garantizando la consistencia de que solo exista un tutor principal. Si la relación ya existía (ej. se había borrado o se modificó el parentesco), se realiza un *upsert* actualizando el registro.

---

#### `alumnos.unlinkTutor` (Mutation)
Desvincula a un tutor de un alumno (Hard Delete en la tabla pivote).

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    tutorAlumnoId: number;
  }
  ```
- **Outputs**:
  ```typescript
  {
    success: boolean;
  }
  ```

## Manejo de Errores
- `BAD_REQUEST`: Duplicidad de identificadores únicos (CURP/Matrícula) o inputs inválidos por Zod.
- `NOT_FOUND`: El alumno solicitado no existe o fue eliminado.
- `UNAUTHORIZED`: Fallo de sesión o falta de roles.

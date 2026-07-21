# Documentación de API - Módulo `grupos`

Este módulo gestiona la estructura académica principal de la institución, la cual abarca los Niveles Educativos, los Ciclos Escolares, las Materias y los Grupos, así como la asignación de materias (y docentes opcionales) a cada grupo.

> [!NOTE]
> Todos los procedimientos en este módulo están restringidos y requieren un token de autenticación. Las consultas generales están abiertas para el rol docente (`docentProcedure`), mientras que las mutaciones de creación, actualización y baja física/lógica requieren privilegios del rol de gestor (`gestorProcedure`). Las eliminaciones de entidades académicas principales ejecutan un Soft Delete marcando la fecha actual en la columna `eliminadoEn`.

## Procedimientos

### Niveles Educativos (`nivel_educativo`)

---

#### `grupos.getNiveles` (Query)
Retorna todos los niveles educativos activos, ordenados de forma ascendente por su columna `orden`.

- **Nivel de Acceso**: Docente (`docentProcedure`)
- **Inputs**: Ninguno
- **Outputs**:
  ```typescript
  Array<{
    nivelId: number;
    nombre: string;
    codigo: string;
    rvoe: string | null;
    orden: number;
  }>
  ```

---

#### `grupos.createNivel` (Mutation)
Crea un nivel educativo (ej. Preescolar, Primaria).

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    nombre: string;
    codigo: string;
    rvoe?: string;
    orden: number;
  }
  ```
- **Outputs**:
  ```typescript
  {
    success: boolean;
    nivelId: number;
  }
  ```

---

#### `grupos.updateNivel` (Mutation)
Actualiza nombre, código, RVOE o el orden de un nivel educativo.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    nivelId: number;
    nombre?: string;
    codigo?: string;
    rvoe?: string | null;
    orden?: number;
  }
  ```

---

#### `grupos.deleteNivel` (Mutation)
Marca el nivel como eliminado lógicamente (Soft Delete).

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**: `nivelId: number`

---

### Ciclos Escolares (`ciclo_escolar`)

---

#### `grupos.getCiclos` (Query)
Obtiene todos los ciclos escolares ordenados por fecha de inicio descendente.

- **Nivel de Acceso**: Docente (`docentProcedure`)
- **Inputs**: Ninguno
- **Outputs**:
  ```typescript
  Array<{
    cicloId: number;
    nombre: string;
    fechaInicio: Date;
    fechaFin: Date;
    activo: boolean;
  }>
  ```

---

#### `grupos.createCiclo` (Mutation)
Crea un nuevo ciclo escolar.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    nombre: string;
    fechaInicio: string; // ISO Date String
    fechaFin: string;    // ISO Date String
    activo?: boolean;
  }
  ```
- **Outputs**: Retorna error si las fechas son inválidas (ej. fecha de fin anterior a inicio).

---

#### `grupos.updateCiclo` (Mutation)
Actualiza la información del ciclo escolar.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    cicloId: number;
    nombre?: string;
    fechaInicio?: string;
    fechaFin?: string;
    activo?: boolean;
  }
  ```
- **Comportamiento Especial**: Si se envía `activo: true`, el servidor ejecuta una transacción que automáticamente marca todos los demás ciclos de la base de datos como `activo: false`.

---

#### `grupos.deleteCiclo` (Mutation)
Soft delete de un ciclo escolar.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**: `cicloId: number`

---

### Materias (`materia`)

---

#### `grupos.getMaterias` (Query)
Obtiene el catálogo de materias vigentes.

- **Nivel de Acceso**: Docente (`docentProcedure`)
- **Inputs**: Ninguno
- **Outputs**:
  ```typescript
  Array<{
    materiaId: number;
    nombre: string;
    clave: string;
  }>
  ```

---

#### `grupos.createMateria` (Mutation)
Registra una nueva materia en el catálogo de la institución.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    nombre: string;
    clave: string;
  }
  ```

---

#### `grupos.updateMateria` (Mutation)
Actualiza la información básica de la materia (nombre, clave).

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    materiaId: number;
    nombre?: string;
    clave?: string;
  }
  ```

---

#### `grupos.deleteMateria` (Mutation)
Soft delete de la materia seleccionada.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**: `materiaId: number`

---

### Grupos (`grupo`)

---

#### `grupos.getGrupos` (Query)
Obtiene los grupos activos. Opcionalmente acepta un filtro por `cicloId`. Incluye las relaciones de `NivelEducativo`, `CicloEscolar` y las materias asignadas a través de `GrupoMateria`.

- **Nivel de Acceso**: Docente (`docentProcedure`)
- **Inputs**:
  ```typescript
  {
    cicloId?: number; // Opcional
  }
  ```
- **Outputs**:
  ```typescript
  Array<{
    grupoId: number;
    nombre: string;
    cupoMaximo: number;
    nivelId: number;
    cicloId: number;
    nivelEducativo: {
      nombre: string;
    };
    cicloEscolar: {
      nombre: string;
    };
    gruposMaterias: Array<{
      grupoMateriaId: number;
      materia: {
        nombre: string;
      };
      docente: {
        nombreCompleto: string;
      } | null;
    }>;
  }>
  ```

---

#### `grupos.createGrupo` (Mutation)
Registra un nuevo grupo en un nivel y ciclo determinados.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    nombre: string;
    cupoMaximo: number;
    nivelId: number;
    cicloId: number;
  }
  ```

---

#### `grupos.updateGrupo` (Mutation)
Modifica el nombre o el cupo máximo de un grupo existente.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    grupoId: number;
    nombre?: string;
    cupoMaximo?: number;
  }
  ```

---

#### `grupos.deleteGrupo` (Mutation)
Soft delete del grupo académico.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**: `grupoId: number`

---

### Asignaciones (`grupo_materia`)

---

#### `grupos.assignMateria` (Mutation)
Asigna una materia del catálogo a un grupo escolar específico. Opcionalmente puede recibir el `docenteId` (ID del usuario) si se le asigna de inmediato un profesor.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    grupoId: number;
    materiaId: number;
    docenteId?: number; // Opcional (ID del usuario docente)
  }
  ```

---

#### `grupos.unassignMateria` (Mutation)
Elimina la asignación de la materia al grupo (Hard Delete en la tabla pivote).

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    grupoMateriaId: number;
  }
  ```

## Manejo de Errores
- `BAD_REQUEST`: Si Zod rechaza el payload (ej. cadena vacía, o ID negativo).
- `UNAUTHORIZED`: Fallo de validación del token de sesión o falta de privilegios.
- `NOT_FOUND`: Si el grupo, ciclo o materia no existen.

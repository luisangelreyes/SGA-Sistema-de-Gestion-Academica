# Documentación de API - Módulo `calificaciones`

Este módulo se encarga del registro, actualización y consulta de las evaluaciones de los estudiantes, tanto numéricas como cualitativas (RF-33, RF-34). 

> [!NOTE]
> Todos los procedimientos en este módulo están restringidos bajo el rol docente (`docentProcedure`) y requieren un token de autenticación válido de un docente, gestor o administrador. El ID del usuario (`usuarioId`) se extrae automáticamente del contexto del token para registrar la autoría del docente que sube o modifica calificaciones.

## Procedimientos

### Calificaciones (`calificacion`)

---

#### `calificaciones.getPorGrupo` (Query)
Consulta diseñada para la vista de captura del docente. Permite obtener todas las calificaciones de un grupo en una materia específica (`grupoMateriaId`), opcionalmente filtradas por periodo. Los alumnos inactivos son ignorados de la lista.

- **Nivel de Acceso**: Docente (`docentProcedure`)
- **Inputs**:
  ```typescript
  {
    grupoMateriaId: number;
    periodoId?: number; // Opcional
  }
  ```
- **Outputs**:
  ```typescript
  Array<{
    calificacionId: number;
    alumnoId: number;
    periodoId: number;
    grupoMateriaId: number;
    valorNumerico: number | null;
    valorCualitativo: string | null;
    textoObservacion: string | null;
    textoRecomendacion: string | null;
    registradoPor: number;
    registradoEn: Date;
    alumno: {
      nombreCompleto: string;
    }
  }>
  ```

---

#### `calificaciones.getPorAlumno` (Query)
Consulta diseñada para tutores o control escolar. Trae el kárdex completo del alumno, ordenado por ciclo escolar, periodo y nombre de la materia.

- **Nivel de Acceso**: Docente (`docentProcedure`)
- **Inputs**:
  ```typescript
  {
    alumnoId: number;
  }
  ```
- **Outputs**:
  ```typescript
  Array<{
    calificacionId: number;
    periodoId: number;
    grupoMateriaId: number;
    valorNumerico: number | null;
    valorCualitativo: string | null;
    periodo: {
      nombre: string;
    };
    grupoMateria: {
      materia: {
        nombre: string;
      }
    }
  }>
  ```

---

#### `calificaciones.upsert` (Mutation)
Inserta o actualiza una calificación de un alumno.

- **Nivel de Acceso**: Docente (`docentProcedure`)
- **Inputs**:
  ```typescript
  {
    alumnoId: number;
    grupoMateriaId: number;
    periodoId: number;
    tipoEvaluacion: 'PARCIAL' | 'BIMESTRE' | 'BLOQUE' | 'TRIMESTRE';
    valorNumerico?: number | null;   // Máximo 10
    valorCualitativo?: string | null; // Opcional
    textoObservacion?: string;       // Opcional
    textoRecomendacion?: string;     // Opcional
    cuentaParaPromedio?: boolean;    // Opcional, por defecto true
  }
  ```
- **Validación Especial (Zod)**: Se exige que por lo menos se envíe un `valorNumerico` o un `valorCualitativo` (ambos en null no está permitido).
- **Comportamiento Lógico**: El sistema busca si ya existe un registro de calificación para ese mismo alumno en ese mismo periodo, materia y tipo de evaluación. Si existe, hace un `update`; si no, hace un `create`.

---

#### `calificaciones.delete` (Mutation)
Elimina de manera permanente (Hard Delete) una calificación que fue capturada accidentalmente, ya que la tabla `Calificacion` no maneja Soft Delete por diseño.

- **Nivel de Acceso**: Docente (`docentProcedure`)
- **Inputs**:
  ```typescript
  {
    calificacionId: number;
  }
  ```
- **Outputs**:
  ```typescript
  {
    success: boolean;
  }
  ```

---

#### `calificaciones.generarBoletaCiclo` (Query)
Genera la boleta consolidada de un alumno en un ciclo escolar específico, incluyendo promedios parciales y finales.

- **Nivel de Acceso**: Docente (`docentProcedure`)
- **Inputs**:
  ```typescript
  {
    alumnoId: number;
    cicloId: number;
  }
  ```
- **Outputs**:
  ```typescript
  {
    alumno: {
      nombreCompleto: string;
      matricula: string | null;
    };
    ciclo: {
      nombre: string;
    };
    materias: Array<{
      materiaId: number;
      nombre: string;
      calificaciones: Array<{
        periodo: string;
        valor: number | string;
      }>;
      promedioFinal: number;
    }>;
    promedioGeneral: number;
  }
  ```

---

#### `calificaciones.obtenerKardexCompleto` (Query)
Obtiene el historial académico completo de un alumno para todos los ciclos escolares cursados en la institución.

- **Nivel de Acceso**: Docente (`docentProcedure`)
- **Inputs**:
  ```typescript
  {
    alumnoId: number;
  }
  ```
- **Outputs**:
  ```typescript
  Array<{
    ciclo: string;
    promedioCiclo: number;
    materias: Array<{
      materia: string;
      promedioFinal: number;
    }>
  }>
  ```

## Manejo de Errores
- `BAD_REQUEST`: Valores que no cumplen con los esquemas de Zod (ej. enviar `valorNumerico` y `valorCualitativo` en null, o exceder la escala).
- `NOT_FOUND`: Si el alumno no existe o fue dado de baja, o si la materia no está ligada a un grupo.
- `UNAUTHORIZED`: Fallo de validación del token de sesión.

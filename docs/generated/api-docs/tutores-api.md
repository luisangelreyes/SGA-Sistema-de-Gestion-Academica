# Documentación de API - Módulo `tutores`

Este módulo maneja el registro y administración de los tutores (padres o responsables de los alumnos), así como su información fiscal requerida para facturación (RF-18, RF-19, RF-21).

> [!NOTE]
> Todos los procedimientos en este módulo están restringidos y requieren un token de autenticación. Las consultas generales están abiertas para el rol docente (`docentProcedure`), mientras que las mutaciones de creación, actualización y baja física/lógica requieren privilegios del rol de gestor (`gestorProcedure`). Las eliminaciones (`delete`) ejecutan un Soft Delete marcando la fecha actual en la columna `eliminadoEn`.

## Procedimientos

### Tutores (`tutor` y `datos_fiscales`)

---

#### `tutores.getAll` (Query)
Retorna todos los tutores activos en el sistema, ordenados alfabéticamente. Incluye sus datos fiscales (si los tienen).

- **Nivel de Acceso**: Docente (`docentProcedure`)
- **Inputs**: Ninguno
- **Outputs**:
  ```typescript
  Array<{
    tutorId: number;
    nombreCompleto: string;
    correoElectronico: string | null;
    telefono: string | null;
    direccion: string | null;
    curp: string | null;
    requiereFactura: boolean;
    tipoPagoHabitual: string | null;
    saldoAFavor: number;
    datosFiscales: {
      datosFiscalesId: number;
      rfc: string;
      razonSocial: string;
      regimenFiscal: string;
      codigoPostal: string;
      correoFacturacion: string | null;
    } | null
  }>
  ```

---

#### `tutores.getById` (Query)
Obtiene la información detallada de un tutor a través de su `tutorId`. Incluye sus datos fiscales y la lista de alumnos que tiene asignados (relación `tutores_alumnos`).

- **Nivel de Acceso**: Docente (`docentProcedure`)
- **Inputs**: `tutorId: number` (debe ser un entero positivo)
- **Outputs**:
  ```typescript
  {
    tutorId: number;
    nombreCompleto: string;
    correoElectronico: string | null;
    telefono: string | null;
    direccion: string | null;
    curp: string | null;
    requiereFactura: boolean;
    tipoPagoHabitual: string | null;
    saldoAFavor: number;
    datosFiscales: {
      datosFiscalesId: number;
      rfc: string;
      razonSocial: string;
      regimenFiscal: string;
      codigoPostal: string;
      correoFacturacion: string | null;
    } | null;
    tutoresAlumnos: Array<{
      alumno: {
        alumnoId: number;
        nombreCompleto: string;
        matricula: string | null;
      }
    }>
  }
  ```
- **Errores Posibles**:
  - `NOT_FOUND`: Si el tutor solicitado no existe o fue eliminado lógicamente.

---

#### `tutores.create` (Mutation)
Registra a un nuevo tutor en la plataforma y opcionalmente asocia sus datos fiscales iniciales.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    nombreCompleto: string;
    correoElectronico?: string | null;
    telefono?: string | null;
    direccion?: string | null;
    curp?: string | null;
    requiereFactura: boolean;
    tipoPagoHabitual?: string | null;
    datosFiscales?: {
      rfc: string;
      razonSocial: string;
      regimenFiscal: string;
      codigoPostal: string;
      correoFacturacion?: string | null;
    } | null;
  }
  ```
- **Outputs**:
  ```typescript
  {
    success: boolean;
    tutorId: number;
  }
  ```
- **Validación Especial**: Si se envía `requiereFactura: true`, pero no se proporciona el bloque `datosFiscales`, el servidor rechazará la solicitud devolviendo un `BAD_REQUEST`.

---

#### `tutores.update` (Mutation)
Modifica la información de un tutor o de sus datos fiscales asociados.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**: Mismo esquema de creación, pero de forma parcial (`Partial`), incluyendo obligatoriamente el `tutorId` para identificar el registro.
- **Comportamiento**: Si se envían `datosFiscales`, el servidor ejecutará internamente un `upsert` (los crea si no existían, o los actualiza si el tutor ya los poseía). También valida la misma regla de que no se puede habilitar `requiereFactura` si no existen o se proveen datos fiscales correctos.

---

#### `tutores.delete` (Mutation)
Da de baja a un tutor aplicando un Soft Delete en la columna `eliminadoEn`.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**: `tutorId: number` (entero positivo)
- **Outputs**:
  ```typescript
  {
    success: boolean;
  }
  ```
- **Validación Especial**: Rechaza la eliminación (`BAD_REQUEST`) si el tutor mantiene un monedero con `saldoAFavor` activo (mayor a 0), debiendo el gestor liquidar o vaciar el saldo antes de dar de baja.

## Manejo de Errores
- `BAD_REQUEST`: Cuando no se cumplen las reglas de negocio (ej. Facturación sin datos, validaciones de Zod, intentar eliminar con saldo a favor).
- `NOT_FOUND`: Cuando el tutor solicitado no existe o fue eliminado lógicamente.
- `UNAUTHORIZED`: Fallo de validación del token de sesión.

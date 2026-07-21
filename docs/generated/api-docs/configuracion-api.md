# Documentación de API - Módulo `configuracion`

Este módulo permite gestionar la configuración global del sistema, como los recargos, periodos de inscripción y umbrales de alerta (RF-90, RF-91).

## Procedimientos

### Configuración Global del Sistema (`configuracion`)

---

#### `configuracion.get` (Query)
Obtiene la configuración global actual del sistema. Si aún no existe, la inicializa con los valores por defecto (ej. recargo de $400, 5 días de gracia, 60 días de plazo para inscripciones).

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**: Ninguno
- **Outputs**:
  ```typescript
  {
    configuracionId: number;
    montoRecargoDefecto: number;
    diasGraciaRecargo: number;
    plazoInscripcionDias: number;
    umbralesSmtpDias: number[];
    actualizadoEn: Date | null;
  }
  ```
- **Errores Posibles**:
  - `UNAUTHORIZED`: Si el token es inválido, expiró o no cuenta con los roles correspondientes de gestor o administrador.

---

#### `configuracion.update` (Mutation)
Actualiza parcialmente los valores de la configuración global del sistema. Solo los parámetros que se incluyan en el payload serán modificados.

- **Nivel de Acceso**: Administrador (`adminProcedure`)
- **Inputs** (todos opcionales, pero validados):
  ```typescript
  {
    montoRecargoDefecto?: number;   // >= 0
    diasGraciaRecargo?: number;     // Entero >= 0
    plazoInscripcionDias?: number;  // Entero >= 1
    umbralesSmtpDias?: number[];    // Máximo 5 umbrales (enteros >= 0)
  }
  ```
- **Outputs**:
  ```typescript
  {
    configuracionId: number;
    montoRecargoDefecto: number;
    diasGraciaRecargo: number;
    plazoInscripcionDias: number;
    umbralesSmtpDias: number[];
    actualizadoEn: Date | null;
  }
  ```
- **Errores Posibles**:
  - `BAD_REQUEST`: Si los valores de entrada no cumplen las reglas de validación (por ejemplo, números negativos o demasiados umbrales SMTP).
  - `UNAUTHORIZED`: Si el token es inválido o no cuenta con el rol de administrador.
  - `INTERNAL_SERVER_ERROR`: Si falla la actualización en la base de datos.

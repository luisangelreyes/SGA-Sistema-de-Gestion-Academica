# Documentación de API - Módulo `auditoria`

Este módulo se encarga del registro y visualización de los logs de auditoría generados por las acciones del personal administrativo y docente en la base de datos (por ejemplo, creación de alumnos, cobros de colegiaturas, modificaciones de calificaciones, etc.).

> [!NOTE]
> Todos los procedimientos de este módulo están protegidos bajo el procedimiento administrativo (`adminProcedure`) y requieren un token de autenticación que posea el rol de administrador.

## Procedimientos

### Consulta de Logs (`log_auditoria`)

---

#### `auditoria.obtenerLogs` (Query)
Retorna el historial de logs de auditoría del sistema de manera paginada. Permite filtrar la búsqueda por usuario, tabla modificada, acción realizada y un rango de fechas.

- **Nivel de Acceso**: Administrador (`adminProcedure`)
- **Inputs**:
  ```typescript
  {
    pagina?: number;       // Entero >= 1 (por defecto 1)
    limite?: number;       // Entero entre 1 y 100 (por defecto 50)
    usuarioId?: number;    // Opcional. Filtra los logs ejecutados por este usuario
    tablaAfectada?: string; // Opcional. Filtra por el nombre de la tabla (ej: 'Alumno', 'Pago')
    accion?: string;        // Opcional. Filtra por acción ejecutada (ej: 'CREATE', 'UPDATE', 'DELETE')
    fechaInicio?: string;   // Opcional. String en formato ISO datetime (ej: '2026-07-06T19:07:16Z')
    fechaFin?: string;      // Opcional. String en formato ISO datetime (ej: '2026-07-06T20:00:00Z')
  }
  ```
- **Outputs**:
  ```typescript
  {
    data: Array<{
      logId: string;           // ID del log convertido a string (evita desbordamientos de BigInt)
      usuarioId: number;       // ID del usuario que realizó la acción
      accion: string;          // Tipo de acción realizada
      tablaAfectada: string;   // Nombre de la tabla de la base de datos
      registroId: number;      // ID del registro afectado en la tabla
      valoresAnteriores: string | null; // Objeto JSON serializado con el estado previo
      valoresNuevos: string | null;     // Objeto JSON serializado con el nuevo estado
      fechaHora: Date;         // Fecha y hora en la que se ejecutó la acción
      ip: string;              // Dirección IP del cliente
      userAgent: string;       // Agente de usuario del cliente
      usuario: {
        nombreCompleto: string; // Nombre del usuario que realizó la acción
      }
    }>;
    meta: {
      total: number;
      pagina: number;
      limite: number;
      totalPaginas: number;
    }
  }
  ```

- **Errores Posibles**:
  * `BAD_REQUEST`: Si las fechas proporcionadas no cumplen con el formato estándar ISO datetime de Zod o los números son negativos.

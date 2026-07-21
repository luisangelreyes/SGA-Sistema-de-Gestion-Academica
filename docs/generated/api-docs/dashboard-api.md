# Documentación de API - Módulo `dashboard`

Este módulo provee métricas clave, KPIs financieros, datos analíticos de ingresos de corto plazo y el registro reciente de transacciones para la pantalla de inicio o dashboard del personal administrativo.

> [!NOTE]
> Todos los procedimientos de este módulo están protegidos bajo el procedimiento de gestor (`gestorProcedure`) y requieren un token de autenticación de usuario con rol de gestor o administrador.

## Procedimientos

### Métricas de Negocio y Control

---

#### `dashboard.obtenerMetricasInscripcion` (Query)
Obtiene el conteo total de alumnos activos, alumnos dados de baja, el cupo total disponible del plantel y el desglose de cupos máximos de grupo agrupados por nivel educativo.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**: Ninguno
- **Outputs**:
  ```typescript
  {
    alumnosActivos: number; // Conteo de alumnos con estado 'ACTIVO'
    alumnosBaja: number;    // Conteo de alumnos con estado 'BAJA_DEFINITIVA' o 'BAJA_TEMPORAL'
    cuposTotales: number;   // Suma total de los cupos máximos de todos los niveles educativos
    detallesNivel: Array<{
      nivelId: number;
      _sum: {
        cupoMaximo: number | null; // Suma de cupos máximos asignados a este nivel
      }
    }>
  }
  ```

---

#### `dashboard.obtenerKpisFinancieros` (Query)
Obtiene el total de ingresos recaudados por pagos en el mes actual y el saldo pendiente total por cobrar acumulado en la institución.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**: Ninguno
- **Outputs**:
  ```typescript
  {
    ingresosMesActual: number;   // Suma del montoTotal de todos los pagos registrados desde el primer día del mes corriente
    deudaPendienteTotal: number; // Suma del saldoPendiente de todos los adeudos activos y vencidos en el sistema
  }
  ```

---

#### `dashboard.obtenerIngresosUltimos7Dias` (Query)
Obtiene el desglose diario de ingresos percibidos en los últimos 7 días naturales (incluyendo hoy), ideal para renderizar gráficos de barras o líneas de tendencia.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**: Ninguno
- **Outputs**:
  ```typescript
  Array<{
    day: string;       // Nombre del día abreviado en español (Dom, Lun, Mar, Mié, Jue, Vie, Sáb)
    ingresos: number;  // Suma total de pagos recibidos en esa fecha (redondeado a 2 decimales)
  }>
  ```

---

#### `dashboard.obtenerUltimosPagos` (Query)
Retorna las últimas 5 transacciones de pago registradas el día de hoy, ordenadas cronológicamente de forma descendente.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**: Ninguno
- **Outputs**:
  ```typescript
  Array<{
    name: string;   // Nombre completo del alumno asociado al pago
    type: 'Colegiatura'; // Concepto fijo del tipo de transacción
    amount: string; // Monto total formateado en moneda local (ej: '$2,500.00')
  }>
  ```

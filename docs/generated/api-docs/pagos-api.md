# Documentación de API - Módulo `pagos`

Este módulo engloba la administración de finanzas y caja. Contempla el catálogo de tarifas, la generación de adeudos (Calendario de Pagos) y el registro robusto de pagos entrantes con aplicación de saldos (RF-55, RF-56, RF-60, RF-61, RF-62).

> [!NOTE]
> Todos los procedimientos en este módulo están restringidos al rol de gestor (`gestorProcedure`) y requieren un token de autenticación válido de un gestor o administrador del sistema. Las transacciones financieras están envueltas en Prisma `$transaction` para asegurar la atomicidad de los datos.

## Procedimientos

### Tarifas (`tarifa`)

---

#### `pagos.getTarifas` (Query)
Obtiene el catálogo de cuotas (colegiaturas, inscripciones, material). Opcionalmente se filtra por `cicloId` y/o `nivelId`.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    cicloId?: number; // Opcional
    nivelId?: number; // Opcional
  }
  ```
- **Outputs**:
  ```typescript
  Array<{
    tarifaId: number;
    concepto: string;
    montoBase: number;
    nivelId: number;
    cicloId: number;
    nivelEducativo: {
      nombre: string;
    };
    cicloEscolar: {
      nombre: string;
    }
  }>
  ```

---

#### `pagos.createTarifa` (Mutation)
Genera una nueva cuota base vinculada a un nivel y a un ciclo escolar.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    concepto: string;
    montoBase: number;
    nivelId: number;
    cicloId: number;
  }
  ```

---

#### `pagos.updateTarifa` (Mutation)
Modifica el concepto o monto de una cuota base del catálogo.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    tarifaId: number;
    concepto?: string;
    montoBase?: number;
  }
  ```

---

#### `pagos.deleteTarifa` (Mutation)
Soft Delete y desactivación de una cuota (no afecta los adeudos ya generados a los alumnos de forma retroactiva).

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**: `tarifaId: number`

---

### Adeudos / Calendario de Pago (`calendario_pago`)

---

#### `pagos.getAdeudos` (Query)
Consulta el estado de cuenta y plan de pagos particular de un alumno (`alumnoId`). Permite filtrar por el estado de cobro del adeudo.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    alumnoId: number;
    estadoCobro?: 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'CANCELADO'; // Opcional
  }
  ```
- **Outputs**:
  ```typescript
  Array<{
    calendarioPagoId: number;
    alumnoId: number;
    tarifaId: number;
    concepto: string;
    mes: string;
    fechaVencimiento: Date;
    montoOriginal: number;
    descuentoBeca: number;
    montoRecargo: number;
    saldoPendiente: number;
    estadoCobro: 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'CANCELADO';
    liquidadoAt: Date | null;
  }>
  ```

---

#### `pagos.createAdeudo` (Mutation)
Registra una nueva deuda (mensualidad, inscripción) a pagar por un alumno, asignando su fecha límite de vencimiento.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    alumnoId: number;
    tarifaId: number;
    concepto: string;
    mes: string;
    fechaVencimiento: string; // ISO Date String
    montoOriginal: number;
  }
  ```

---

#### `pagos.updateAdeudo` (Mutation)
Modifica parámetros de un adeudo específico antes de ser pagado.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    calendarioPagoId: number;
    concepto?: string;
    fechaVencimiento?: string;
    montoOriginal?: number;
    descuentoBeca?: number;
    montoRecargo?: number;
    estadoCobro?: 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'CANCELADO';
  }
  ```

---

### Registro de Pago y Caja (`pago`, `aplicacion_pago`, `movimiento_saldo`)

---

#### `pagos.registrarPago` (Mutation)
Procedimiento core para procesar un pago entrante y aplicarlo a los adeudos correspondientes.

- **Nivel de Acceso**: Gestor (`gestorProcedure`)
- **Inputs**:
  ```typescript
  {
    alumnoId: number;
    tutorId: number;
    fechaPago: string; // ISO Date String
    montoTotal: number; // Monto entregado por el tutor
    metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA_DEBITO' | 'TARJETA_CREDITO' | 'DEPOSITOS';
    aplicaciones: Array<{
      calendarioPagoId: number;
      montoAplicado: number; // Cantidad a abonar a este adeudo específico
    }>;
  }
  ```
- **Comportamiento Transaccional**:
  1. Calcula el total que se pretende aplicar a adeudos existentes a partir del arreglo de `aplicaciones` enviado.
  2. Valida que el `montoTotal` pagado no sea menor a lo que se quiere aplicar en total.
  3. Registra la entrada del `pago` histórico y extrae el ID del registrador directamente del contexto.
  4. Ejecuta cada `aplicacion_pago` y descuenta del `saldoPendiente` del adeudo correspondiente. Si este llega a cero, cambia el estado a `PAGADO` registrando la fecha actual en `liquidadoAt`.
  5. Si el `montoTotal` pagado es **mayor** al monto total aplicado (el tutor dio dinero extra), el sobrante se ingresa automáticamente al monedero `saldoAFavor` del Tutor y se genera su correspondiente `movimiento_saldo`.

## Manejo de Errores
- `BAD_REQUEST`: Si el monto del pago no alcanza para cubrir la aplicación, o si se intenta abonar más del saldo pendiente de un adeudo.
- `NOT_FOUND`: Si alguno de los adeudos señalados no existe en el registro del alumno.

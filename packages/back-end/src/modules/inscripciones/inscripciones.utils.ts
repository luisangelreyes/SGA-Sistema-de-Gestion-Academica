export interface PlanPagoData {
  meses: number;
}

export interface BecaData {
  porcentajeDescuento: number;
}

export interface TarifasCicloData {
  colegiatura: number;
  inscripcion: number;
  arancel: number;
  materialAnual: number;
}

export class CalculadoraPagos {
  /**
   * Genera el arreglo de recibos basados en el Plan de 10 o 12 meses y las tarifas base.
   */
  static generarCalendario(
    plan: PlanPagoData, 
    tarifas: TarifasCicloData, 
    fechaIngreso: Date, 
    beca?: BecaData | null,
    descuentoInscripcion: number = 0,
    cicloFechaInicio?: Date
  ) {
    const adeudos = [];
    
    // 1. Cargos Iniciales (Inscripción, Arancel, Material Anual)
    // Se asume que vencen el mismo mes de ingreso (o unos días después)
    const fechaVencimientoInicial = new Date(fechaIngreso);

    // INSCRIPCIÓN
    if (tarifas.inscripcion > 0) {
      let montoInscripcion = tarifas.inscripcion;
      if (descuentoInscripcion > 0) {
        montoInscripcion = montoInscripcion - (montoInscripcion * descuentoInscripcion / 100);
      }
      adeudos.push({
        concepto: 'INSCRIPCIÓN',
        mes: null, // No aplica a un mes específico de colegiatura
        fechaVencimiento: fechaVencimientoInicial,
        montoOriginal: montoInscripcion,
        saldoPendiente: montoInscripcion,
        estadoCobro: montoInscripcion === 0 ? 'PAGADO' : 'PENDIENTE'
      });
    }

    // ARANCEL
    if (tarifas.arancel > 0) {
      adeudos.push({
        concepto: 'ARANCEL',
        mes: null,
        fechaVencimiento: fechaVencimientoInicial,
        montoOriginal: tarifas.arancel,
        saldoPendiente: tarifas.arancel,
        estadoCobro: 'PENDIENTE'
      });
    }

    // MATERIAL ANUAL
    if (tarifas.materialAnual > 0) {
      adeudos.push({
        concepto: 'MATERIAL ANUAL',
        mes: null,
        fechaVencimiento: fechaVencimientoInicial,
        montoOriginal: tarifas.materialAnual,
        saldoPendiente: tarifas.materialAnual,
        estadoCobro: 'PENDIENTE'
      });
    }

    // 2. Cargos Mensuales (Colegiaturas)
    const meses10 = ['Septiembre', 'Octubre', 'Noviembre', 'Diciembre', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'];
    const meses12 = ['Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio'];

    const mesesToUse = plan.meses === 12 ? meses12 : meses10;
    
    // El costo total del ciclo asume que la tarifa mensual base (colegiatura) está planeada a 12 meses
    const costoTotal = tarifas.colegiatura * 12;
    // Si son 10 meses, pagan el total dividido entre 10
    const montoMensual10 = costoTotal / 10;
    
    for (let i = 0; i < mesesToUse.length; i++) {
      const mesStr = mesesToUse[i];
      let monto = 0;
      
      // Reglas de negocio
      if (plan.meses === 12) {
        if (mesStr === 'Diciembre') {
          // El monto doble de diciembre
          monto = tarifas.colegiatura * 2;
        } else if (mesStr === 'Julio') {
          monto = 0;
        } else {
          monto = tarifas.colegiatura;
        }
      } else {
        // Para 10 meses, el pago es uniforme pero proporcionalmente más alto
        monto = montoMensual10;
      }

      // Aplicar beca a colegiaturas (si no es monto 0)
      if (beca && beca.porcentajeDescuento > 0 && monto > 0) {
        const descuento = (monto * beca.porcentajeDescuento) / 100;
        monto = monto - descuento;
      }

      const baseDate = cicloFechaInicio ? new Date(cicloFechaInicio) : new Date(fechaIngreso);
      const fechaVencimiento = new Date(baseDate);
      
      // Si el plan es de 10 meses, comenzamos a cobrar en septiembre, por lo que desfasamos un mes respecto a la fecha de inicio (que suele ser agosto)
      const offset = plan.meses === 12 ? i : (i + 1);
      
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + offset);

      adeudos.push({
        concepto: `Colegiatura ${mesStr}`,
        mes: mesStr,
        fechaVencimiento,
        montoOriginal: monto,
        saldoPendiente: monto,
        estadoCobro: monto === 0 ? 'PAGADO' : 'PENDIENTE'
      });
    }

    return adeudos;
  }
}

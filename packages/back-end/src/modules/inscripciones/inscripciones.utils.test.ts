import { describe, it, expect } from 'vitest';
import { CalculadoraPagos } from './inscripciones.utils';

describe('CalculadoraPagos', () => {
  const fechaIngreso = new Date('2025-08-15');
  const tarifasMock = {
    colegiatura: 1200,
    inscripcion: 2000,
    arancel: 500,
    materialAnual: 1500
  };

  it('debe calcular correctamente un plan de 10 meses y conceptos iniciales', () => {
    const plan = { meses: 10 };

    const recibos = CalculadoraPagos.generarCalendario(plan, tarifasMock, fechaIngreso);

    // 3 cargos iniciales + 10 colegiaturas = 13 recibos
    expect(recibos.length).toBe(13);
    
    // Verificamos los cargos iniciales
    expect(recibos[0].concepto).toBe('INSCRIPCIÓN');
    expect(recibos[0].montoOriginal).toBe(2000);
    expect(recibos[1].concepto).toBe('ARANCEL');
    expect(recibos[2].concepto).toBe('MATERIAL ANUAL');

    // Verificamos que las colegiaturas arranquen en Septiembre (índice 3)
    expect(recibos[3].mes).toBe('Septiembre');
    expect(recibos[3].montoOriginal).toBe(1440); // 1200 * 12 / 10

    // Verificamos Diciembre
    const dic = recibos.find(r => r.mes === 'Diciembre');
    expect(dic).toBeDefined();
    expect(dic?.montoOriginal).toBe(1440); // Sin cobro doble
  });

  it('debe aplicar descuento en inscripción si se proporciona descuentoInscripcion', () => {
    const plan = { meses: 12 };
    const recibos = CalculadoraPagos.generarCalendario(plan, tarifasMock, fechaIngreso, null, 50); // 50% de descuento

    expect(recibos[0].concepto).toBe('INSCRIPCIÓN');
    expect(recibos[0].montoOriginal).toBe(1000); // 2000 - 50%
  });

  it('debe aplicar el descuento de beca correctamente a las mensualidades (excepto Julio)', () => {
    const plan = { meses: 12 };
    const beca = { porcentajeDescuento: 20 };

    const recibos = CalculadoraPagos.generarCalendario(plan, tarifasMock, fechaIngreso, beca);

    // Diciembre base = 2400 (doble de 1200), -20% = 1920
    const dic = recibos.find(r => r.mes === 'Diciembre');
    expect(dic?.montoOriginal).toBe(1920);

    // Agosto base = 1200, -20% = 960
    const ago = recibos.find(r => r.mes === 'Agosto');
    expect(ago?.montoOriginal).toBe(960);

    // Julio = 0 (No debe tener recargo negativo ni descuento sobre 0)
    const jul = recibos.find(r => r.mes === 'Julio');
    expect(jul?.montoOriginal).toBe(0);
    expect(jul?.estadoCobro).toBe('PAGADO');
  });
});

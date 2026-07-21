import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando sembrado de precios base y promociones reales...');

  // 1. Obtener ciclo actual
  const ciclo = await prisma.cicloEscolar.findFirst({
    where: { activo: true },
    orderBy: { cicloId: 'desc' }
  });

  if (!ciclo) {
    console.error('No hay ciclo activo. Abortando.');
    return;
  }

  // 2. Obtener niveles
  const niveles = await prisma.nivelEducativo.findMany();
  const getNivelId = (nombre: string) => niveles.find(n => n.nombre.toUpperCase() === nombre)?.nivelId;
  const preescolarId = getNivelId('PREESCOLAR');
  const primariaId = getNivelId('PRIMARIA');
  const secundariaId = getNivelId('SECUNDARIA');
  const bachilleratoId = getNivelId('BACHILLERATO');

  // Obtener Grados
  const grados = await prisma.grado.findMany();
  const getGradoId = (nivelId: number | undefined, num: number) => 
    grados.find(g => g.nivelId === nivelId && g.numero === num)?.gradoId;

  // 3. Crear Tarifas Base
  const basePrices = [
    { nivelId: preescolarId, ins: 2900, ara: 2390, mat: 2990, col: 2850 },
    { nivelId: primariaId, ins: 3100, ara: 2490, mat: 2690, col: 3199 },
    { nivelId: secundariaId, ins: 3400, ara: 2499, mat: 2890, col: 3299 },
    { nivelId: bachilleratoId, ins: 3600, ara: 2590, mat: 2990, col: 3685 },
  ];

  for (const bp of basePrices) {
    if (!bp.nivelId) continue;
    const items = [
      { c: 'INSCRIPCIÓN', m: bp.ins },
      { c: 'ARANCEL', m: bp.ara },
      { c: 'MATERIAL ANUAL', m: bp.mat },
      { c: 'COLEGIATURA', m: bp.col }
    ];

    for (const item of items) {
      // Upsert tarifa for this cycle
      const existing = await prisma.tarifa.findFirst({
        where: { cicloId: ciclo.cicloId, nivelId: bp.nivelId, concepto: item.c }
      });
      if (existing) {
        await prisma.tarifa.update({
          where: { tarifaId: existing.tarifaId },
          data: { monto: item.m }
        });
      } else {
        await prisma.tarifa.create({
          data: {
            cicloId: ciclo.cicloId,
            nivelId: bp.nivelId,
            concepto: item.c,
            monto: item.m
          }
        });
      }
    }
  }

  // 4. Crear Becas Promocionales
  const crearBeca = async (pct: number) => {
    const existing = await prisma.beca.findFirst({
      where: { porcentaje: pct, criterio: 'PROMOCION_TEMPRANA' }
    });
    if (existing) return existing.becaId;
    
    const nueva = await prisma.beca.create({
      data: {
        nombreBeca: `Beca Inscripción ${pct}%`,
        porcentaje: pct,
        criterio: 'PROMOCION_TEMPRANA',
        descripcion: 'Beca automática por inscripción temprana'
      }
    });
    return nueva.becaId;
  };

  const beca30 = await crearBeca(30);
  const beca25 = await crearBeca(25);
  const beca23 = await crearBeca(23);
  const beca20 = await crearBeca(20);
  const beca18 = await crearBeca(18);

  // 5. Ventanas de Promoción
  const createVentana = async (
    nivelId: number | undefined, 
    gradoNum: number | null, 
    descIns: number, 
    becaId: number, 
    inicio: string, 
    fin: string
  ) => {
    if (!nivelId) return;
    const gradoId = gradoNum ? getGradoId(nivelId, gradoNum) : null;
    
    // Check existing
    const existing = await prisma.ventanaInscripcionTemprana.findFirst({
      where: {
        cicloId: ciclo.cicloId,
        nivelId,
        gradoId,
        fechaInicio: new Date(inicio),
        fechaFin: new Date(fin)
      }
    });

    if (existing) {
      await prisma.ventanaInscripcionTemprana.update({
        where: { ventanaId: existing.ventanaId },
        data: { descuentoInscripcion: descIns, becaId }
      });
    } else {
      await prisma.ventanaInscripcionTemprana.create({
        data: {
          cicloId: ciclo.cicloId,
          nivelId,
          gradoId,
          descuentoInscripcion: descIns,
          becaId,
          fechaInicio: new Date(inicio),
          fechaFin: new Date(fin)
        }
      });
    }
  };

  const NOV_START = '2024-11-01T00:00:00.000Z';
  const NOV_END = '2024-12-31T23:59:59.000Z';
  
  const ENE_START = '2025-01-01T00:00:00.000Z';
  const ENE_END = '2025-02-28T23:59:59.000Z';
  
  const MAR_START = '2025-03-01T00:00:00.000Z';
  const MAR_END = '2025-06-30T23:59:59.000Z';

  // --- NOV / DIC ---
  // Preescolar (1,2,3 -> 30% beca. 1-> gratis ins, 2,3 -> 50% ins)
  await createVentana(preescolarId, 1, 100, beca30, NOV_START, NOV_END);
  await createVentana(preescolarId, 2, 50, beca30, NOV_START, NOV_END);
  await createVentana(preescolarId, 3, 50, beca30, NOV_START, NOV_END);
  
  // Primaria (1-> gratis, 25%. 2a6-> 50% ins, 25%)
  await createVentana(primariaId, 1, 100, beca25, NOV_START, NOV_END);
  for(let i=2; i<=6; i++) await createVentana(primariaId, i, 50, beca25, NOV_START, NOV_END);

  // Secundaria (1-> gratis, 25%. 2y3-> 50% ins, 23%)
  await createVentana(secundariaId, 1, 100, beca25, NOV_START, NOV_END);
  await createVentana(secundariaId, 2, 50, beca23, NOV_START, NOV_END);
  await createVentana(secundariaId, 3, 50, beca23, NOV_START, NOV_END);

  // Bachillerato (1-> gratis, 25%. 2y3-> 50% ins, 23%)
  await createVentana(bachilleratoId, 1, 100, beca25, NOV_START, NOV_END);
  await createVentana(bachilleratoId, 2, 50, beca23, NOV_START, NOV_END);
  await createVentana(bachilleratoId, 3, 50, beca23, NOV_START, NOV_END);

  // --- ENE / FEB ---
  // Secundaria (1-> gratis, 20%)
  await createVentana(secundariaId, 1, 100, beca20, ENE_START, ENE_END);

  // --- MAR / JUN ---
  // Secundaria (1-> gratis, 18%. 2y3-> 40% ins, 18%)
  await createVentana(secundariaId, 1, 100, beca18, MAR_START, MAR_END);
  await createVentana(secundariaId, 2, 40, beca18, MAR_START, MAR_END);
  await createVentana(secundariaId, 3, 40, beca18, MAR_START, MAR_END);

  console.log('¡Sembrado completado con éxito!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

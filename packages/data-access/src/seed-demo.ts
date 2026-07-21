import { PrismaClient, EstadoAlumno, EstadoCobro } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando carga de datos Demo...');

  // 1. Roles
  const rolesData = [
    { codigo: 'ADMIN', nombre: 'Administrador' },
    { codigo: 'GESTOR', nombre: 'Gestor Administrativo' },
    { codigo: 'CAJERO', nombre: 'Cajero' },
    { codigo: 'DOCENTE', nombre: 'Docente' },
  ];
  
  for (const r of rolesData) {
    await prisma.rol.upsert({
      where: { codigo: r.codigo },
      update: {},
      create: r,
    });
  }
  const rolAdmin = await prisma.rol.findUnique({ where: { codigo: 'ADMIN' } });

  // 2. Usuario Demo
  const passwordHash = '$2b$10$gfEBmzHxV4ghRKR901mMg.VjgyQFtX2wt3.Ja6hWP6ORVCLVw66ie'; // admin123
  const adminUser = await prisma.usuario.upsert({
    where: { nombreUsuario: 'admin' },
    update: {},
    create: {
      nombreUsuario: 'admin',
      nombreCompleto: 'Administrador Demo',
      passwordHash,
      roles: {
        create: {
          rolId: rolAdmin!.rolId
        }
      }
    }
  });
  console.log('✅ Usuario admin creado (admin / admin123)');

  // 3. Niveles Educativos
  const niveles = [
    { codigo: 'PRE', nombre: 'Preescolar', orden: 1 },
    { codigo: 'PRI', nombre: 'Primaria', orden: 2 },
    { codigo: 'SEC', nombre: 'Secundaria', orden: 3 },
    { codigo: 'BAC', nombre: 'Bachillerato', orden: 4 }
  ];

  for (const n of niveles) {
    await prisma.nivelEducativo.upsert({
      where: { codigo: n.codigo },
      update: {},
      create: n
    });
  }
  
  const pri = await prisma.nivelEducativo.findUnique({ where: { codigo: 'PRI' } });

  // 4. Grados (Primaria 1 a 6)
  if (pri) {
    for (let i = 1; i <= 6; i++) {
      const g = await prisma.grado.findFirst({ where: { numero: i, nivelId: pri.nivelId } });
      if (!g) {
        await prisma.grado.create({
          data: {
            nivelId: pri.nivelId,
            numero: i,
            nombre: `${i}º Primaria`
          }
        });
      }
    }
  }

  const primerGrado = await prisma.grado.findFirst({ where: { numero: 1, nivelId: pri?.nivelId } });

  // 5. Ciclo Escolar Activo
  let cicloActivo = await prisma.cicloEscolar.findFirst({ where: { nombre: '2026-2027' } });
  if (!cicloActivo) {
    cicloActivo = await prisma.cicloEscolar.create({
      data: {
        nombre: '2026-2027',
        fechaInicio: new Date('2026-08-20'),
        fechaFin: new Date('2027-07-15'),
        activo: true,
        periodicidad: 'ANUAL'
      }
    });
  }

  // 6. Grupo (1ro A)
  let grupo1A = await prisma.grupo.findFirst({ where: { nombre: '1ro A', cicloId: cicloActivo.cicloId } });
  if (!grupo1A) {
    grupo1A = await prisma.grupo.create({
      data: {
        nombre: '1ro A',
        gradoId: primerGrado!.gradoId,
        nivelId: pri!.nivelId,
        cicloId: cicloActivo.cicloId,
        cupoMaximo: 30
      }
    });
  }

  // 7. Plan de Pago y Tarifas
  let planPago = await prisma.planPago.findFirst({ where: { nombre: 'Plan Primaria 10 Meses' } });
  if (!planPago) {
    planPago = await prisma.planPago.create({
      data: {
        nombre: 'Plan Primaria 10 Meses',
        meses: 10,
        montoMensual: 2800.00,
        montoDiciembre: 2800.00,
        descripcion: 'Plan estándar 10 meses'
      }
    });
  }

  const tarifas = [
    { concepto: 'INSCRIPCION', monto: 3500.00 },
    { concepto: 'COLEGIATURA', monto: 2800.00 }
  ];
  for (const t of tarifas) {
    const existe = await prisma.tarifa.findFirst({ where: { cicloId: cicloActivo.cicloId, nivelId: pri!.nivelId, concepto: t.concepto } });
    if (!existe) {
      await prisma.tarifa.create({
        data: {
          cicloId: cicloActivo.cicloId,
          nivelId: pri!.nivelId,
          concepto: t.concepto,
          monto: t.monto,
          descripcion: `Tarifa base de ${t.concepto}`
        }
      });
    }
  }

  // 8. Tutores
  let tutor1 = await prisma.tutor.findFirst({ where: { correoElectronico: 'carlos@demo.com' } });
  if (!tutor1) {
    tutor1 = await prisma.tutor.create({
      data: {
        nombreCompleto: 'Carlos García Pérez',
        correoElectronico: 'carlos@demo.com',
        telefono: '5551234567',
        direccion: 'Calle Falsa 123'
      }
    });
  }

  // 9. Alumno
  let alumno1 = await prisma.alumno.findUnique({ where: { matricula: '260001' } });
  if (!alumno1) {
    alumno1 = await prisma.alumno.create({
      data: {
        nombreCompleto: 'Juanito García López',
        matricula: '260001',
        curp: 'GALJ200101HDF00',
        fechaNacimiento: new Date('2020-01-01'),
        sexo: 'M',
        nivelId: pri!.nivelId,
        gradoId: primerGrado!.gradoId,
        estado: EstadoAlumno.ACTIVO,
        tutoresAlumnos: {
          create: {
            tutorId: tutor1.tutorId,
            esPrincipal: true,
            parentesco: 'PADRE'
          }
        }
      }
    });
  }

  // 10. Inscripcion
  const inscripcion = await prisma.inscripcionCiclo.findUnique({
    where: {
      alumnoId_cicloId_gradoId: {
        alumnoId: alumno1.alumnoId,
        cicloId: cicloActivo.cicloId,
        gradoId: primerGrado!.gradoId
      }
    }
  });

  if (!inscripcion) {
    await prisma.inscripcionCiclo.create({
      data: {
        alumnoId: alumno1.alumnoId,
        cicloId: cicloActivo.cicloId,
        gradoId: primerGrado!.gradoId,
        grupoId: grupo1A.grupoId,
        planPagoId: planPago.planPagoId,
        fechaIngreso: new Date(),
        estadoEnCiclo: 'ACTIVO',
        estadoFinanciero: 'AL_CORRIENTE'
      }
    });

    // Generar un pago pendiente de colegiatura
    await prisma.calendarioPago.create({
      data: {
        alumnoId: alumno1.alumnoId,
        cicloId: cicloActivo.cicloId,
        concepto: 'COLEGIATURA',
        mes: 'Septiembre',
        fechaVencimiento: new Date('2026-09-10'),
        montoOriginal: 2800.00,
        saldoPendiente: 2800.00,
        estadoCobro: EstadoCobro.PENDIENTE
      }
    });
  }

  // 11. Global Config
  const conf = await prisma.configuracionGlobal.findFirst({ where: { configuracionId: 1 } });
  if (!conf) {
    await prisma.configuracionGlobal.create({
      data: {
        configuracionId: 1,
        montoRecargoDefecto: 150.00,
        diasGraciaRecargo: 5,
        plazoInscripcionDias: 30,
        umbralesSmtpDias: { "amarillo": 5, "rojo": 1 }
      }
    });
  }

  console.log('🎉 ¡Datos de prueba sembrados exitosamente!');
}

main()
  .catch((e) => {
    console.error('Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

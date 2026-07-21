import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, ArrowLeft } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';
import { Button } from '../../../../components/ui/Button/Button';
import { Input } from '../../../../components/ui/Input/Input';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import styles from './AlumnoFormPage.module.css';

// Esquema de validación alineado con el backend
const formSchema = z.object({
  matricula: z.string().max(30).optional(),
  curp: z.string().length(18, 'El CURP debe tener exactamente 18 caracteres'),
  nombreCompleto: z.string().min(1, 'El nombre completo es requerido').max(120),
  fechaNacimiento: z.string().min(1, 'Requerida'), // input type="date"
  sexo: z.enum(['M', 'F'], { required_error: 'Requerido' }),
  nivelId: z.string().min(1, 'Nivel Educativo es requerido'),
  estado: z.enum(['ACTIVO', 'BAJA_DEFINITIVA', 'BAJA_TEMPORAL', 'EGRESADO', 'TRANSICION_PENDIENTE']),
  diaLimitePago: z.string().optional(),
  tipoSangre: z.string().max(10).optional(),
  alergias: z.string().optional(),
  padecimientos: z.string().optional(),
  observaciones: z.string().optional(),
  personasAutorizadasStr: z.string().optional(), // Lo usaremos como textarea separado por saltos de línea o comas
  fechaBaja: z.string().optional(),
  motivoBaja: z.string().optional(),
});

export interface FormData {
  matricula?: string;
  curp: string;
  nombreCompleto: string;
  fechaNacimiento: string;
  sexo: 'M' | 'F';
  nivelId: string;
  estado: 'ACTIVO' | 'BAJA_DEFINITIVA' | 'BAJA_TEMPORAL' | 'EGRESADO' | 'TRANSICION_PENDIENTE';
  diaLimitePago?: string;
  tipoSangre?: string;
  alergias?: string;
  padecimientos?: string;
  observaciones?: string;
  personasAutorizadasStr?: string;
  fechaBaja?: string;
  motivoBaja?: string;
}

export function AlumnoFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: niveles } = trpc.grupos.getNiveles.useQuery();
  const { data: alumnoToEdit, isLoading: isLoadingAlumno } = trpc.alumnos.getById.useQuery(
    Number(id),
    { enabled: isEditing }
  );

  const createMutation = trpc.alumnos.create.useMutation();
  const updateMutation = trpc.alumnos.update.useMutation();

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      matricula: '',
      curp: '',
      nombreCompleto: '',
      fechaNacimiento: '',
      sexo: 'M',
      nivelId: '',
      estado: 'ACTIVO',
      diaLimitePago: '',
      tipoSangre: '',
      alergias: '',
      padecimientos: '',
      observaciones: '',
      personasAutorizadasStr: '',
      fechaBaja: '',
      motivoBaja: '',
    },
  }) as any;

  const estadoWatch = watch('estado');

  useEffect(() => {
    const rawAlumno = alumnoToEdit as any;
    if (rawAlumno) {
      let personasStr = '';
      if (rawAlumno.personasAutorizadas) {
        try {
          const arr = typeof rawAlumno.personasAutorizadas === 'string' 
            ? JSON.parse(rawAlumno.personasAutorizadas) 
            : rawAlumno.personasAutorizadas;
          if (Array.isArray(arr)) personasStr = arr.join('\n');
        } catch(e) {}
      }

      const formPayload: any = {
        matricula: rawAlumno.matricula || '',
        curp: rawAlumno.curp,
        nombreCompleto: rawAlumno.nombreCompleto,
        fechaNacimiento: new Date(rawAlumno.fechaNacimiento).toISOString().split('T')[0],
        sexo: rawAlumno.sexo as 'M' | 'F',
        nivelId: rawAlumno.nivelId.toString(),
        estado: rawAlumno.estado as any,
        diaLimitePago: rawAlumno.diaLimitePago?.toString() || '',
        tipoSangre: rawAlumno.tipoSangre || '',
        alergias: rawAlumno.alergias || '',
        padecimientos: rawAlumno.padecimientos || '',
        observaciones: rawAlumno.observaciones || '',
        personasAutorizadasStr: personasStr,
        fechaBaja: rawAlumno.fechaBaja ? new Date(rawAlumno.fechaBaja).toISOString().split('T')[0] : '',
        motivoBaja: rawAlumno.motivoBaja || '',
      };
      reset(formPayload);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alumnoToEdit ? (alumnoToEdit as any).alumnoId : null, reset]);

  const onSubmit = async (data: FormData) => {
    // Transformar personasAutorizadas
    const personasArr = data.personasAutorizadasStr
      ? data.personasAutorizadasStr.split('\n').map(s => s.trim()).filter(s => s !== '')
      : [];

    const payload = {
      matricula: data.matricula || undefined,
      curp: data.curp,
      nombreCompleto: data.nombreCompleto,
      fechaNacimiento: new Date(data.fechaNacimiento).toISOString(),
      sexo: data.sexo,
      nivelId: parseInt(data.nivelId, 10),
      estado: data.estado,
      diaLimitePago: data.diaLimitePago ? parseInt(data.diaLimitePago, 10) : undefined,
      tipoSangre: data.tipoSangre || undefined,
      alergias: data.alergias || undefined,
      padecimientos: data.padecimientos || undefined,
      observaciones: data.observaciones || undefined,
      personasAutorizadas: personasArr.length > 0 ? personasArr : undefined,
    };

    if (isEditing) {
      const updatePayload: any = {
        ...payload,
        alumnoId: Number(id),
        fechaBaja: (data.estado.startsWith('BAJA') && data.fechaBaja) ? new Date(data.fechaBaja).toISOString() : undefined,
        motivoBaja: data.estado.startsWith('BAJA') ? data.motivoBaja : undefined,
      };
      // @ts-ignore
      await updateMutation.mutateAsync(updatePayload);
      navigate('/alumnos');
    } else {
      const createPayload: any = payload;
      // @ts-ignore
      await createMutation.mutateAsync(createPayload);
      navigate('/alumnos');
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isLoadingAlumno) {
    return <div className={styles.container}><Spinner centered /></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="ghost" leftIcon={<ArrowLeft size={20} />} onClick={() => navigate('/alumnos')}>
          Volver
        </Button>
        <h2 className={styles.title}>{isEditing ? 'Editar Expediente de Alumno' : 'Registrar Nuevo Alumno'}</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.formContainer}>
        
        {/* SECCIÓN: DATOS GENERALES */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Datos Generales</h3>
          <div className={styles.grid2}>
            <Controller name="nombreCompleto" control={control} render={({ field }) => (
              <Input {...field} label="Nombre Completo" error={errors.nombreCompleto?.message} />
            )} />
            <Controller name="curp" control={control} render={({ field }) => (
              <Input {...field} label="CURP (18 caracteres)" error={errors.curp?.message} />
            )} />
            <Controller name="fechaNacimiento" control={control} render={({ field }) => (
              <Input {...field} type="date" label="Fecha de Nacimiento" error={errors.fechaNacimiento?.message} />
            )} />
            <Controller name="sexo" control={control} render={({ field }) => (
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Sexo</label>
                <select {...field} className={styles.select}>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
                {errors.sexo && <span className={styles.error}>{errors.sexo.message}</span>}
              </div>
            )} />
          </div>
        </div>

        {/* SECCIÓN: CONTROL ESCOLAR */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Control Escolar</h3>
          <div className={styles.grid2}>
            <Controller name="matricula" control={control} render={({ field }) => (
              <Input {...field} label="Matrícula (Opcional)" error={errors.matricula?.message} />
            )} />
            
            <Controller name="nivelId" control={control} render={({ field }) => (
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Nivel Educativo</label>
                <select {...field} className={styles.select}>
                  <option value="">Seleccione Nivel</option>
                  {niveles?.map(n => (
                    <option key={n.nivelId} value={n.nivelId}>{n.nombre}</option>
                  ))}
                </select>
                {errors.nivelId && <span className={styles.error}>{errors.nivelId.message}</span>}
              </div>
            )} />

            <Controller name="estado" control={control} render={({ field }) => (
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Estado Actual</label>
                <select {...field} className={styles.select}>
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="BAJA_TEMPORAL">BAJA TEMPORAL</option>
                  <option value="BAJA_DEFINITIVA">BAJA DEFINITIVA</option>
                  <option value="EGRESADO">EGRESADO</option>
                  <option value="TRANSICION_PENDIENTE">TRANSICIÓN PENDIENTE</option>
                </select>
              </div>
            )} />

            <Controller name="diaLimitePago" control={control} render={({ field }) => (
              <div>
                <Input {...field} type="number" label="Día Límite de Pago Personalizado (1-31)" error={errors.diaLimitePago?.message} />
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Dejar en blanco para usar el del Nivel/Ciclo.</p>
              </div>
            )} />
          </div>

          {estadoWatch.startsWith('BAJA') && (
            <div className={styles.grid2} style={{ marginTop: '16px', padding: '16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px' }}>
              <Controller name="fechaBaja" control={control} render={({ field }) => (
                <Input {...field} type="date" label="Fecha de Baja" error={errors.fechaBaja?.message} />
              )} />
              <Controller name="motivoBaja" control={control} render={({ field }) => (
                <Input {...field} label="Motivo de Baja" error={errors.motivoBaja?.message} />
              )} />
            </div>
          )}
        </div>

        {/* SECCIÓN: EXPEDIENTE MÉDICO Y SEGURIDAD */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Expediente Médico y Seguridad</h3>
          <div className={styles.grid2}>
            <Controller name="tipoSangre" control={control} render={({ field }) => (
              <Input {...field} label="Tipo de Sangre" error={errors.tipoSangre?.message} placeholder="Ej. O+" />
            )} />
            <Controller name="alergias" control={control} render={({ field }) => (
              <Input {...field} label="Alergias" error={errors.alergias?.message} />
            )} />
          </div>
          
          <div style={{ marginTop: '16px' }}>
             <Controller name="padecimientos" control={control} render={({ field }) => (
              <Input {...field} label="Padecimientos Crónicos" error={errors.padecimientos?.message} />
            )} />
          </div>

          <div style={{ marginTop: '16px' }}>
             <Controller name="observaciones" control={control} render={({ field }) => (
              <Input {...field} label="Observaciones Adicionales" error={errors.observaciones?.message} />
            )} />
          </div>

          <div style={{ marginTop: '24px' }}>
            <label className={styles.label}>Personas Autorizadas para Recoger (Una por línea)</label>
            <Controller name="personasAutorizadasStr" control={control} render={({ field }) => (
              <textarea 
                {...field} 
                className={styles.textarea} 
                rows={4}
                placeholder="Juan Pérez (Tío)&#10;María López (Abuela)"
              />
            )} />
          </div>
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={() => navigate('/alumnos')}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSaving} leftIcon={<Save size={18} />}>
            Guardar Expediente
          </Button>
        </div>

      </form>
    </div>
  );
}

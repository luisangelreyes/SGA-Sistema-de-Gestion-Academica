import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';
import { Button } from '../../../../components/ui/Button/Button';
import { Input } from '../../../../components/ui/Input/Input';

const upsertDatosFiscalesSchema = z.object({
  rfc: z.string().min(1, 'El RFC es requerido').max(13),
  razonSocial: z.string().min(1, 'La Razón Social es requerida').max(120),
  regimenFiscal: z.string().max(10).optional(),
  usoCfdi: z.string().max(10).optional(),
  direccionFiscal: z.string().optional(),
  codigoPostal: z.string().max(10).optional(),
  correoFacturacion: z.string().email('Correo de facturación inválido').max(255).optional().or(z.literal('')),
});

const formSchema = z.object({
  nombreCompleto: z.string().min(1, 'El nombre completo es requerido').max(120),
  correoElectronico: z.string().email('Correo electrónico inválido').max(255).optional().or(z.literal('')),
  telefono: z.string().max(15).optional(),
  direccion: z.string().optional(),
  curp: z.string().max(18).optional(),
  requiereFactura: z.boolean().optional(),
  tipoPagoHabitual: z.string().max(15).optional(),
  datosFiscales: upsertDatosFiscalesSchema.optional().nullable(),
});

export function TutorFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id && id !== 'nuevo');

  const { data: tutorToEdit, isLoading } = trpc.tutores.getById.useQuery(
    Number(id),
    { enabled: isEditing }
  );

  const createMutation = trpc.tutores.create.useMutation();
  const updateMutation = trpc.tutores.update.useMutation();

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombreCompleto: '',
      correoElectronico: '',
      telefono: '',
      direccion: '',
      curp: '',
      requiereFactura: false,
      tipoPagoHabitual: '',
      datosFiscales: {
        rfc: '',
        razonSocial: '',
        regimenFiscal: '',
        usoCfdi: '',
        direccionFiscal: '',
        codigoPostal: '',
        correoFacturacion: '',
      }
    },
  }) as any;

  const requiereFactura = watch('requiereFactura');

  useEffect(() => {
    const rawTutor = tutorToEdit as any;
    if (rawTutor) {
      const payload = {
        nombreCompleto: rawTutor.nombreCompleto || '',
        correoElectronico: rawTutor.correoElectronico || '',
        telefono: rawTutor.telefono || '',
        direccion: rawTutor.direccion || '',
        curp: rawTutor.curp || '',
        requiereFactura: rawTutor.requiereFactura || false,
        tipoPagoHabitual: rawTutor.tipoPagoHabitual || '',
        datosFiscales: rawTutor.datosFiscales || {
          rfc: '',
          razonSocial: '',
          regimenFiscal: '',
          usoCfdi: '',
          direccionFiscal: '',
          codigoPostal: '',
          correoFacturacion: '',
        }
      };
      reset(payload);
    }
  }, [tutorToEdit ? (tutorToEdit as any).tutorId : null, reset]);

  const onSubmit = async (data: any) => {
    try {
      const payload: any = {
        nombreCompleto: data.nombreCompleto,
        correoElectronico: data.correoElectronico || undefined,
        telefono: data.telefono || undefined,
        direccion: data.direccion || undefined,
        curp: data.curp || undefined,
        requiereFactura: data.requiereFactura,
        tipoPagoHabitual: data.tipoPagoHabitual || undefined,
      };

      if (data.requiereFactura && data.datosFiscales) {
        payload.datosFiscales = {
          rfc: data.datosFiscales.rfc,
          razonSocial: data.datosFiscales.razonSocial,
          regimenFiscal: data.datosFiscales.regimenFiscal || undefined,
          usoCfdi: data.datosFiscales.usoCfdi || undefined,
          direccionFiscal: data.datosFiscales.direccionFiscal || undefined,
          codigoPostal: data.datosFiscales.codigoPostal || undefined,
          correoFacturacion: data.datosFiscales.correoFacturacion || undefined,
        };
      }

      if (isEditing) {
        await updateMutation.mutateAsync({
          ...payload,
          tutorId: Number(id),
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate('/tutores');
    } catch (error) {
      console.error(error);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isLoading) {
    return <div className="loading-state">Cargando datos...</div>;
  }

  return (
    <div className="form-page">
      <div className="form-page-header">
        <Button variant="ghost" onClick={() => navigate('/tutores')}>
          <ArrowLeft size={20} />
          Volver
        </Button>
        <div className="form-title">
          <h2>{isEditing ? 'Editar Tutor' : 'Nuevo Tutor'}</h2>
          <p className="text-secondary">
            {isEditing
              ? 'Modifique la información del tutor.'
              : 'Ingrese la información del nuevo tutor.'}
          </p>
        </div>
      </div>

      <div className="form-page-content">
        <form onSubmit={handleSubmit(onSubmit)} className="card p-6">
          <div className="form-section">
            <h3>Datos Generales</h3>
            <div className="form-grid">
              <Controller
                name="nombreCompleto"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Nombre Completo"
                    {...field}
                    error={errors.nombreCompleto?.message}
                    required
                  />
                )}
              />
              <Controller
                name="curp"
                control={control}
                render={({ field }) => (
                  <Input
                    label="CURP"
                    {...field}
                    error={errors.curp?.message}
                  />
                )}
              />
              <Controller
                name="correoElectronico"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Correo Electrónico"
                    type="email"
                    {...field}
                    error={errors.correoElectronico?.message}
                  />
                )}
              />
              <Controller
                name="telefono"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Teléfono"
                    {...field}
                    error={errors.telefono?.message}
                  />
                )}
              />
              <div className="form-group full-width">
                <Controller
                  name="direccion"
                  control={control}
                  render={({ field }) => (
                    <Input
                      label="Dirección"
                      {...field}
                      error={errors.direccion?.message}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          <div className="form-section mt-8">
            <h3>Facturación y Pagos</h3>
            <div className="form-grid">
              <Controller
                name="tipoPagoHabitual"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Tipo de Pago Habitual"
                    placeholder="Ej. Transferencia, Tarjeta..."
                    {...field}
                    error={errors.tipoPagoHabitual?.message}
                  />
                )}
              />

              <div className="form-group checkbox-group" style={{ display: 'flex', alignItems: 'center', marginTop: '1.5rem' }}>
                <Controller
                  name="requiereFactura"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={value || false}
                        onChange={(e) => onChange(e.target.checked)}
                        style={{ width: '20px', height: '20px' }}
                      />
                      <span className="font-medium">¿Requiere Factura?</span>
                    </label>
                  )}
                />
              </div>
            </div>
          </div>

          {requiereFactura && (
            <div className="form-section mt-8">
              <h3>Datos Fiscales</h3>
              <div className="form-grid">
                <Controller
                  name="datosFiscales.rfc"
                  control={control}
                  render={({ field }) => (
                    <Input
                      label="RFC"
                      {...field}
                      error={errors.datosFiscales?.rfc?.message}
                      required
                    />
                  )}
                />
                <Controller
                  name="datosFiscales.razonSocial"
                  control={control}
                  render={({ field }) => (
                    <Input
                      label="Razón Social"
                      {...field}
                      error={errors.datosFiscales?.razonSocial?.message}
                      required
                    />
                  )}
                />
                <Controller
                  name="datosFiscales.regimenFiscal"
                  control={control}
                  render={({ field }) => (
                    <Input
                      label="Régimen Fiscal"
                      placeholder="Ej. 601"
                      {...field}
                      error={errors.datosFiscales?.regimenFiscal?.message}
                    />
                  )}
                />
                <Controller
                  name="datosFiscales.usoCfdi"
                  control={control}
                  render={({ field }) => (
                    <Input
                      label="Uso CFDI"
                      placeholder="Ej. G03"
                      {...field}
                      error={errors.datosFiscales?.usoCfdi?.message}
                    />
                  )}
                />
                <Controller
                  name="datosFiscales.codigoPostal"
                  control={control}
                  render={({ field }) => (
                    <Input
                      label="Código Postal"
                      {...field}
                      error={errors.datosFiscales?.codigoPostal?.message}
                    />
                  )}
                />
                <Controller
                  name="datosFiscales.correoFacturacion"
                  control={control}
                  render={({ field }) => (
                    <Input
                      label="Correo de Facturación"
                      type="email"
                      {...field}
                      error={errors.datosFiscales?.correoFacturacion?.message}
                    />
                  )}
                />
                <div className="form-group full-width">
                  <Controller
                    name="datosFiscales.direccionFiscal"
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="Dirección Fiscal Completa"
                        {...field}
                        error={errors.datosFiscales?.direccionFiscal?.message}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="form-actions mt-8" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" disabled={isSaving}>
              <Save size={20} />
              {isSaving ? 'Guardando...' : 'Guardar Tutor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

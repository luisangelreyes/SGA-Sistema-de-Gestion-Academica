import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';
import { Button } from '../../../../components/ui/Button/Button';
import { Input } from '../../../../components/ui/Input/Input';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import styles from './ConfiguracionFormPage.module.css';

const schema = z.object({
  montoRecargoDefecto: z.string().min(1, 'Requerido'),
  diasGraciaRecargo: z.string().min(1, 'Requerido'),
  plazoInscripcionDias: z.string().min(1, 'Requerido'),
  umbralesSmtpDias: z.string().min(1, 'Requerido'),
});

type FormData = z.infer<typeof schema>;

export function ConfiguracionFormPage() {
  const utils = trpc.useUtils();
  const { data: config, isLoading } = trpc.configuracion.get.useQuery();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      montoRecargoDefecto: '',
      diasGraciaRecargo: '',
      plazoInscripcionDias: '',
      umbralesSmtpDias: '',
    },
  });

  useEffect(() => {
    if (config) {
      reset({
        montoRecargoDefecto: config.montoRecargoDefecto?.toString() || '0',
        diasGraciaRecargo: config.diasGraciaRecargo?.toString() || '0',
        plazoInscripcionDias: config.plazoInscripcionDias?.toString() || '0',
        umbralesSmtpDias: config.umbralesSmtpDias?.join(', ') || '',
      });
    }
  }, [config, reset]);

  const updateMutation = trpc.configuracion.update.useMutation({
    onSuccess: () => {
      utils.configuracion.get.invalidate();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  });

  const onSubmit = (data: FormData) => {
    const umbrales = data.umbralesSmtpDias
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n));

    updateMutation.mutate({
      montoRecargoDefecto: parseFloat(data.montoRecargoDefecto),
      diasGraciaRecargo: parseInt(data.diasGraciaRecargo, 10),
      plazoInscripcionDias: parseInt(data.plazoInscripcionDias, 10),
      umbralesSmtpDias: umbrales,
    });
  };

  if (isLoading) {
    return (
      <div className={styles.container} style={{ minHeight: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spinner size={48} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.contentCard}>
        <h2 className={styles.cardTitle}>Parámetros del Sistema</h2>
        <p className={styles.cardSubtitle}>
          Estos valores afectan el cálculo automático de deudas y el comportamiento general del SGA.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.formGrid}>
          
          <div className={styles.fieldGroup}>
            <h3 className={styles.groupTitle}>Finanzas y Caja</h3>
            <Controller
              name="montoRecargoDefecto"
              control={control}
              render={({ field }) => (
                <Input 
                  {...field} 
                  type="number" 
                  step="0.01" 
                  label="Monto de Recargo por Defecto ($)" 
                  error={errors.montoRecargoDefecto?.message} 
                  disabled={updateMutation.isPending} 
                />
              )}
            />
            <Controller
              name="diasGraciaRecargo"
              control={control}
              render={({ field }) => (
                <div style={{ marginTop: '16px' }}>
                  <Input 
                    {...field} 
                    type="number" 
                    label="Días de Gracia (Posterior al Vencimiento)" 
                    error={errors.diasGraciaRecargo?.message} 
                    disabled={updateMutation.isPending} 
                  />
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    Número de días que el sistema esperará antes de aplicar el recargo automático a una colegiatura vencida.
                  </p>
                </div>
              )}
            />
          </div>

          <div className={styles.fieldGroup}>
            <h3 className={styles.groupTitle}>Inscripciones y Notificaciones</h3>
            <Controller
              name="plazoInscripcionDias"
              control={control}
              render={({ field }) => (
                <div>
                  <Input 
                    {...field} 
                    type="number" 
                    label="Plazo para completar Inscripción (Días)" 
                    error={errors.plazoInscripcionDias?.message} 
                    disabled={updateMutation.isPending} 
                  />
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    Si un alumno no completa su pago de inscripción en este plazo, su lugar podría ser liberado.
                  </p>
                </div>
              )}
            />
            <Controller
              name="umbralesSmtpDias"
              control={control}
              render={({ field }) => (
                <div style={{ marginTop: '16px' }}>
                  <Input 
                    {...field} 
                    label="Recordatorios de Cobro SMTP (Días previos)" 
                    error={errors.umbralesSmtpDias?.message} 
                    disabled={updateMutation.isPending} 
                    placeholder="Ej. 5, 3, 1"
                  />
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    Introduce los días (separados por coma) en los que el sistema enviará correos recordando el vencimiento de pago.
                  </p>
                </div>
              )}
            />
          </div>

          <div className={styles.actions}>
            {saveSuccess && <span className={styles.successMessage}>¡Configuración guardada exitosamente!</span>}
            <Button type="submit" isLoading={updateMutation.isPending} leftIcon={<Save size={18} />}>
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

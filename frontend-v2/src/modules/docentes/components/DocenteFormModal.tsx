import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '../../../lib/trpc';
import toast from 'react-hot-toast';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

const schema = z.object({
  nombreCompleto: z.string().min(1, 'El nombre es requerido').max(120),
  correo: z.string().email('Correo inválido').optional().or(z.literal('')),
  telefono: z.string().max(15).optional().or(z.literal('')),
  especialidad: z.string().max(100).optional().or(z.literal('')),
  activo: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  docenteId?: number;
  initialData?: any;
};

export function DocenteFormModal({ isOpen, onClose, docenteId, initialData }: Props) {
  const utils = trpc.useUtils();
  const isEditing = !!docenteId;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { nombreCompleto: '', correo: '', telefono: '', especialidad: '', activo: true },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          nombreCompleto: initialData.nombreCompleto || '',
          correo: initialData.correo || '',
          telefono: initialData.telefono || '',
          especialidad: initialData.especialidad || '',
          activo: initialData.activo ?? true,
        });
      } else {
        reset({ nombreCompleto: '', correo: '', telefono: '', especialidad: '', activo: true });
      }
    }
  }, [isOpen, initialData, reset]);

  const createMutation = trpc.docentes.create.useMutation({
    onSuccess: () => {
      utils.docentes.getAll.invalidate();
      toast.success('Docente guardado exitosamente');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Error al guardar docente');
    }
  });

  const updateMutation = trpc.docentes.update.useMutation({
    onSuccess: () => {
      utils.docentes.getAll.invalidate();
      toast.success('Docente actualizado exitosamente');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar docente');
    }
  });

  const onSubmit = (data: FormData) => {
    if (isEditing) {
      updateMutation.mutate({ docenteId: docenteId!, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Docente' : 'Nuevo Docente'}>
      <form 
        onSubmit={handleSubmit(
          onSubmit as any, 
          (errors) => {
            console.error("Validation errors:", errors);
            toast.error("Por favor, revisa los campos en rojo.");
          }
        )} 
        className="space-y-4"
      >
        <Input
          label="Nombre Completo *"
          {...register('nombreCompleto')}
          error={errors.nombreCompleto?.message}
          placeholder="Ej. Juan Pérez"
        />

        <Input
          label="Especialidad"
          {...register('especialidad')}
          error={errors.especialidad?.message}
          placeholder="Ej. Matemáticas"
        />

        <Input
          label="Teléfono"
          {...register('telefono')}
          error={errors.telefono?.message}
          placeholder="Opcional"
        />

        <Input
          label="Correo Electrónico"
          type="email"
          {...register('correo')}
          error={errors.correo?.message}
          placeholder="Opcional"
        />

        {isEditing && (
          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="activo" {...register('activo')} className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-600" />
            <label htmlFor="activo" className="text-sm font-medium text-slate-300">Docente Activo</label>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Docente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

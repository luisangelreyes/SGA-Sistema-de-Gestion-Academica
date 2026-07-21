import { useState } from 'react';
import { trpc } from '../../../lib/trpc';
import { X, Tag } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  alumnoId: number;
  cicloId: number;
}

export function AsignarBecaModal({ isOpen, onClose, alumnoId, cicloId }: Props) {
  const utils = trpc.useUtils();
  const { data: becas, isLoading } = trpc.becas.getBecas.useQuery(undefined, { enabled: isOpen });
  const [becaId, setBecaId] = useState('');

  const assignMutation = trpc.becas.assignBeca.useMutation({
    onSuccess: () => {
      utils.alumnos.getById.invalidate(alumnoId);
      onClose();
    },
    onError: (err: any) => {
      window.alert(err.message || 'Error al asignar beca');
    }
  });

  if (!isOpen) return null;

  const handleAssign = () => {
    if (!becaId) return window.alert('Selecciona una beca');
    assignMutation.mutate({
      alumnoId,
      becaId: Number(becaId),
      cicloId,
      fechaAsignacion: new Date().toISOString()
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Tag className="text-emerald-600" />
            Asignar Beca o Promoción
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar del catálogo</label>
            <select 
              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-gray-50/50 transition-all"
              value={becaId}
              onChange={e => setBecaId(e.target.value)}
              disabled={isLoading}
            >
              <option value="">Selecciona...</option>
              {becas?.map((b: any) => (
                <option key={b.becaId} value={b.becaId}>
                  {b.nombreBeca} ({b.porcentaje}%)
                </option>
              ))}
            </select>
          </div>
          
          <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-sm border border-amber-100 leading-relaxed">
            <p className="font-semibold mb-1">Nota importante:</p>
            Al asignar una beca, esta se aplicará a los adeudos futuros que se generen al asignar el <strong>Plan de Pagos</strong> en este ciclo. Asegúrate de asignarla antes del plan de pagos.
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button 
              onClick={handleAssign} 
              disabled={!becaId || assignMutation.isPending}
            >
              Asignar Beca
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { trpc } from '../../../lib/trpc';

interface PlanPagoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  planPago?: any;
}

export function PlanPagoFormModal({ isOpen, onClose, planPago }: PlanPagoFormModalProps) {
  const [nombre, setNombre] = useState('');
  const [meses, setMeses] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [activo, setActivo] = useState(true);

  const utils = trpc.useContext();

  const createMutation = trpc.inscripciones.createPlanPago.useMutation({
    onSuccess: () => {
      utils.inscripciones.getPlanesPago.invalidate();
      onClose();
    },
    onError: (err: any) => alert(err.message || 'Error al crear el plan de pago')
  });

  const updateMutation = trpc.inscripciones.updatePlanPago.useMutation({
    onSuccess: () => {
      utils.inscripciones.getPlanesPago.invalidate();
      onClose();
    },
    onError: (err: any) => alert(err.message || 'Error al actualizar el plan de pago')
  });

  useEffect(() => {
    if (planPago && isOpen) {
      setNombre(planPago.nombre);
      setMeses(planPago.meses.toString());
      setDescripcion(planPago.descripcion || '');
      setActivo(planPago.activo !== false);
    } else {
      setNombre('');
      setMeses('');
      setDescripcion('');
      setActivo(true);
    }
  }, [planPago, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!nombre || !meses) {
      alert('Por favor, llena los campos obligatorios.');
      return;
    }

    const payload = {
      nombre,
      meses: parseInt(meses),
      montoMensual: 0, // Hardcoded for now as it's not in the UI, schema might need update
      montoDiciembre: null,
      descripcion,
      activo
    };

    if (planPago) {
      updateMutation.mutate({ planPagoId: planPago.planPagoId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold text-navy-900 mb-6 pb-4 border-b border-gray-100">
          {planPago ? 'Editar Plan de Pago' : 'Nuevo Plan de Pago'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-navy-800 mb-1">
              Nombre del Plan
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
              placeholder="Ej. Plan 10 Meses"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy-800 mb-1">
              Meses
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
              placeholder="10"
              min="1"
              value={meses}
              onChange={(e) => setMeses(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Cantidad de meses a dividir la colegiatura anual.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy-800 mb-1">
              Descripción (Opcional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-shadow"
              rows={3}
              placeholder="Detalles adicionales del plan..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
          
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm font-semibold text-navy-800">Plan de pago activo</span>
            </label>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <button 
            className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {planPago ? 'Guardar Plan' : 'Guardar Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, DollarSign, Calendar } from 'lucide-react';
import { trpc } from '../../../lib/trpc';

interface EditarPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pagoData: any; // CalendarioPago
  alumnoId: number;
}

export function EditarPagoModal({ isOpen, onClose, pagoData, alumnoId }: EditarPagoModalProps) {
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [montoOriginal, setMontoOriginal] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const utils = trpc.useUtils();

  useEffect(() => {
    if (pagoData && isOpen) {
      // Formatear fecha para el input tipo date (YYYY-MM-DD)
      const date = new Date(pagoData.fechaVencimiento);
      const isoDate = date.toISOString().split('T')[0];
      setFechaVencimiento(isoDate);
      setMontoOriginal(Number(pagoData.montoOriginal));
    }
  }, [pagoData, isOpen]);

  const updateMutation = trpc.pagos.updateAdeudo.useMutation({
    onSuccess: () => {
      setIsSubmitting(false);
      utils.pagos.getAdeudos.invalidate({ alumnoId });
      onClose();
    },
    onError: (err) => {
      setIsSubmitting(false);
      let message = err.message;
      try {
        const parsed = JSON.parse(message);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].message) {
          message = parsed.map((e: any) => e.message).join(' • ');
        }
      } catch (e) {
        // ignore
      }
      setErrorMsg(message || 'Error al actualizar el pago');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaVencimiento || montoOriginal < 0) {
      setErrorMsg('Por favor verifica los datos introducidos.');
      return;
    }

    setIsSubmitting(true);
    updateMutation.mutate({
      calendarioPagoId: pagoData.calendarioPagoId,
      fechaVencimiento: new Date(fechaVencimiento).toISOString(),
      montoOriginal: montoOriginal
    });
  };

  if (!isOpen || !pagoData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 text-blue-700">
            <Edit3 size={24} />
            <h3 className="text-xl font-bold">Editar Cargo</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Concepto</label>
            <div className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl border border-gray-200 font-medium">
              {pagoData.concepto}
            </div>
            <p className="text-xs text-gray-500 mt-1">El concepto del pago no se puede modificar.</p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
              <Calendar size={16} className="text-blue-500" />
              Fecha de Vencimiento
            </label>
            <input
              type="date"
              value={fechaVencimiento}
              onChange={(e) => setFechaVencimiento(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
              <DollarSign size={16} className="text-blue-500" />
              Monto Original
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-500 font-semibold">$</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={montoOriginal}
                onChange={(e) => setMontoOriginal(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold"
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-700 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              <Save size={18} />
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

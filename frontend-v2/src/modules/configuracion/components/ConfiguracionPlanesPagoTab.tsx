import { useState } from 'react';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { trpc } from '../../../lib/trpc';
import { Button } from '../../../components/ui/Button';
import { PlanPagoFormModal } from './PlanPagoFormModal';

export function ConfiguracionPlanesPagoTab() {
  const { data: planesPago, isLoading } = trpc.inscripciones.getPlanesPago.useQuery();
  const utils = trpc.useContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  const deleteMutation = trpc.inscripciones.deletePlanPago.useMutation({
    onSuccess: () => {
      utils.inscripciones.getPlanesPago.invalidate();
    },
    onError: (err: any) => alert(err.message || 'Error al eliminar el plan de pago')
  });

  const handleDelete = (planPagoId: number, nombre: string) => {
    if (window.confirm(`¿Seguro que deseas eliminar el plan "${nombre}"?`)) {
      deleteMutation.mutate(planPagoId);
    }
  };

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const handleNewPlan = () => {
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return <div className="text-gray-500 text-center py-8">Cargando planes de pago...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Planes de Pago</h3>
          <p className="text-sm text-gray-500 mt-1">
            Configura los planes de financiamiento (meses, monto base, mensualidades) disponibles para asignar a los alumnos.
          </p>
        </div>
        <Button onClick={handleNewPlan} variant="primary" className="gap-2">
          <Plus size={18} /> Nuevo Plan
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-6 py-4 font-semibold">NOMBRE DEL PLAN</th>
              <th className="px-6 py-4 font-semibold text-center">MESES</th>
              <th className="px-6 py-4 font-semibold text-center">ESTADO</th>
              <th className="px-6 py-4 font-semibold text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {planesPago?.map((plan: any) => (
              <tr key={plan.planPagoId} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-navy-800">{plan.nombre}</p>
                  {plan.descripcion && (
                    <p className="text-xs text-gray-500 mt-1">{plan.descripcion}</p>
                  )}
                </td>
                <td className="px-6 py-4 text-center font-medium text-gray-700">
                  {plan.meses}
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      plan.activo
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-red-100 text-red-700 border border-red-200'
                    }`}
                  >
                    {plan.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(plan)}
                      className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                      title="Editar Plan"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(plan.planPagoId, plan.nombre)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Eliminar Plan"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {planesPago?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No hay planes de pago registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PlanPagoFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        planPago={editingPlan}
      />
    </div>
  );
}

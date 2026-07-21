import { useState } from 'react';
import { X, Users, ArrowRight, Save } from 'lucide-react';
import { trpc } from '../../../lib/trpc';
import { Button } from '../../../components/ui/Button';

interface ReinscripcionMasivaModalProps {
  grupoId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReinscripcionMasivaModal({ grupoId, isOpen, onClose, onSuccess }: ReinscripcionMasivaModalProps) {
  const [cicloIdDestino, setCicloIdDestino] = useState('');
  const { data: alumnosCierre } = trpc.grupos.getAlumnosCierreGrupo.useQuery({ grupoId }, { enabled: isOpen });
  const { data: ciclos } = trpc.grupos.getCiclos.useQuery(undefined, { enabled: isOpen });
  const { data: gruposDestino } = trpc.grupos.getGrupos.useQuery(
    cicloIdDestino ? { cicloId: Number(cicloIdDestino) } : undefined, 
    { enabled: isOpen }
  );
  const { data: planesPago } = trpc.inscripciones.getPlanesPago.useQuery(undefined, { enabled: isOpen });

  const reinscribirMutation = trpc.grupos.reinscripcionMasivaGrupo.useMutation({
    onSuccess: (data) => {
      window.alert(`Reinscripción exitosa. Procesados: ${data.procesados}, Errores: ${data.errores}`);
      onSuccess();
      onClose();
    },
    onError: (err) => {
      window.alert('Error: ' + err.message);
    }
  });

  const [grupoIdDestino, setGrupoIdDestino] = useState('');
  const [planPagoId, setPlanPagoId] = useState('');
  const [egresados, setEgresados] = useState(false);

  if (!isOpen) return null;

  // Filtrar solo los promovidos (que estén en TRANSICION_PENDIENTE, o inscripciones previas PROMOVIDO)
  // En alumnosCierre, los que no tienen adecuaciones o los que manualmente marcamos? 
  // Wait, alumnosCierre trae los alumnos del grupo en ese ciclo.
  // Vamos a mostrarlos todos y aplicar a los que seleccionen.
  
  const alumnosElegibles = alumnosCierre?.filter((a: any) => 
    a.estado === 'TRANSICION_PENDIENTE' || a.estado === 'ACTIVO'
  ) || [];

  const handleSubmit = () => {
    if (!cicloIdDestino) return alert('Selecciona el ciclo destino');
    if (!egresados && !grupoIdDestino) return alert('Selecciona el grupo destino (o marca como egresados)');
    if (!egresados && !planPagoId) return alert('Selecciona el plan de pagos por defecto');

    const promociones = alumnosElegibles.map((a: any) => ({
      alumnoId: a.alumnoId,
      grupoIdDestino: egresados ? null : Number(grupoIdDestino),
      egresado: egresados,
      planPagoId: egresados ? null : Number(planPagoId)
    }));

    reinscribirMutation.mutate({
      cicloIdDestino: Number(cicloIdDestino),
      promociones
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-xl font-bold text-navy-800 flex items-center gap-2">
              <Users className="text-blue-600" />
              Asistente de Reinscripción Masiva
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Promueve a los alumnos al siguiente grado y genera su calendario de pagos automáticamente.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="bg-blue-50/50 p-4 border border-blue-100 rounded-xl text-sm text-blue-800 flex gap-3">
            <ArrowRight className="shrink-0 text-blue-600" size={20} />
            <p>
              Se reinscribirán <strong>{alumnosElegibles.length} alumnos</strong> de este grupo. Asegúrate de configurar el ciclo destino correctamente.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Ciclo Escolar Destino
              </label>
              <select 
                value={cicloIdDestino} 
                onChange={e => setCicloIdDestino(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                <option value="">Selecciona un ciclo activo o próximo</option>
                {ciclos?.map((c: any) => (
                  <option key={c.cicloId} value={c.cicloId}>{c.nombre} {c.activo ? '(Activo)' : ''}</option>
                ))}
              </select>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <label className="flex items-center gap-2 cursor-pointer mb-4">
                <input 
                  type="checkbox" 
                  checked={egresados}
                  onChange={e => {
                    setEgresados(e.target.checked);
                    if (e.target.checked) {
                      setGrupoIdDestino('');
                      setPlanPagoId('');
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Estos alumnos son Egresados (Cambio de nivel o graduación)
                </span>
              </label>

              {!egresados && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Grupo Destino
                    </label>
                    <select 
                      value={grupoIdDestino} 
                      onChange={e => setGrupoIdDestino(e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl outline-none"
                    >
                      <option value="">Selecciona el grupo al que pasan</option>
                      {gruposDestino?.filter((g: any) => g.cicloId === Number(cicloIdDestino)).map((g: any) => (
                        <option key={g.grupoId} value={g.grupoId}>
                          {g.grado?.nombre} {g.nivel?.nombre} - Grupo {g.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Plan de Pagos a asignar
                    </label>
                    <select 
                      value={planPagoId} 
                      onChange={e => setPlanPagoId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl outline-none"
                    >
                      <option value="">Selecciona el plan</option>
                      {planesPago?.filter((p: any) => p.activo && !p.eliminadoEn).map((p: any) => (
                        <option key={p.planPagoId} value={p.planPagoId}>
                          {p.nombre} (Meses: {p.meses})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-2xl">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            disabled={reinscribirMutation.isPending || alumnosElegibles.length === 0}
            onClick={handleSubmit}
          >
            <Save size={18} className="mr-2 inline" />
            {reinscribirMutation.isPending ? 'Procesando...' : 'Ejecutar Reinscripción Masiva'}
          </Button>
        </div>
      </div>
    </div>
  );
}

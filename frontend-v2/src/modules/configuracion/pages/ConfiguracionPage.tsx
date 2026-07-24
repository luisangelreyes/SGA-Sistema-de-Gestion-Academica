import { useState, useEffect } from 'react';
import { trpc } from '../../../lib/trpc';
import { 
  Plus, Edit2, Trash2, Calendar, DollarSign, RefreshCw, 
  AlertTriangle, Check, Users 
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { CicloFormModal } from '../components/CicloFormModal';
import { ReinscripcionMasivaModal } from '../components/ReinscripcionMasivaModal';
import { ConfiguracionPromocionesTab } from '../components/ConfiguracionPromocionesTab';
import { ConfiguracionPlanesPagoTab } from '../components/ConfiguracionPlanesPagoTab';

type TabType = 'ciclos' | 'tarifas' | 'planes-pago' | 'promociones' | 'cierre';

export function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<TabType>('ciclos');

  // --- Ciclos Escolares ---
  const { data: ciclos, isLoading: loadingCiclos } = trpc.grupos.getCiclos.useQuery();
  const utils = trpc.useContext();

  const [isCicloModalOpen, setIsCicloModalOpen] = useState(false);
  const [editingCiclo, setEditingCiclo] = useState<any>(null);

  const deleteCicloMutation = trpc.grupos.deleteCiclo.useMutation({
    onSuccess: () => {
      utils.grupos.getCiclos.invalidate();
    }
  });

  const handleOpenNewCiclo = () => {
    setEditingCiclo(null);
    setIsCicloModalOpen(true);
  };

  const handleOpenEditCiclo = (ciclo: any) => {
    setEditingCiclo(ciclo);
    setIsCicloModalOpen(true);
  };

  const handleDeleteCiclo = (id: number) => {
    if (window.confirm('¿Seguro que deseas eliminar este ciclo escolar de forma lógica?')) {
      deleteCicloMutation.mutate(id);
    }
  };

  // --- Tarifas de Cobro (ANUAL) ---
  const [selectedCicloId, setSelectedCicloId] = useState<number | undefined>(undefined);
  const { data: niveles, isLoading: loadingNiveles } = trpc.grupos.getNiveles.useQuery();
  
  const { data: tarifas, isLoading: loadingTarifas } = trpc.pagos.getTarifas.useQuery(
    selectedCicloId ? { cicloId: selectedCicloId } : undefined,
    { enabled: !!selectedCicloId }
  );

  const createTarifaMutation = trpc.pagos.createTarifa.useMutation();
  const updateTarifaMutation = trpc.pagos.updateTarifa.useMutation();

  const [tarifaValores, setTarifaValores] = useState<Record<string, string>>({});
  const [tarifaExisten, setTarifaExisten] = useState<Record<string, number>>({});
  const [guardandoTarifas, setGuardandoTarifas] = useState(false);
  const [tarifaSuccess, setTarifaSuccess] = useState(false);
  const [editandoTarifas, setEditandoTarifas] = useState(false);
  const selectedCiclo = ciclos?.find((c: any) => c.cicloId === selectedCicloId);

  // --- Efectos ---
  useEffect(() => {
    setEditandoTarifas(false);
  }, [selectedCicloId]);

  useEffect(() => {
    if (ciclos && ciclos.length > 0 && !selectedCicloId) {
      const active = ciclos.find((c: any) => c.activo);
      setSelectedCicloId(active ? active.cicloId : ciclos[0].cicloId);
    }
  }, [ciclos, selectedCicloId]);

  useEffect(() => {
    if (tarifas && niveles) {
      const valores: Record<string, string> = {};
      const existen: Record<string, number> = {};
      niveles.forEach((n: any) => {
        ['INSCRIPCION', 'ARANCEL', 'MATERIAL', 'COLEGIATURA'].forEach((concepto) => {
          valores[`${n.nivelId}_${concepto}`] = '';
        });
      });
      tarifas.forEach((t: any) => {
        valores[`${t.nivelId}_${t.concepto}`] = String(t.monto);
        existen[`${t.nivelId}_${t.concepto}`] = t.tarifaId;
      });
      setTarifaValores(valores);
      setTarifaExisten(existen);
    }
  }, [tarifas, niveles]);

  // --- Handlers ---
  const handleTarifaChange = (nivelId: number, concepto: string, value: string) => {
    setTarifaValores(prev => ({
      ...prev,
      [`${nivelId}_${concepto}`]: value
    }));
  };

  const handleSaveTarifas = async () => {
    if (!selectedCicloId || !niveles) return;
    const conceptos = ['INSCRIPCION', 'ARANCEL', 'MATERIAL', 'COLEGIATURA'];
    let hasNegative = false;
    let hasInvalid = false;
    for (const n of niveles) {
      for (const c of conceptos) {
        const val = tarifaValores[`${n.nivelId}_${c}`];
        if (!val) continue;
        const monto = Number(val);
        if (isNaN(monto)) hasInvalid = true;
        else if (monto < 0) hasNegative = true;
      }
    }
    if (hasInvalid) { alert("Error de validación: Se han ingresado valores numéricos inválidos."); return; }
    if (hasNegative) { alert("Error de validación: No se permiten montos negativos."); return; }
    setGuardandoTarifas(true);
    setTarifaSuccess(false);
    try {
      for (const n of niveles) {
        for (const c of conceptos) {
          const key = `${n.nivelId}_${c}`;
          const val = tarifaValores[key];
          if (!val) continue;
          const monto = Number(val);
          const tarifaId = tarifaExisten[key];
          if (tarifaId) {
            await updateTarifaMutation.mutateAsync({ tarifaId, monto, concepto: c, cicloId: selectedCicloId, nivelId: n.nivelId });
          } else {
            await createTarifaMutation.mutateAsync({ cicloId: selectedCicloId, nivelId: n.nivelId, concepto: c, monto });
          }
        }
      }
      setTarifaSuccess(true);
      setEditandoTarifas(false);
      utils.pagos.getTarifas.invalidate({ cicloId: selectedCicloId });
      setTimeout(() => setTarifaSuccess(false), 3000);
    } catch (err) {
      alert('Excepción: Ocurrió un error al guardar algunas tarifas.');
    } finally {
      setGuardandoTarifas(false);
    }
  };

  // --- Cierre de Ciclo por Grupos ---
  const [selectedCicloCierreId, setSelectedCicloCierreId] = useState<number | undefined>(undefined);
  const [selectedGrupoCierreId, setSelectedGrupoCierreId] = useState<number | null>(null);
  const [promocionesState, setPromocionesState] = useState<Record<number, boolean>>({});
  const [showConfirmModal1, setShowConfirmModal1] = useState(false);
  const [showConfirmModal2, setShowConfirmModal2] = useState(false);
  const [confirmTextInput, setConfirmTextInput] = useState('');
  const [showReinscripcionMasivaModal, setShowReinscripcionMasivaModal] = useState(false);

  const { data: grupos, isLoading: loadingGrupos } = trpc.grupos.getGrupos.useQuery(
    selectedCicloCierreId ? { cicloId: selectedCicloCierreId } : undefined
  );

  useEffect(() => {
    if (ciclos && ciclos.length > 0 && !selectedCicloCierreId) {
      const active = ciclos.find((c: any) => c.activo);
      setSelectedCicloCierreId(active ? active.cicloId : ciclos[0].cicloId);
    }
  }, [ciclos, selectedCicloCierreId]);

  const { data: alumnosCierre, isLoading: loadingAlumnosCierre, refetch: refetchAlumnosCierre } = trpc.grupos.getAlumnosCierreGrupo.useQuery(
    { grupoId: selectedGrupoCierreId! },
    { enabled: !!selectedGrupoCierreId }
  );

  useEffect(() => {
    if (alumnosCierre) {
      const initial: Record<number, boolean> = {};
      alumnosCierre.forEach((a: any) => {
        initial[a.alumnoId] = !(a.tieneAdeudo || a.tieneReprobadas);
      });
      setPromocionesState(initial);
    }
  }, [alumnosCierre]);

  const cerrarCicloGrupoMutation = trpc.grupos.cerrarCicloGrupo.useMutation({
    onSuccess: () => {
      utils.grupos.getGrupos.invalidate();
      setSelectedGrupoCierreId(null);
      alert('Cierre de ciclo de grupo ejecutado exitosamente.');
    },
    onError: (err) => {
      alert(err.message || 'Error al ejecutar el cierre de ciclo.');
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Title */}
      <div className="flex justify-between items-end border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-navy-800">Configuración General</h2>
          <p className="text-gray-500">Gestión de reglas de negocio, ciclos escolares y tarifas financieras</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('ciclos')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'ciclos'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-navy-800'
          }`}
        >
          Ciclos Escolares
        </button>
        <button
          onClick={() => setActiveTab('tarifas')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'tarifas'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-navy-800'
          }`}
        >
          Finanzas y Tarifas
        </button>
        <button
          onClick={() => setActiveTab('planes-pago')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'planes-pago'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-navy-800'
          }`}
        >
          Planes de Pago
        </button>
        <button
          onClick={() => setActiveTab('promociones')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'promociones'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-navy-800'
          }`}
        >
          Promociones y Descuentos
        </button>
        <button
          onClick={() => setActiveTab('cierre')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'cierre'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-navy-800'
          }`}
        >
          Operaciones de Ciclo
        </button>
      </div>

      {/* Content Area */}
      <div className="mt-6">
        {activeTab === 'ciclos' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={handleOpenNewCiclo}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                <Plus size={18} /> Nuevo Ciclo
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-auto">
                {loadingCiclos ? (
                  <div className="p-8 text-center text-gray-400 flex items-center justify-center gap-2">
                    <RefreshCw className="animate-spin" size={18} /> Cargando ciclos escolares...
                  </div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 text-xs uppercase">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Nombre del Ciclo</th>
                        <th className="px-6 py-4 font-semibold">Fecha de Inicio</th>
                        <th className="px-6 py-4 font-semibold">Fecha de Término</th>
                        <th className="px-6 py-4 font-semibold text-center">Periodicidad</th>
                        <th className="px-6 py-4 font-semibold text-center">Estado</th>
                        <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ciclos?.map((c: any) => (
                        <tr key={c.cicloId} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-3">
                            <Calendar className="text-navy-500" size={18} />
                            {c.nombre}
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {new Date(c.fechaInicio).toLocaleDateString('es-MX', {
                              year: 'numeric', month: 'long', day: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {new Date(c.fechaFin).toLocaleDateString('es-MX', {
                              year: 'numeric', month: 'long', day: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 text-center text-gray-700 capitalize font-medium">
                            {c.periodicidad?.toLowerCase() || 'Anual'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              c.activo 
                                ? 'bg-green-50 text-green-700 border border-green-100' 
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}>
                              {c.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleOpenEditCiclo(c)}
                                className="p-2 text-navy-600 bg-navy-50 hover:bg-navy-100 rounded-lg transition-colors cursor-pointer"
                                title="Editar Ciclo"
                              >
                                <Edit2 size={15} />
                              </button>
                              {!c.activo && (
                                <button
                                  onClick={() => handleDeleteCiclo(c.cicloId)}
                                  className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                                  title="Eliminar Ciclo"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {ciclos?.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                            No hay ciclos escolares registrados. Crea uno nuevo.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <CicloFormModal
              isOpen={isCicloModalOpen}
              onClose={() => setIsCicloModalOpen(false)}
              cicloId={editingCiclo?.cicloId}
              initialData={editingCiclo ? {
                nombre: editingCiclo.nombre,
                fechaInicio: new Date(editingCiclo.fechaInicio).toISOString().split('T')[0],
                fechaFin: new Date(editingCiclo.fechaFin).toISOString().split('T')[0],
                activo: editingCiclo.activo,
                periodicidad: editingCiclo.periodicidad
              } : undefined}
            />
          </div>
        )}

        {activeTab === 'tarifas' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-8">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="text-red-600" size={20} />
                    <h3 className="font-bold text-navy-800 text-lg">Tarifas por Nivel Educativo</h3>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-semibold uppercase">Ciclo Escolar:</span>
                    <select
                      value={selectedCicloId || ''}
                      onChange={(e) => setSelectedCicloId(Number(e.target.value))}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 outline-none text-sm focus:ring-2 focus:ring-navy-500 bg-white"
                    >
                      {ciclos?.map((c: any) => (
                        <option key={c.cicloId} value={c.cicloId}>
                          {c.nombre} {c.activo ? '(Activo)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {!ciclos || ciclos.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-sm">
                    No hay ciclos escolares registrados.
                  </div>
                ) : loadingNiveles || loadingTarifas ? (
                  <div className="py-8 text-center text-gray-400 flex items-center justify-center gap-2">
                    <RefreshCw className="animate-spin" size={18} /> Cargando tarifas financieras...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-600 text-xs uppercase">
                          <th className="py-3 font-semibold">Nivel Educativo</th>
                          <th className="py-3 font-semibold text-center">Inscripción ($)</th>
                          <th className="py-3 font-semibold text-center">Arancel ($)</th>
                          <th className="py-3 font-semibold text-center">Materiales ($)</th>
                          <th className="py-3 font-semibold text-center">Colegiatura ($ / Mes)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {niveles?.map((n: any) => (
                          <tr key={n.nivelId}>
                            <td className="py-4 font-bold text-navy-800">{n.nombre}</td>
                            {['INSCRIPCION', 'ARANCEL', 'MATERIAL', 'COLEGIATURA'].map((c) => (
                              <td key={c} className="py-4 text-center">
                                <input
                                  type="number"
                                  disabled={!editandoTarifas}
                                  value={tarifaValores[`${n.nivelId}_${c}`] || ''}
                                  onChange={(e) => handleTarifaChange(n.nivelId, c, e.target.value)}
                                  className="w-20 text-center py-1.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-navy-500 font-medium disabled:bg-gray-50 disabled:text-gray-400"
                                  placeholder="0.00"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2 items-center">
                  {tarifaSuccess && (
                    <span className="text-green-600 text-sm font-semibold flex items-center gap-1.5 animate-in fade-in">
                      <Check size={16} /> Tarifas guardadas con éxito
                    </span>
                  )}
                  {selectedCiclo?.activo ? (
                    editandoTarifas ? (
                      <Button
                        onClick={handleSaveTarifas}
                        isLoading={guardandoTarifas}
                        disabled={loadingTarifas}
                        variant="primary"
                        className="rounded-xl px-6 py-2 font-medium"
                      >
                        Guardar Montos
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setEditandoTarifas(true)}
                        disabled={loadingTarifas}
                        variant="primary"
                        className="rounded-xl px-6 py-2 font-medium"
                      >
                        Modificar Montos
                      </Button>
                    )
                  ) : (
                    <span className="text-gray-400 text-xs font-semibold uppercase italic bg-gray-50 border border-gray-150 px-3 py-2 rounded-xl">
                      Solo lectura (Ciclo Inactivo)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'planes-pago' && (
          <div className="space-y-6">
            <ConfiguracionPlanesPagoTab />
          </div>
        )}

        {activeTab === 'promociones' && (
          <div className="space-y-6">
            <ConfiguracionPromocionesTab />
          </div>
        )}

        {activeTab === 'cierre' && (
          <div className="space-y-6">
            {!selectedGrupoCierreId ? (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-navy-800">Cierre de Ciclo por Grupos</h3>
                    <p className="text-xs text-gray-500">Selecciona un grupo para verificar el estado de sus alumnos y proceder con el cierre de ciclo.</p>
                  </div>
                  
                  {/* Selector de Ciclo para Operaciones */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-semibold uppercase">Ciclo a Operar:</span>
                    <select
                      value={selectedCicloCierreId || ''}
                      onChange={(e) => {
                        setSelectedCicloCierreId(Number(e.target.value));
                        setSelectedGrupoCierreId(null);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 outline-none text-sm focus:ring-2 focus:ring-orange-500 bg-white"
                    >
                      {ciclos?.map((c: any) => (
                        <option key={c.cicloId} value={c.cicloId}>
                          {c.nombre} {c.activo ? '(Activo)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {loadingGrupos ? (
                  <div className="p-8 text-center text-gray-400 flex items-center justify-center gap-2">
                    <RefreshCw className="animate-spin" size={18} /> Cargando grupos escolares...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 text-xs uppercase">
                        <tr>
                          <th className="px-6 py-4 font-semibold">Nivel Educativo</th>
                          <th className="px-6 py-4 font-semibold">Grado</th>
                          <th className="px-6 py-4 font-semibold">Grupo</th>
                          <th className="px-6 py-4 font-semibold">Ciclo Escolar</th>
                          <th className="px-6 py-4 font-semibold text-center">Estado del Ciclo</th>
                          <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {[...(grupos || [])]
                          .sort((a: any, b: any) => {
                            if (a.nivel.orden !== b.nivel.orden) {
                              return a.nivel.orden - b.nivel.orden;
                            }
                            if (a.grado?.numero !== b.grado?.numero) {
                              return (a.grado?.numero || 0) - (b.grado?.numero || 0);
                            }
                            return a.nombre.localeCompare(b.nombre);
                          })
                          .map((g: any) => (
                            <tr key={g.grupoId} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4 font-bold text-navy-800">
                                {g.nivel.nombre}
                              </td>
                              <td className="px-6 py-4 text-gray-700">
                                {g.grado?.nombre || '-'}
                              </td>
                              <td className="px-6 py-4 font-bold text-gray-900">
                                {g.nombre}
                              </td>
                              <td className="px-6 py-4 text-gray-500">
                                {g.ciclo.nombre}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  g.cerrado 
                                    ? 'bg-red-50 text-red-700 border border-red-100' 
                                    : 'bg-green-50 text-green-700 border border-green-100'
                                }`}>
                                  {g.cerrado ? 'Cerrado / Archivado' : 'Abierto / Cursando'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Button
                                  variant={g.cerrado ? 'ghost' : 'primary'}
                                  onClick={() => setSelectedGrupoCierreId(g.grupoId)}
                                  className="rounded-xl text-xs py-1.5 px-3"
                                >
                                  {g.cerrado ? 'Ver Expedientes' : 'Verificar y Cerrar'}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        {grupos?.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                              No hay grupos registrados.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                  <div>
                    <button
                      onClick={() => setSelectedGrupoCierreId(null)}
                      className="text-xs font-bold text-navy-500 hover:text-navy-700 flex items-center gap-1 mb-1 cursor-pointer"
                    >
                      ← Volver a lista de grupos
                    </button>
                    <h3 className="text-lg font-bold text-navy-800">
                      Cierre de Ciclo — Grupo {(grupos?.find((g: any) => g.grupoId === selectedGrupoCierreId) as any)?.nombre} ({(grupos?.find((g: any) => g.grupoId === selectedGrupoCierreId) as any)?.nivel.nombre})
                    </h3>
                    <p className="text-xs text-gray-500">Revisa la elegibilidad académica y financiera de los alumnos antes de cerrar.</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    (grupos?.find((g: any) => g.grupoId === selectedGrupoCierreId) as any)?.cerrado
                      ? 'bg-red-50 text-red-700 border border-red-100' 
                      : 'bg-green-50 text-green-700 border border-green-100'
                  }`}>
                    {(grupos?.find((g: any) => g.grupoId === selectedGrupoCierreId) as any)?.cerrado ? 'Cerrado' : 'Abierto'}
                  </span>
                </div>

                {loadingAlumnosCierre ? (
                  <div className="p-8 text-center text-gray-400 flex items-center justify-center gap-2">
                    <RefreshCw className="animate-spin" size={18} /> Cargando alumnos del grupo...
                  </div>
                ) : (
                  <div className="space-y-6">
                    {!(grupos?.find((g: any) => g.grupoId === selectedGrupoCierreId) as any)?.cerrado && alumnosCierre && alumnosCierre.length > 0 && (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          className="text-xs bg-gray-100 hover:bg-gray-200 py-1.5 px-3 rounded-lg"
                          onClick={() => {
                            const newPromociones: Record<number, boolean> = {};
                            alumnosCierre.forEach((a: any) => {
                              newPromociones[a.alumnoId] = true;
                            });
                            setPromocionesState(newPromociones);
                          }}
                        >
                          Seleccionar Todos
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-xs bg-gray-100 hover:bg-gray-200 py-1.5 px-3 rounded-lg text-red-600 hover:text-red-700"
                          onClick={() => setPromocionesState({})}
                        >
                          Desmarcar Todos
                        </Button>
                      </div>
                    )}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 text-xs uppercase">
                          <tr>
                            <th className="px-6 py-4 font-semibold">Matrícula</th>
                            <th className="px-6 py-4 font-semibold">Nombre Completo</th>
                            <th className="px-6 py-4 font-semibold">CURP</th>
                            <th className="px-6 py-4 font-semibold text-center">Estado Académico</th>
                            <th className="px-6 py-4 font-semibold text-center">Estado Financiero</th>
                            <th className="px-6 py-4 font-semibold text-center">Promover</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {alumnosCierre?.map((a: any) => (
                            <tr key={a.alumnoId} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4 text-gray-500">{a.matricula || '-'}</td>
                              <td className="px-6 py-4 font-bold text-gray-900">{a.nombreCompleto}</td>
                              <td className="px-6 py-4 text-gray-500 font-mono text-xs">{a.curp}</td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                  a.tieneReprobadas 
                                    ? 'bg-red-50 text-red-700 border border-red-100' 
                                    : 'bg-green-50 text-green-700 border border-green-100'
                                }`}>
                                  {a.tieneReprobadas ? 'Materias Reprobadas' : 'Regular'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                  a.tieneAdeudo 
                                    ? 'bg-red-50 text-red-700 border border-red-100' 
                                    : 'bg-green-50 text-green-700 border border-green-100'
                                }`}>
                                  {a.tieneAdeudo ? 'Adeudo Pendiente' : 'Al Corriente'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <input
                                  type="checkbox"
                                  disabled={(grupos?.find((g: any) => g.grupoId === selectedGrupoCierreId) as any)?.cerrado}
                                  checked={!!promocionesState[a.alumnoId]}
                                  onChange={(e) => {
                                    setPromocionesState(prev => ({
                                      ...prev,
                                      [a.alumnoId]: e.target.checked
                                    }));
                                  }}
                                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 disabled:opacity-50 cursor-pointer"
                                />
                              </td>
                            </tr>
                          ))}
                          {alumnosCierre?.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                No hay alumnos inscritos en este grupo.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {!(grupos?.find((g: any) => g.grupoId === selectedGrupoCierreId) as any)?.cerrado && (
                      <div className="flex justify-between items-center p-4 bg-slate-50 border border-gray-100 rounded-2xl">
                        <span className="text-xs text-gray-500 leading-relaxed max-w-md">
                          <strong>Aviso:</strong> Cerrar el ciclo escolar de este grupo bloqueará la edición de calificaciones y boletas. Los alumnos pasarán a estatus de <em>Transición Pendiente</em> hasta que se inscriban en el siguiente periodo.
                        </span>
                        <Button
                          variant="danger"
                          className="bg-red-600 hover:bg-red-700 shadow-sm rounded-xl px-6 py-2.5 font-bold cursor-pointer"
                          disabled={!alumnosCierre || alumnosCierre.length === 0}
                          onClick={() => setShowConfirmModal1(true)}
                        >
                          <AlertTriangle size={18} className="mr-2" /> Cerrar Ciclo de Grupo
                        </Button>
                      </div>
                    )}

                    {(grupos?.find((g: any) => g.grupoId === selectedGrupoCierreId) as any)?.cerrado && (
                      <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-2xl mt-4">
                        <span className="text-sm text-blue-800 leading-relaxed max-w-md">
                          Este grupo ya fue cerrado. Puedes usar el Asistente de Reinscripción Masiva para promover a los alumnos a su nuevo ciclo y grado.
                        </span>
                        <Button
                          className="bg-blue-600 hover:bg-blue-700 shadow-sm rounded-xl px-6 py-2.5 font-bold cursor-pointer text-white"
                          onClick={() => setShowReinscripcionMasivaModal(true)}
                        >
                          <Users size={18} className="mr-2 inline" /> Reinscripción Masiva
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={showConfirmModal1}
        onClose={() => setShowConfirmModal1(false)}
        title="Confirmación de Cierre de Ciclo"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-100 flex items-start gap-2.5">
            <AlertTriangle className="shrink-0 mt-0.5 text-red-600" size={18} />
            <p className="text-xs text-red-700">
              ¡ATENCIÓN! Esta operación es irreversible. Archivar los expedientes de este grupo congelará sus calificaciones y bloqueará cualquier edición futura de boletas para este periodo.
            </p>
          </div>
          <p className="text-sm text-navy-800">
            ¿Deseas continuar con el proceso de cierre para este grupo?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowConfirmModal1(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
              onClick={() => {
                setShowConfirmModal1(false);
                setConfirmTextInput('');
                setShowConfirmModal2(true);
              }}
            >
              Aceptar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showConfirmModal2}
        onClose={() => setShowConfirmModal2(false)}
        title="Doble Confirmación Requerida"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Para autorizar el cierre, escribe la palabra <strong className="text-red-600">"CONFIRMAR"</strong> (en mayúsculas) a continuación:
          </p>
          <Input
            value={confirmTextInput}
            onChange={(e) => setConfirmTextInput(e.target.value)}
            placeholder="Escribe CONFIRMAR"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowConfirmModal2(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-50"
              disabled={confirmTextInput !== 'CONFIRMAR' || cerrarCicloGrupoMutation.isPending}
              onClick={async () => {
                const promociones = Object.keys(promocionesState).map(alumnoId => ({
                  alumnoId: Number(alumnoId),
                  promover: promocionesState[Number(alumnoId)]
                }));
                try {
                  await cerrarCicloGrupoMutation.mutateAsync({
                    grupoId: selectedGrupoCierreId!,
                    promociones
                  });
                  setShowConfirmModal2(false);
                } catch (e) {
                  // error handles in mutation
                }
              }}
            >
              {cerrarCicloGrupoMutation.isPending ? 'Cerrando...' : 'Confirmar Cierre'}
            </Button>
          </div>
        </div>
      </Modal>

      {selectedGrupoCierreId && (
        <ReinscripcionMasivaModal
          grupoId={selectedGrupoCierreId}
          isOpen={showReinscripcionMasivaModal}
          onClose={() => setShowReinscripcionMasivaModal(false)}
          onSuccess={() => refetchAlumnosCierre()}
        />
      )}
    </div>
  );
}

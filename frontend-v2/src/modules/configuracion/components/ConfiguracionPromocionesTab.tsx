import { useState } from 'react';
import { trpc } from '../../../lib/trpc';
import { Plus, Trash2, Calendar, Percent, Edit2, Tag, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { PromocionModal } from './PromocionModal';

export function ConfiguracionPromocionesTab() {
  // Queries
  const { data: ciclos } = trpc.grupos.getCiclos.useQuery();
  const { data: niveles } = trpc.grupos.getNiveles.useQuery();
  const { data: grados } = trpc.grupos.getGrados.useQuery();
  const { data: ventanas, refetch: refetchVentanas } = trpc.inscripciones.getVentanas.useQuery();
  const { data: becas, refetch: refetchBecas } = trpc.becas.getBecas.useQuery();

  // Mutations
  const createVentana = trpc.inscripciones.createVentana.useMutation({
    onSuccess: () => {
      refetchVentanas();
      refetchBecas(); // Ventanas might create a Beca automatically
    }
  });
  const updateVentana = trpc.inscripciones.updateVentana.useMutation({
    onSuccess: () => refetchVentanas(),
    onError: (err: any) => alert(err.message || 'Error al actualizar ventana')
  });
  const deleteVentana = trpc.inscripciones.deleteVentana.useMutation({
    onSuccess: () => refetchVentanas()
  });

  const createBeca = trpc.becas.createBeca.useMutation({
    onSuccess: () => refetchBecas(),
    onError: (err: any) => alert(err.message || 'Error al crear beca')
  });
  const updateBeca = trpc.becas.updateBeca.useMutation({
    onSuccess: () => refetchBecas(),
    onError: (err: any) => alert(err.message || 'Error al actualizar beca')
  });
  const deleteBeca = trpc.becas.deleteBeca.useMutation({
    onSuccess: () => refetchBecas(),
    onError: (err) => alert(err.message || 'Error al eliminar beca')
  });

  // State: Ventana
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);

  // State: Beca
  const [editingBecaId, setEditingBecaId] = useState<number | null>(null);
  const [nombreBeca, setNombreBeca] = useState('');
  const [criterio, setCriterio] = useState('ACADEMICA');
  const [porcentajeBeca, setPorcentajeBeca] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const handleSaveVentana = (payload: any) => {
    if (editingData) {
      updateVentana.mutate({ ventanaId: editingData.ventanaId, ...payload });
    } else {
      createVentana.mutate(payload);
    }
    setIsModalOpen(false);
    setEditingData(null);
  };

  const handleEditVentana = (v: any) => {
    setEditingData(v);
    setIsModalOpen(true);
  };

  const handleCreateBeca = () => {
    if (!nombreBeca || !criterio || !porcentajeBeca) {
      alert('Llena los campos obligatorios');
      return;
    }
    const payload = {
      nombreBeca,
      criterio: criterio as any,
      porcentaje: Number(porcentajeBeca),
      descripcion
    };
    if (editingBecaId) {
      updateBeca.mutate({ becaId: editingBecaId, ...payload });
      setEditingBecaId(null);
    } else {
      createBeca.mutate(payload);
    }
    setNombreBeca('');
    setPorcentajeBeca('');
    setDescripcion('');
  };

  const handleEditBeca = (b: any) => {
    setEditingBecaId(b.becaId);
    setNombreBeca(b.nombreBeca);
    setCriterio(b.criterio);
    setPorcentajeBeca(b.porcentaje.toString());
    setDescripcion(b.descripcion || '');
  };

  const cancelEditBeca = () => {
    setEditingBecaId(null);
    setNombreBeca('');
    setPorcentajeBeca('');
    setDescripcion('');
  };

  return (
    <div className="space-y-8">

      {/* 1. Catálogo Global de Becas */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Tag className="text-blue-600" />
          Catálogo Global de Becas y Promociones
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Crea becas generales que podrás asignar manualmente a cualquier alumno desde su expediente.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl mb-4 border border-gray-200">
          <div>
            <label className="block text-sm text-gray-700 font-medium mb-1">Nombre</label>
            <input
              type="text"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={nombreBeca}
              onChange={e => setNombreBeca(e.target.value)}
              placeholder="Ej. Beca Talento Primaria"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 font-medium mb-1">Criterio</label>
            <select className="w-full p-2 border rounded-lg outline-none" value={criterio} onChange={e => setCriterio(e.target.value)}>
              <option value="ACADEMICA">Académica</option>
              <option value="SOCIOECONOMICA">Socioeconómica</option>
              <option value="DEPORTIVA">Deportiva</option>
              <option value="CULTURAL">Cultural</option>
              <option value="POR_HERMANOS">Por Hermanos</option>
              <option value="PROMOCION_TEMPRANA">Promoción Temprana</option>
              <option value="EXTERNA">Externa</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 font-medium mb-1">Descuento (%)</label>
            <input
              type="number"
              min="0" max="100"
              className="w-full p-2 border rounded-lg outline-none"
              value={porcentajeBeca}
              onChange={e => setPorcentajeBeca(e.target.value)}
              placeholder="Ej. 20"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 font-medium mb-1">Descripción</label>
            <input
              type="text"
              className="w-full p-2 border rounded-lg outline-none"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className="md:col-span-4 flex justify-end gap-2">
            {editingBecaId && (
              <Button onClick={cancelEditBeca} variant="outline">
                <X size={16} /> Cancelar
              </Button>
            )}
            <Button onClick={handleCreateBeca} disabled={createBeca.isPending || updateBeca.isPending}>
              {editingBecaId ? <><Edit2 size={16} /> Guardar Cambios</> : <><Plus size={16} /> Crear Beca</>}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {becas?.map((b: any) => (
            <div key={b.becaId} className="flex justify-between items-center p-4 border rounded-xl hover:bg-gray-50 transition-colors">
              <div>
                <p className="font-bold text-gray-800">
                  {b.nombreBeca} <span className="text-sm font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full ml-2">{b.criterio}</span>
                </p>
                <p className="text-sm text-gray-600 font-medium mt-1">
                  <Percent size={14} className="inline mr-1 text-green-600" />
                  {b.porcentaje}% de Descuento
                </p>
                {b.descripcion && <p className="text-xs text-gray-500 mt-1">{b.descripcion}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditBeca(b)}
                  className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg"
                  title="Editar Beca"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => { if (window.confirm(`¿Seguro que deseas eliminar la beca ${b.nombreBeca}?`)) deleteBeca.mutate(b.becaId); }}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                  title="Eliminar Beca"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {becas?.length === 0 && <p className="text-sm text-gray-500">No hay becas registradas.</p>}
        </div>
      </div>

      {/* 2. Ventanas de Inscripción (Automáticas) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="text-blue-600" />
          Reglas de Inscripción Temprana (Automáticas)
        </h3>
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500">
            Configura ventanas de tiempo donde las inscripciones obtendrán un descuento automático según su nivel o grado.
          </p>
          <Button onClick={() => { setEditingData(null); setIsModalOpen(true); }}>
            <Plus size={16} /> Nueva Promoción
          </Button>
        </div>

        <div className="space-y-3">
          {ventanas?.map((v: any) => (
            <div key={v.ventanaId} className="flex justify-between items-center p-4 border rounded-xl hover:bg-gray-50 transition-colors">
              <div>
                <h4 className="font-bold text-gray-800 mb-1">{v.nombrePromo || 'Promoción de Inscripción'}</h4>
                <p className="font-bold text-gray-700 mb-1">
                  <Percent size={14} className="inline mr-1 text-green-600" />
                  {v.descuentoInscripcion}% Inscripción
                  {v.beca ? ` + ${v.beca.porcentaje}% Beca Colegiatura` : ''}
                </p>
                <p className="text-sm text-gray-600 font-medium mb-1">
                  Aplica a: {v.gradosAplicables?.length === grados?.length ? 'Todos los grados y niveles' : v.gradosAplicables?.map((ga: any) => `${ga.grado?.nombre} ${ga.grado?.nivel?.nombre}`).join(', ')} | Ciclo: {v.ciclo?.nombre}
                </p>
                <p className="text-xs text-gray-500">
                  Del {new Date(v.fechaInicio).toLocaleDateString('es-MX', { timeZone: 'UTC' })} al {new Date(v.fechaFin).toLocaleDateString('es-MX', { timeZone: 'UTC' })}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditVentana(v)}
                  className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg"
                  title="Editar Ventana"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => { if (window.confirm('¿Eliminar esta regla automática?')) deleteVentana.mutate(v.ventanaId); }}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                  title="Eliminar Ventana"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {ventanas?.length === 0 && <p className="text-sm text-gray-500">No hay ventanas promocionales configuradas.</p>}
        </div>
      </div>

      <PromocionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveVentana}
        initialData={editingData}
        niveles={niveles || []}
        grados={grados || []}
        becas={becas || []}
        ciclos={ciclos || []}
      />

    </div>
  );
}

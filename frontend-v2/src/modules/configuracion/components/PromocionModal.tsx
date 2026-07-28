import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface PromocionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  niveles: any[];
  grados: any[];
  becas: any[];
  ciclos: any[];
}

export function PromocionModal({ isOpen, onClose, onSave, initialData, niveles, grados, becas, ciclos }: PromocionModalProps) {
  const [nombrePromo, setNombrePromo] = useState('');
  const [cicloId, setCicloId] = useState('');
  const [descuentoInscripcion, setDescuentoInscripcion] = useState('');
  const [becaId, setBecaId] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [selectedGrados, setSelectedGrados] = useState<number[]>([]);

  useEffect(() => {
    if (initialData && isOpen) {
      setNombrePromo(initialData.nombrePromo || '');
      setCicloId(initialData.cicloId?.toString() || '');
      setDescuentoInscripcion(initialData.descuentoInscripcion?.toString() || '');
      setBecaId(initialData.becaId?.toString() || '');
      setFechaInicio(initialData.fechaInicio ? initialData.fechaInicio.split('T')[0] : '');
      setFechaFin(initialData.fechaFin ? initialData.fechaFin.split('T')[0] : '');
      setSelectedGrados(initialData.gradosAplicables?.map((ga: any) => ga.gradoId) || []);
    } else {
      setNombrePromo('');
      setCicloId('');
      setDescuentoInscripcion('');
      setBecaId('');
      setFechaInicio('');
      setFechaFin('');
      setSelectedGrados([]);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleToggleGrado = (gradoId: number) => {
    setSelectedGrados(prev => 
      prev.includes(gradoId) ? prev.filter(id => id !== gradoId) : [...prev, gradoId]
    );
  };

  const handleSelect1rosGrados = () => {
    const primerosGrados = grados.filter(g => g.numero === 1).map(g => g.gradoId);
    setSelectedGrados(primerosGrados);
  };

  const handleSave = () => {
    if (!nombrePromo || !cicloId || !descuentoInscripcion || !fechaInicio || !fechaFin || selectedGrados.length === 0) {
      alert('Por favor llena todos los campos obligatorios y selecciona al menos un grado.');
      return;
    }
    onSave({
      nombrePromo,
      cicloId: Number(cicloId),
      descuentoInscripcion: Number(descuentoInscripcion),
      becaId: becaId ? Number(becaId) : undefined,
      fechaInicio: new Date(fechaInicio + 'T12:00:00').toISOString(),
      fechaFin: new Date(fechaFin + 'T12:00:00').toISOString(),
      activa: true,
      gradosId: selectedGrados
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {initialData ? 'Editar Promoción' : 'Nueva Promoción Automática'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Nombre de la Promoción</label>
              <input type="text" className="w-full p-2 border rounded-lg" value={nombrePromo} onChange={e => setNombrePromo(e.target.value)} placeholder="Ej. Promoción Nuevo Ingreso" />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Ciclo Escolar</label>
              <select className="w-full p-2 border rounded-lg" value={cicloId} onChange={e => setCicloId(e.target.value)}>
                <option value="">Selecciona...</option>
                {ciclos?.map((c: any) => <option key={c.cicloId} value={c.cicloId}>{c.nombre}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Beca Automática (Colegiaturas)</label>
              <select className="w-full p-2 border rounded-lg" value={becaId} onChange={e => setBecaId(e.target.value)}>
                <option value="">Ninguna</option>
                {becas?.map((b: any) => <option key={b.becaId} value={b.becaId}>{b.nombreBeca} ({b.porcentaje}%)</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descuento en Inscripción (%)</label>
              <input type="number" min="0" max="100" className="w-full p-2 border rounded-lg" value={descuentoInscripcion} onChange={e => setDescuentoInscripcion(e.target.value)} placeholder="Ej. 100" />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Vigencia Inicio</label>
                <input type="date" className="w-full p-2 border rounded-lg" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vigencia Fin</label>
                <input type="date" className="w-full p-2 border rounded-lg" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Aplica a los siguientes grados:</h3>
              <Button onClick={handleSelect1rosGrados} variant="outline" size="sm">
                Seleccionar todos los 1ros Grados
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {niveles?.map((nivel: any) => (
                <div key={nivel.nivelId} className="bg-gray-50 p-3 rounded-lg border">
                  <h4 className="font-medium text-gray-700 mb-2 border-b pb-1 flex items-center gap-2">
                    🏫 {nivel.nombre}
                  </h4>
                  <div className="space-y-2">
                    {grados?.filter((g: any) => g.nivelId === nivel.nivelId).map((grado: any) => (
                      <label key={grado.gradoId} className="flex items-center gap-2 cursor-pointer text-sm">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedGrados.includes(grado.gradoId) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                          {selectedGrados.includes(grado.gradoId) && <Check size={12} className="text-white" />}
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={selectedGrados.includes(grado.gradoId)}
                          onChange={() => handleToggleGrado(grado.gradoId)}
                        />
                        <span className="text-gray-700">{grado.nombre}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <Button onClick={onClose} variant="outline">Cancelar</Button>
          <Button onClick={handleSave}>Guardar Promoción</Button>
        </div>
      </div>
    </div>
  );
}

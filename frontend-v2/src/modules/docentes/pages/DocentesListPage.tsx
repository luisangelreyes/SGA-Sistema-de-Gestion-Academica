import { useState } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { trpc } from '../../../lib/trpc';
import { Button } from '../../../components/ui/Button';
import { DocenteFormModal } from '../components/DocenteFormModal';

export function DocentesListPage() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocente, setEditingDocente] = useState<any>(null);

  const { data: docentes, isLoading } = trpc.docentes.getAll.useQuery();

  const deleteMutation = trpc.docentes.delete.useMutation({
    onSuccess: () => utils.docentes.getAll.invalidate()
  });

  const handleOpenNew = () => {
    setEditingDocente(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (docente: any) => {
    setEditingDocente(docente);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number, nombre: string) => {
    if (confirm(`¿Seguro que deseas eliminar al docente "${nombre}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const filteredDocentes = docentes?.filter(d => 
    d.nombreCompleto.toLowerCase().includes(search.toLowerCase()) ||
    (d.especialidad && d.especialidad.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Docentes</h1>
          <p className="text-slate-400 text-sm mt-1">Directorio y asignación de profesores</p>
        </div>
        <Button onClick={handleOpenNew} className="flex items-center gap-2">
          <Plus size={18} />
          <span>Nuevo Docente</span>
        </Button>
      </div>

      <div className="bg-[#001429] rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o especialidad..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/30 text-slate-300 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Nombre Completo</th>
                <th className="p-4 font-semibold">Especialidad</th>
                <th className="p-4 font-semibold">Contacto</th>
                <th className="p-4 font-semibold">Estado</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-slate-300 divide-y divide-slate-700/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">Cargando docentes...</td>
                </tr>
              ) : filteredDocentes?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No se encontraron docentes.
                  </td>
                </tr>
              ) : (
                filteredDocentes?.map(docente => (
                  <tr key={docente.docenteId} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-medium text-white">{docente.nombreCompleto}</td>
                    <td className="p-4">
                      {docente.especialidad ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-900/30 text-blue-300 text-xs font-medium border border-blue-800/50">
                          {docente.especialidad}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 text-sm">
                        {docente.telefono ? <span>📞 {docente.telefono}</span> : null}
                        {docente.correo ? <span>✉️ {docente.correo}</span> : null}
                        {!docente.telefono && !docente.correo && <span className="text-slate-500">-</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        docente.activo 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {docente.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(docente)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(docente.docenteId, docente.nombreCompleto)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DocenteFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        docenteId={editingDocente?.docenteId}
        initialData={editingDocente}
      />
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';
import { Button } from '../../../../components/ui/Button/Button';
import { Input } from '../../../../components/ui/Input/Input';

export function TutoresListPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: tutores, isLoading, refetch } = trpc.tutores.getAll.useQuery();
  const deleteMutation = trpc.tutores.delete.useMutation();

  const filteredTutores = (tutores as any[])?.filter((t) => {
    const term = searchTerm.toLowerCase();
    return (
      t.nombreCompleto.toLowerCase().includes(term) ||
      t.correoElectronico?.toLowerCase().includes(term) ||
      t.curp?.toLowerCase().includes(term)
    );
  });

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar este tutor?')) {
      await deleteMutation.mutateAsync(id);
      refetch();
    }
  };

  return (
    <div className="list-page">
      <div className="list-page-header">
        <div className="search-bar">
          <Search className="search-icon" size={20} />
          <Input
            placeholder="Buscar por nombre, correo o CURP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="actions">
          <Button onClick={() => navigate('/tutores/nuevo')}>
            <Plus size={20} />
            Nuevo Tutor
          </Button>
        </div>
      </div>

      <div className="data-table-container">
        {isLoading ? (
          <div className="loading-state">Cargando tutores...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>CURP</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Factura</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredTutores?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    No se encontraron tutores.
                  </td>
                </tr>
              ) : (
                filteredTutores?.map((t) => (
                  <tr key={t.tutorId}>
                    <td className="font-medium">{t.nombreCompleto}</td>
                    <td>{t.curp || '-'}</td>
                    <td>{t.correoElectronico || '-'}</td>
                    <td>{t.telefono || '-'}</td>
                    <td>
                      <span className={`status-badge ${t.requiereFactura ? 'activo' : 'inactivo'}`}>
                        {t.requiereFactura ? 'SÍ' : 'NO'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/tutores/${t.tutorId}`)}
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-error"
                          onClick={() => handleDelete(t.tutorId)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

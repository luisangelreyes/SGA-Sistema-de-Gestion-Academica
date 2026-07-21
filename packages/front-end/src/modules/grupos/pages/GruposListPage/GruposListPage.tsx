import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';
import { Button } from '../../../../components/ui/Button/Button';
import { Table, type Column } from '../../../../components/ui/Table/Table';

import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import { GrupoFormModal } from '../../components/GrupoFormModal/GrupoFormModal';
import styles from '../NivelesListPage/NivelesListPage.module.css';

type GrupoRow = {
  grupoId: number;
  nombre: string;
  grado: number;
  letra: string;
  turno: string;
  capacidadMax: number;
  cicloId: number;
  nivelId: number;
  ciclo: { nombre: string };
  nivel: { nombre: string };
};

export function GruposListPage() {
  // Por simplicidad, no pasamos cicloId filtro a menos que queramos
  const { data: grupos, isLoading } = trpc.grupos.getGrupos.useQuery({});
  const utils = trpc.useUtils();
  const deleteMutation = trpc.grupos.deleteGrupo.useMutation({
    onSuccess: () => utils.grupos.getGrupos.invalidate()
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<GrupoRow | null>(null);

  const handleOpenNew = () => {
    setEditingGrupo(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (row: GrupoRow) => {
    setEditingGrupo(row);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Seguro que deseas eliminar este grupo? Se perderán las inscripciones asociadas.')) {
      deleteMutation.mutate(id);
    }
  };

  const columns: Column<GrupoRow>[] = [
    { header: 'ID', accessor: 'grupoId' },
    { header: 'Nombre', accessor: 'nombre' },
    { header: 'Grado y Letra', accessor: (row) => `${row.grado}° ${row.letra}` },
    { header: 'Nivel', accessor: (row) => row.nivel?.nombre },
    { header: 'Ciclo', accessor: (row) => row.ciclo?.nombre },
    { header: 'Turno', accessor: 'turno' },
    { header: 'Capacidad', accessor: 'capacidadMax' },
    {
      header: 'Acciones',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(row)}>
            <Edit2 size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.grupoId)}>
            <Trash2 size={16} color="var(--color-danger-600)" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Button onClick={handleOpenNew} leftIcon={<Plus size={18} />}>
          Nuevo Grupo
        </Button>
      </div>

      <div className={styles.tableWrapper}>
        {isLoading ? (
          <Spinner centered size={32} />
        ) : (
          <Table<GrupoRow>
            columns={columns}
            data={(grupos as unknown as GrupoRow[]) || []}
            keyExtractor={(row) => row.grupoId}
          />
        )}
      </div>

      <GrupoFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        grupoId={editingGrupo?.grupoId}
        initialData={editingGrupo}
      />
    </div>
  );
}

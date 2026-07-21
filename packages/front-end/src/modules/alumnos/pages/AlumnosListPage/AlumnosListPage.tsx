import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';
import { Button } from '../../../../components/ui/Button/Button';
import { Table, type Column } from '../../../../components/ui/Table/Table';
import { Input } from '../../../../components/ui/Input/Input';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import { useState } from 'react';
import styles from '../../../grupos/pages/NivelesListPage/NivelesListPage.module.css';

type AlumnoRow = {
  alumnoId: number;
  matricula: string | null;
  nombreCompleto: string;
  curp: string;
  sexo: string;
  estado: string;
  nivel: { nombre: string } | null;
};

export function AlumnosListPage() {
  const navigate = useNavigate();
  const { data: alumnos, isLoading } = trpc.alumnos.getAll.useQuery();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAlumnos = (alumnos as any[])?.filter(a => {
    const term = searchTerm.toLowerCase();
    return (
      a.nombreCompleto.toLowerCase().includes(term) ||
      a.curp.toLowerCase().includes(term) ||
      (a.matricula && a.matricula.toLowerCase().includes(term))
    );
  }) || [];

  const columns: Column<AlumnoRow>[] = [
    { 
      header: 'Alumno', 
      accessor: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600 }}>{row.nombreCompleto}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Matrícula: {row.matricula || 'N/A'}</span>
        </div>
      )
    },
    { header: 'Grupo/Nivel', accessor: (row) => row.nivel?.nombre || 'Sin Asignar' },
    { header: 'Tutor Principal', accessor: () => <span style={{ color: 'var(--color-text-muted)' }}>Sin asignar</span> },
    { header: 'Contacto', accessor: () => <span style={{ color: 'var(--color-text-muted)' }}>Tel: -</span> },
    {
      header: 'Acciones',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/alumnos/${row.alumnoId}`)}
          >
            Ver expediente
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Directorio Escolar</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button variant="secondary">Importar CSV</Button>
          <Button onClick={() => navigate('/alumnos/nuevo')} leftIcon={<Plus size={18} />}>
            Nuevo alumno
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flex: 1, alignItems: 'center' }}>
          <div style={{ width: '250px' }}>
            <Input
              placeholder="Buscar alumno, matrícula..."
              leftIcon={<Search size={18} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <option>Activos</option>
          </select>
          <select style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <option>Todos los niveles</option>
          </select>
          <select style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <option>Grado</option>
          </select>
          <select style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <option>Grupo</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Resultados: {filteredAlumnos.length}</span>
          <Button variant="secondary" size="sm">Exportar</Button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {isLoading ? (
          <Spinner centered />
        ) : (
          <Table<AlumnoRow>
            columns={columns}
            data={filteredAlumnos as AlumnoRow[]}
            keyExtractor={(row) => row.alumnoId.toString()}
          />
        )}
      </div>
    </div>
  );
}

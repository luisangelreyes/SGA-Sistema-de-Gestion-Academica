import React, { useState } from 'react';
import { trpc } from '../../../../lib/trpc';
import { FileText } from 'lucide-react';
import { Input } from '../../../../components/ui/Input/Input';
import { Button } from '../../../../components/ui/Button/Button';
import styles from './KardexPage.module.css';

export function KardexPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlumnoId, setSelectedAlumnoId] = useState<number | null>(null);

  // Búsqueda simplificada de alumnos (obtenemos inscripciones recientes)
  const { data: inscripciones } = trpc.inscripciones.getInscripciones.useQuery(undefined);

  const searchResults = React.useMemo(() => {
    if (!searchTerm || searchTerm.length < 3) return [];
    if (!inscripciones) return [];
    const term = searchTerm.toLowerCase();

    // Filtramos inscripciones y agrupamos por alumno para evitar duplicados
    const matched = inscripciones.filter(i =>
      i.alumno.nombreCompleto.toLowerCase().includes(term) ||
      i.alumno.matricula?.toLowerCase().includes(term)
    );

    const uniqueAlumnos = new Map();
    matched.forEach(i => {
      if (!uniqueAlumnos.has(i.alumnoId)) {
        uniqueAlumnos.set(i.alumnoId, i.alumno);
      }
    });

    return Array.from(uniqueAlumnos.values());
  }, [searchTerm, inscripciones]);

  // Consulta del Kardex
  const { data: kardex, isLoading: isLoadingKardex } = trpc.calificaciones.obtenerKardexCompleto.useQuery(
    { alumnoId: selectedAlumnoId! },
    { enabled: !!selectedAlumnoId }
  );

  const handleSelectAlumno = (alumnoId: number) => {
    setSelectedAlumnoId(alumnoId);
    setSearchTerm(''); // Limpiar búsqueda
  };

  const selectedAlumnoInfo = React.useMemo(() => {
    if (!selectedAlumnoId || !inscripciones) return null;
    return (inscripciones as any[]).find((i: any) => i.alumnoId === selectedAlumnoId)?.alumno;
  }, [selectedAlumnoId, inscripciones]);

  // Agrupar kardex por ciclo
  const kardexAgrupado = React.useMemo(() => {
    if (!kardex) return {};
    return kardex.reduce((acc: Record<string, any[]>, curr: any) => {
      if (!acc[curr.ciclo]) acc[curr.ciclo] = [];
      acc[curr.ciclo].push(curr);
      return acc;
    }, {});
  }, [kardex]);

  return (
    <div className={styles.container}>
      {/* Buscador */}
      <div className={styles.searchSection}>
        <div className={styles.searchBox}>
          <Input
            placeholder="Buscar alumno por nombre o matrícula (min. 3 letras)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {searchTerm.length >= 3 && searchResults.length > 0 && (
            <div className={styles.searchResults}>
              {searchResults.map(alumno => (
                <div
                  key={alumno.alumnoId}
                  className={styles.searchResultItem}
                  onClick={() => handleSelectAlumno(alumno.alumnoId)}
                >
                  <span className="font-medium">{alumno.nombreCompleto}</span>
                  <span className="text-secondary text-sm ml-2">{alumno.matricula}</span>
                </div>
              ))}
            </div>
          )}
          {searchTerm.length >= 3 && searchResults.length === 0 && (
            <div className={styles.searchResults}>
              <div className={styles.searchResultEmpty}>No se encontraron alumnos</div>
            </div>
          )}
        </div>
      </div>

      {/* Detalle Kárdex */}
      {selectedAlumnoId && (
        <div className={styles.kardexContent}>
          <div className={styles.header}>
            <div>
              <h2>Historial Académico (Kárdex)</h2>
              <p className="text-secondary">
                {selectedAlumnoInfo?.nombreCompleto} • Matrícula: {selectedAlumnoInfo?.matricula || 'N/A'}
              </p>
            </div>
            <Button variant="secondary">
              <FileText size={18} />
              Imprimir Kárdex
            </Button>
          </div>

          {isLoadingKardex ? (
            <div className="loading-state">Cargando historial...</div>
          ) : !kardex || kardex.length === 0 ? (
            <div className="empty-state">
              Este alumno no cuenta con historial de calificaciones registrado.
            </div>
          ) : (
            Object.entries(kardexAgrupado).map(([ciclo, registros]) => (
              <div key={ciclo} className={styles.cicloCard}>
                <h3 className={styles.cicloHeader}>Ciclo Escolar: {ciclo}</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nivel Académico</th>
                      <th>Materia</th>
                      <th>Calificación Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(registros as any[]).map((row: any, idx: number) => (
                      <tr key={idx}>
                        <td>{row.nivel}</td>
                        <td>{row.materia}</td>
                        <td className="font-medium text-primary">{row.calificacion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      )}

      {!selectedAlumnoId && (
        <div className="empty-state mt-8">
          <FileText size={48} className="text-secondary mb-4" />
          <p>Busque y seleccione un alumno para visualizar su trayectoria académica.</p>
        </div>
      )}
    </div>
  );
}

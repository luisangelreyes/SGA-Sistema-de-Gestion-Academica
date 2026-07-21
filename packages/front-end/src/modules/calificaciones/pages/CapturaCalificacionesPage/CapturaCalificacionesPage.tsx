import React, { useState, useMemo } from 'react';
import { trpc } from '../../../../lib/trpc';
import { Button } from '../../../../components/ui/Button/Button';
import { Save, AlertCircle } from 'lucide-react';
import styles from './CapturaCalificacionesPage.module.css';

export function CapturaCalificacionesPage() {
  const [cicloId, setCicloId] = useState<number | ''>('');
  const [grupoId, setGrupoId] = useState<number | ''>('');
  const [grupoMateriaId, setGrupoMateriaId] = useState<number | ''>('');
  const [periodoId, setPeriodoId] = useState<number | ''>('');
  const [tipoEvaluacion, setTipoEvaluacion] = useState<'PARCIAL' | 'BIMESTRE' | 'BLOQUE' | 'TRIMESTRE'>('PARCIAL');

  const { data: ciclos } = trpc.grupos.getCiclos.useQuery();
  const { data: grupos } = trpc.grupos.getGrupos.useQuery(cicloId ? { cicloId: Number(cicloId) } : undefined, {
    enabled: !!cicloId,
  });
  
  const selectedGrupo = useMemo(() => {
    return grupos?.find(g => g.grupoId === Number(grupoId));
  }, [grupos, grupoId]);

  // Obtener inscritos del ciclo
  const { data: inscripciones } = trpc.inscripciones.getInscripciones.useQuery(
    cicloId ? { cicloId: Number(cicloId) } : undefined,
    { enabled: !!cicloId }
  );

  const alumnosInscritos = useMemo(() => {
    if (!inscripciones || !grupoId) return [];
    return inscripciones.filter(i => i.grupoId === Number(grupoId)).map(i => i.alumno);
  }, [inscripciones, grupoId]);

  // Obtener calificaciones existentes
  const { data: calificacionesData, refetch: refetchCalificaciones, isFetching: isFetchingCalificaciones } = trpc.calificaciones.getPorGrupo.useQuery(
    { grupoMateriaId: Number(grupoMateriaId), periodoId: Number(periodoId) },
    { enabled: !!grupoMateriaId && !!periodoId }
  );

  const upsertMutation = trpc.calificaciones.upsert.useMutation({
    onSuccess: () => refetchCalificaciones()
  });

  // Manejo de estado local para edición rápida
  const [localGrades, setLocalGrades] = useState<Record<number, string>>({});

  const handleGradeChange = (alumnoId: number, value: string) => {
    setLocalGrades(prev => ({ ...prev, [alumnoId]: value }));
  };

  const handleGradeBlur = async (alumnoId: number) => {
    const value = localGrades[alumnoId];
    if (value === undefined) return;
    
    // Si el valor numérico está vacío, no actualizamos si no había nada, o tal vez borramos.
    // Por simplicidad en este MVP: si está vacío, lo ignoramos o lanzamos error si la mutación lo exige.
    if (value.trim() === '') return;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 10) {
      alert('La calificación debe ser un número entre 0 y 10');
      return;
    }

    try {
      await upsertMutation.mutateAsync({
        alumnoId,
        grupoMateriaId: Number(grupoMateriaId),
        periodoId: Number(periodoId),
        tipoEvaluacion,
        valorNumerico: numValue,
      });
    } catch (e) {
      console.error('Error al guardar calificación', e);
      alert('Error al guardar la calificación');
    }
  };

  // Combinar los alumnos con sus calificaciones
  const getExistingGrade = (alumnoId: number) => {
    const found = calificacionesData?.find(c => c.alumnoId === alumnoId);
    return found?.valorNumerico?.toString() || found?.valorCualitativo || '';
  };

  const isReady = !!grupoMateriaId && !!periodoId;

  return (
    <div className="list-page">
      <div className={styles.filtersPanel}>
        <div className={styles.filterGroup}>
          <label>Ciclo Escolar</label>
          <select value={cicloId} onChange={e => { setCicloId(e.target.value ? Number(e.target.value) : ''); setGrupoId(''); setGrupoMateriaId(''); }}>
            <option value="">Seleccione un ciclo</option>
            {ciclos?.map(c => <option key={c.cicloId} value={c.cicloId}>{c.nombre}</option>)}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Grupo</label>
          <select value={grupoId} onChange={e => { setGrupoId(e.target.value ? Number(e.target.value) : ''); setGrupoMateriaId(''); }} disabled={!cicloId}>
            <option value="">Seleccione un grupo</option>
            {grupos?.map(g => <option key={g.grupoId} value={g.grupoId}>{g.nombre} ({g.nivel.nombre})</option>)}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Materia</label>
          <select value={grupoMateriaId} onChange={e => setGrupoMateriaId(e.target.value ? Number(e.target.value) : '')} disabled={!grupoId}>
            <option value="">Seleccione una materia</option>
            {selectedGrupo?.materias.map(m => (
              <option key={m.grupoMateriaId} value={m.grupoMateriaId}>{m.materia.nombre}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Periodo de Evaluación</label>
          <select value={periodoId} onChange={e => setPeriodoId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">Seleccione un periodo</option>
            <option value="1">Periodo 1</option>
            <option value="2">Periodo 2</option>
            <option value="3">Periodo 3</option>
            <option value="4">Periodo 4</option>
            <option value="5">Periodo 5</option>
          </select>
        </div>
      </div>

      <div className="data-table-container mt-6">
        {!isReady ? (
          <div className="empty-state">
            <AlertCircle size={48} className="text-secondary mb-4" />
            <p>Seleccione Ciclo, Grupo, Materia y Periodo para iniciar la captura de calificaciones.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>No.</th>
                <th>Matrícula</th>
                <th>Nombre del Alumno</th>
                <th style={{ width: '150px' }}>Calificación</th>
                <th style={{ width: '100px' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {alumnosInscritos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">No hay alumnos inscritos en este grupo.</td>
                </tr>
              ) : (
                (alumnosInscritos as any[]).map((alumno: any, idx: number) => {
                  const existingGrade = getExistingGrade(alumno.alumnoId);
                  const displayValue = localGrades[alumno.alumnoId] !== undefined 
                    ? localGrades[alumno.alumnoId] 
                    : existingGrade;
                  
                  return (
                    <tr key={alumno.alumnoId}>
                      <td className="text-secondary">{idx + 1}</td>
                      <td>{alumno.matricula || '-'}</td>
                      <td className="font-medium">{alumno.nombreCompleto}</td>
                      <td>
                        <input 
                          type="text" 
                          className={styles.gradeInput}
                          value={displayValue}
                          onChange={(e) => handleGradeChange(alumno.alumnoId, e.target.value)}
                          onBlur={() => handleGradeBlur(alumno.alumnoId)}
                          placeholder="0.0"
                        />
                      </td>
                      <td>
                        {isFetchingCalificaciones ? (
                          <span className="text-secondary text-sm">Syncing...</span>
                        ) : (
                          existingGrade ? (
                            <span className="text-success text-sm font-medium">Guardado</span>
                          ) : (
                            <span className="text-warning text-sm">Pendiente</span>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

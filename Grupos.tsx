import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, Plus, Search, X, Edit, Trash2, ArrowLeft, GraduationCap } from 'lucide-react';
import { cursosService } from '../services/cursos.service';
import { gruposService } from '../services/grupos.service';
import { alumnosService } from '../services/alumnos.service';
import { useAuthStore } from '../store/useAuthStore';

export function Grupos() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.rol === 'ADMIN' || user?.rol === 'DIRECTOR';

  const [niveles, setNiveles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [docentes, setDocentes] = useState<any[]>([]);
  
  // Estado de Navegación
  const [cursoSeleccionado, setCursoSeleccionado] = useState<any | null>(null);

  // Modales
  const [isMateriaModalOpen, setIsMateriaModalOpen] = useState(false);
  const [isComisionModalOpen, setIsComisionModalOpen] = useState(false);
  const [alumnosDelGrado, setAlumnosDelGrado] = useState<any[]>([]);
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);
  const [filtroSeccion, setFiltroSeccion] = useState<string>('Todas');

  // Formularios
  const [nuevaMateria, setNuevaMateria] = useState({ nombre: '', tipo: 'curricular', docenteId: '' });
  const [nuevaComision, setNuevaComision] = useState({ seccion: '', titular: '' });

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await cursosService.obtenerTodos();
      if (res.data) setNiveles(res.data);
      const doc = await gruposService.obtenerDocentes();
      if (doc.data) setDocentes(doc.data);
    } catch (error) {
      console.error('Error cargando datos', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCrearMateria = async () => {
    if(!nuevaMateria.nombre) return alert('El nombre es requerido');
    try {
      await cursosService.crearMateria({
        ...nuevaMateria,
        nivelId: cursoSeleccionado.nivelId,
        grado: cursoSeleccionado.grado
      });
      setIsMateriaModalOpen(false);
      setNuevaMateria({ nombre: '', tipo: 'curricular', docenteId: '' });
      await cargarDatos();
      
      // Actualizar el curso seleccionado con los nuevos datos
      const nivelActualizado = niveles.find(n => n.nivelId === cursoSeleccionado.nivelId);
      const cursoActual = nivelActualizado?.cursos.find((c: any) => c.grado === cursoSeleccionado.grado);
      if(cursoActual) setCursoSeleccionado({...cursoActual, nivelId: cursoSeleccionado.nivelId, nombreNivel: cursoSeleccionado.nombreNivel});

    } catch (error) {
      alert('Error al crear materia');
    }
  };

  const handleCrearComision = async () => {
    if(!nuevaComision.seccion) return alert('La sección es requerida');
    try {
      await cursosService.crearComision({
        ...nuevaComision,
        nombre: `${cursoSeleccionado.grado}°${nuevaComision.seccion} ${cursoSeleccionado.nombreNivel}`,
        nivelId: cursoSeleccionado.nivelId,
        grado: cursoSeleccionado.grado
      });
      setIsComisionModalOpen(false);
      setNuevaComision({ seccion: '', titular: '' });
      await cargarDatos();
      window.location.reload(); 
    } catch (error) {
      alert('Error al crear comisión');
    }
  };

  const handleSeleccionarGrado = async (curso: any, nivel: any) => {
    setCursoSeleccionado({...curso, nivelId: nivel.nivelId, nombreNivel: nivel.nombreNivel});
    setLoadingAlumnos(true);
    try {
      const res = await alumnosService.getAlumnos({ nivel: nivel.codigoNivel, grado: curso.grado });
      setAlumnosDelGrado(res.data || res);
    } catch (error) {
      console.error('Error cargando alumnos del grado', error);
      setAlumnosDelGrado([]);
    } finally {
      setLoadingAlumnos(false);
    }
  };


  if (cursoSeleccionado) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCursoSeleccionado(null)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-navy-900">{cursoSeleccionado.nombre}</h1>
              <p className="text-gray-500 mt-1">{cursoSeleccionado.nombreNivel}</p>
            </div>
            {cursoSeleccionado.esEgreso && (
              <span className="ml-4 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                <GraduationCap className="w-4 h-4" /> Egreso
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* PLAN DE ESTUDIOS */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-navy-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" /> 
                Plan de Estudios ({cursoSeleccionado.materias?.length || 0})
              </h2>
              {isAdmin && (
                <button onClick={() => setIsMateriaModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors text-sm font-medium">
                  <Plus className="w-4 h-4" /> Añadir Materia
                </button>
              )}
            </div>
            <div className="p-6">
              {cursoSeleccionado.materias?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No hay materias asignadas a este grado.</div>
              ) : (
                <div className="space-y-4">
                  {cursoSeleccionado.materias?.map((mat: any) => (
                    <div key={mat.materiaId} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-100 transition-colors">
                      <div>
                        <p className="font-semibold text-navy-800">{mat.nombre}</p>
                        <p className="text-sm text-gray-500 capitalize">{mat.tipo}</p>
                      </div>
                      <div className="flex gap-2">
                        {/* More actions could go here */}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ALUMNOS DEL GRADO */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-wrap gap-4">
              <h2 className="text-xl font-bold text-navy-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" /> 
                Alumnos Inscritos ({filtroSeccion === 'Todas' ? alumnosDelGrado.length : alumnosDelGrado.filter(a => a.grupo?.seccion === filtroSeccion).length})
              </h2>
              <div className="flex gap-2">
                <select value={filtroSeccion} onChange={e => setFiltroSeccion(e.target.value)} className="text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none text-navy-800 focus:border-emerald-500 transition-colors">
                  <option value="Todas">Todas las Secciones</option>
                  {Array.from(new Set(cursoSeleccionado.comisiones?.map((c: any) => c.seccion))).filter(Boolean).map((sec: any) => (
                    <option key={sec} value={sec}>Sección {sec}</option>
                  ))}
                </select>
                {isAdmin && (
                  <button onClick={() => setIsComisionModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors text-sm font-medium">
                    <Plus className="w-4 h-4" /> Agregar Sección
                  </button>
                )}
              </div>
            </div>
            <div className="p-6">
              {loadingAlumnos ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>
              ) : alumnosDelGrado.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No hay alumnos inscritos en este grado.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="pb-3 font-semibold text-gray-600 text-sm">Matrícula</th>
                        <th className="pb-3 font-semibold text-gray-600 text-sm">Nombre</th>
                        <th className="pb-3 font-semibold text-gray-600 text-sm">Grupo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(filtroSeccion === 'Todas' ? alumnosDelGrado : alumnosDelGrado.filter(a => a.grupo?.seccion === filtroSeccion)).map((alumno: any) => (
                        <tr key={alumno.alumnoId} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/alumnos/${alumno.alumnoId}`)}>
                          <td className="py-3 text-sm text-gray-600 font-medium">{alumno.matricula || '-'}</td>
                          <td className="py-3 text-sm font-semibold text-navy-900">{alumno.nombreCompleto || alumno.nombre}</td>
                          <td className="py-3 text-sm text-gray-600">
                            <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-600">{alumno.grupo?.nombre || 'Sin grupo'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Materia */}
        {isMateriaModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-xl text-slate-800">Nueva Materia</h3>
                <button onClick={() => setIsMateriaModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre de la Materia</label>
                  <input type="text" value={nuevaMateria.nombre} onChange={e => setNuevaMateria({...nuevaMateria, nombre: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-colors" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tipo de Materia</label>
                  <div className="flex gap-2">
                    {[
                      { label: 'CURRICULAR', value: 'curricular' },
                      { label: 'EXTRA', value: 'extracurricular' },
                      { label: 'TALLER', value: 'taller' }
                    ].map(t => (
                      <button 
                        key={t.value}
                        onClick={() => setNuevaMateria({...nuevaMateria, tipo: t.value})}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors ${nuevaMateria.tipo === t.value ? 'bg-[#001433] text-white border-[#001433]' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nivel Educativo</label>
                    <select 
                      disabled
                      value={cursoSeleccionado.nivelId} 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50 text-slate-500 text-sm"
                    >
                      <option value={cursoSeleccionado.nivelId}>{cursoSeleccionado.nombreNivel}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Grado Escolar (Opcional)</label>
                    <select 
                      disabled 
                      value={cursoSeleccionado.grado} 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50 text-slate-500 text-sm"
                    >
                      <option value={cursoSeleccionado.grado}>{cursoSeleccionado.grado} Grado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Docente Asignado (Opcional)</label>
                  <select 
                    value={nuevaMateria.docenteId} 
                    onChange={e => setNuevaMateria({...nuevaMateria, docenteId: e.target.value})} 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-colors text-sm text-slate-600"
                  >
                    <option value="">Buscar maestro por nombre...</option>
                    {docentes.map(d => (
                      <option key={d.usuarioId} value={d.usuarioId}>{d.nombreCompleto || d.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setIsMateriaModalOpen(false)} className="px-5 py-2 font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
                  <button onClick={handleCrearMateria} className="px-5 py-2 font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Guardar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Comision */}
        {isComisionModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-lg text-navy-900">Nueva Sección</h3>
                <button onClick={() => setIsComisionModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sección (ej: A, B, C)</label>
                  <input type="text" value={nuevaComision.seccion} onChange={e => setNuevaComision({...nuevaComision, seccion: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Docente Titular (Opcional)</label>
                  <select value={nuevaComision.titular} onChange={e => setNuevaComision({...nuevaComision, titular: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl">
                    <option value="">Sin asignar</option>
                    {docentes.map(d => (
                      <option key={d.usuarioId} value={d.usuarioId}>{d.nombreCompleto || d.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setIsComisionModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-xl">Cancelar</button>
                  <button onClick={handleCrearComision} className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700">Crear</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // VISTA PRINCIPAL: Lista de Niveles y Cursos
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-900">Grados Académicos</h1>
        <p className="text-gray-500 mt-2">Gestiona los planes de estudio y los alumnos inscritos de cada nivel educativo.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
      ) : (
        <div className="space-y-8">
          {niveles.map((nivel) => (
            <div key={nivel.nivelId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-navy-900 p-4 px-6">
                <h2 className="text-lg font-bold text-white uppercase tracking-wider">{nivel.nombreNivel}</h2>
              </div>
              <div className="p-6">
                {nivel.cursos.length === 0 ? (
                  <p className="text-gray-500 italic">No hay grados registrados en este nivel.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {nivel.cursos.map((curso: any) => (
                      <div 
                        key={curso.grado} 
                        onClick={() => handleSeleccionarGrado(curso, nivel)}
                        className="group p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                      >
                        {curso.esEgreso && (
                          <div className="absolute top-0 right-0 bg-amber-400 text-amber-900 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                            Egreso
                          </div>
                        )}
                        <h3 className="text-lg font-bold text-navy-800 mb-2 group-hover:text-indigo-600 transition-colors">
                          {curso.nombre}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-4">
                          <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-gray-400" /> {curso.materias?.length} Materias</span>
                          <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-gray-400" /> {curso.cantidadAlumnos || 0} Alumnos</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {isAdmin && (
                  <button 
                    onClick={() => {
                      const nuevoGrado = prompt("Ingresa el número de grado para crear (ej. 1):");
                      if(nuevoGrado) {
                        cursosService.crearComision({
                          nombre: `${nuevoGrado}° ${nivel.nombreNivel}`,
                          nivelId: nivel.nivelId,
                          grado: nuevoGrado,
                          seccion: 'A'
                        }).then(() => window.location.reload()).catch(() => alert('Error'));
                      }
                    }}
                    className="mt-6 flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Inicializar Nuevo Grado
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

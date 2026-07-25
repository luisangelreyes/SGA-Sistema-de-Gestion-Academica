import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { trpc } from '../../../lib/trpc';
import { ChevronLeft, User, Crown, Mail, Phone, BookOpen, Users, Link2Off, Plus, Calculator, Trash2, UploadCloud, Eye, X, Download } from 'lucide-react';
import { useMemo } from 'react';
import toast from 'react-hot-toast';
import { VincularTutorModal } from '../components/VincularTutorModal';
import { InscribirAlumnoModal } from '../components/InscribirAlumnoModal';
import { AsignarPlanPagoModal } from '../components/AsignarPlanPagoModal';
import { AsignarBecaModal } from '../components/AsignarBecaModal';

export function ExpedienteAlumnoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [isVincularModalOpen, setIsVincularModalOpen] = useState(false);
  const [isInscribirModalOpen, setIsInscribirModalOpen] = useState(false);
  const [isAsignarPlanModalOpen, setIsAsignarPlanModalOpen] = useState(false);
  const [isAsignarBecaModalOpen, setIsAsignarBecaModalOpen] = useState(false);

  // Document Viewer State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');
  const [viewerType, setViewerType] = useState('');
  const [viewerName, setViewerName] = useState('');

  const alumnoId = parseInt(id || '0', 10);
  
  const { data: alumno, isLoading, error } = trpc.alumnos.getById.useQuery(alumnoId, { enabled: !!alumnoId });

  const unlinkTutorMutation = trpc.alumnos.unlinkTutor.useMutation({
    onSuccess: () => {
      utils.alumnos.getById.invalidate(alumnoId);
    }
  });

  const handleUnlink = (tutorAlumnoId: number) => {
    if (window.confirm('¿Estás seguro de que deseas desvincular a este responsable?')) {
      unlinkTutorMutation.mutate({ tutorAlumnoId });
    }
  };

  const inscripcionActual = useMemo(() => {
    if (!alumno?.inscripciones) return null;
    return alumno.inscripciones.find((i: any) => i.estadoEnCiclo === 'INSCRITO' && i.ciclo.activo);
  }, [alumno]);

  const asignacionesBeca = (alumno as any)?.asignacionesBeca;

  const asignacionActual = useMemo(() => {
    if (!asignacionesBeca || !inscripcionActual) return null;
    return asignacionesBeca.find((a: any) => a.cicloId === inscripcionActual.cicloId && a.estado === 'ACTIVA');
  }, [asignacionesBeca, inscripcionActual]);

  const becaActual = asignacionActual?.beca;

  const revokeBecaMutation = trpc.becas.revokeBeca.useMutation({
    onSuccess: () => {
      window.alert('Beca/Promoción retirada con éxito.');
      utils.alumnos.getById.invalidate(alumnoId);
    },
    onError: (err) => {
      window.alert(err.message || 'Error al retirar la beca.');
    }
  });

  const quitarPlanMutation = trpc.inscripciones.quitarPlanPago.useMutation({
    onSuccess: () => {
      window.alert('Plan de pago removido con éxito.');
      utils.alumnos.getById.invalidate(alumnoId);
    },
    onError: (err) => {
      window.alert(err.message || 'Error al quitar el plan de pagos.');
    }
  });

  const adjuntarMutation = trpc.pagos.adjuntarComprobante.useMutation({
    onSuccess: () => {
      toast.success('Comprobante adjuntado con éxito');
      utils.alumnos.getById.invalidate(alumnoId);
    },
    onError: (err) => {
      toast.error(err.message || 'Error al adjuntar comprobante');
    }
  });

  const handleAdjuntar = (pagoId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande (máx 5MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      adjuntarMutation.mutate({
        pagoId,
        alumnoId,
        comprobanteBase64: reader.result as string,
        comprobanteNombre: file.name,
        comprobanteMime: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleVerComprobante = async (pagoId: number) => {
    const toastId = toast.loading('Cargando comprobante...');
    try {
      const data = await utils.pagos.getComprobanteBase64.fetch({ pagoId });
      toast.dismiss(toastId);
      
      const base64Data = data.base64.split(',')[1];
      const binaryStr = window.atob(base64Data);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: data.mime });
      const blobUrl = URL.createObjectURL(blob);
      
      setViewerUrl(blobUrl);
      setViewerType(data.mime);
      setViewerName(data.nombre);
      setViewerOpen(true);
      
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(error.message || 'Error al visualizar el comprobante');
    }
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setTimeout(() => {
      URL.revokeObjectURL(viewerUrl);
      setViewerUrl('');
    }, 300);
  };

  const handleQuitarPlan = (inscripcionId: number) => {
    if (window.confirm('¿Estás seguro que deseas quitar el plan de pagos? Esto borrará el calendario de recibos generado (siempre y cuando no tengan pagos aplicados).')) {
      quitarPlanMutation.mutate({ inscripcionId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#001429]"></div>
      </div>
    );
  }

  if (error || !alumno) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-500">
        <p>No se pudo cargar el expediente del alumno.</p>
        <button 
          onClick={() => navigate('/alumnos')}
          className="mt-4 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
        >
          Volver al directorio
        </button>
      </div>
    );
  }

  const formatFecha = (fecha: string | Date) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      timeZone: 'UTC',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <button
          onClick={() => navigate('/alumnos')}
          className="p-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors mt-1"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">{alumno.nombreCompleto}</h1>
            {alumno.estado === 'ACTIVO' ? (
              <span className="px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">Activo</span>
            ) : alumno.estado.includes('BAJA') ? (
              <span className="px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">{alumno.estado.replace('_', ' ')}</span>
            ) : (
              <span className="px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">{alumno.estado.replace('_', ' ')}</span>
            )}
          </div>
          <p className="text-gray-500 mt-1">Matrícula: {alumno.matricula || 'Sin matrícula'}</p>
        </div>
      </div>

      {/* Información Personal */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-4 px-1">
          <User size={20} />
          <h2>Información Personal</h2>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
            <div>
              <p className="text-sm text-gray-500 mb-1">Nombre Completo</p>
              <p className="font-medium text-gray-900">{alumno.nombreCompleto}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Fecha de Nacimiento</p>
              <p className="font-medium text-gray-900">{formatFecha(alumno.fechaNacimiento)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Matrícula</p>
              <p className="font-medium text-gray-900">{alumno.matricula || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Sexo</p>
              <p className="font-medium text-gray-900">{alumno.sexo === 'M' ? 'Masculino' : 'Femenino'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">CURP</p>
              <p className="font-medium text-gray-900">{alumno.curp || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Nivel Educativo</p>
              <p className="font-medium text-gray-900">{alumno.nivel?.nombre || '-'}</p>
            </div>
            {alumno.estado.includes('BAJA') && (
              <>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Fecha de Baja</p>
                  <p className="font-medium text-gray-900">{alumno.fechaBaja ? formatFecha(alumno.fechaBaja) : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Motivo de Baja</p>
                  <p className="font-medium text-gray-900">{alumno.motivoBaja || '-'}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Responsables */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold">
            <Users size={20} />
            <h2>Responsables</h2>
          </div>
          <button
            onClick={() => setIsVincularModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 font-medium rounded-lg hover:bg-emerald-100 transition-colors text-sm"
          >
            <Plus size={16} /> Vincular tutor
          </button>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
          {alumno.tutoresAlumnos && alumno.tutoresAlumnos.length > 0 ? (
            alumno.tutoresAlumnos.map((relacion: any) => (
              <div key={relacion.tutorAlumnoId} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{relacion.tutor.nombreCompleto}</span>
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                      {relacion.parentesco}
                    </span>
                    {relacion.esPrincipal && (
                      <span title="Tutor Principal">
                        <Crown size={16} className="text-amber-500" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {relacion.tutor.correoElectronico ? (
                      <div className="flex items-center gap-1.5">
                        <Mail size={14} />
                        <span>{relacion.tutor.correoElectronico}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Phone size={14} />
                        <span>{relacion.tutor.telefono || 'Sin contacto registrado'}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnlink(relacion.tutorAlumnoId);
                  }}
                  disabled={unlinkTutorMutation.isPending}
                  title="Desvincular tutor"
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0 disabled:opacity-50"
                >
                  <Link2Off size={18} />
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm p-4 text-center">No hay responsables asignados.</p>
          )}
        </div>
      </div>

      {/* Inscripciones */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold">
            <BookOpen size={20} />
            <h2>Inscripciones a Comisiones <span className="text-gray-400 font-normal text-sm ml-1">({alumno.inscripciones?.length || 0})</span></h2>
          </div>
          {!inscripcionActual && (
            <button
              onClick={() => setIsInscribirModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors text-sm"
            >
              <Plus size={16} /> Inscribir a Ciclo
            </button>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          {inscripcionActual ? (
            <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/50">
              <p className="font-semibold text-gray-900">
                {inscripcionActual.grupo?.grado?.nombre || alumno.grado?.nombre || 'Grado sin asignar'} 
                {' - '}
                Grupo {inscripcionActual.grupo?.nombre || 'Sin grupo'}
                <span className="text-gray-500 ml-2 font-normal">({inscripcionActual.ciclo.nombre})</span>
              </p>

              {becaActual ? (
                <div className="mt-3 flex items-center justify-between bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                  <div className="text-sm font-medium text-emerald-800">
                    Beca/Promoción Activa: {becaActual.nombreBeca} ({becaActual.porcentaje}%)
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('¿Seguro que deseas retirar esta beca/promoción? Si el alumno ya tiene un plan de pagos asignado, deberás quitárselo y volvérselo a asignar para que se recalculen los cobros con la tarifa regular.')) {
                        revokeBecaMutation.mutate({ 
                          asignacionId: asignacionActual.asignacionId, 
                          motivoRetiro: 'Retiro manual desde el expediente' 
                        });
                      }
                    }}
                    disabled={revokeBecaMutation.isPending}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Retirar Beca/Promoción"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : !inscripcionActual.planPago ? (
                <div className="mt-3 flex items-center justify-between bg-gray-50/50 p-3 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600">
                    El alumno no tiene becas ni promociones en este ciclo.
                  </div>
                  <button
                    onClick={() => setIsAsignarBecaModalOpen(true)}
                    className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm shadow-sm"
                  >
                    Asignar Beca
                  </button>
                </div>
              ) : null}

              {inscripcionActual.planPago ? (
                <div className="mt-3 flex items-center justify-between bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                  <div className="text-sm font-medium text-blue-800">
                    Plan de pagos asignado: {inscripcionActual.planPago.nombre}
                  </div>
                  <button
                    onClick={() => handleQuitarPlan(inscripcionActual.inscripcionId)}
                    disabled={quitarPlanMutation.isLoading}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Quitar plan de pagos"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                  <div className="text-sm text-amber-800">
                    <span className="font-semibold">Atención:</span> El alumno no tiene plan de pagos asignado.
                  </div>
                  <button
                    onClick={() => setIsAsignarPlanModalOpen(true)}
                    className="px-3 py-1.5 bg-amber-100 text-amber-700 font-medium rounded-lg hover:bg-amber-200 transition-colors text-sm"
                  >
                    Asignar Plan
                  </button>
                </div>
              )}
            </div>
          ) : alumno.inscripciones && alumno.inscripciones.length > 0 ? (
            <div className="space-y-3">
              {alumno.inscripciones.map((insc: any) => (
                <div key={insc.inscripcionId} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 opacity-75">
                  <p className="font-semibold text-gray-900">
                    {insc.grupo?.grado?.nombre || alumno.grado?.nombre || 'Grado sin asignar'} 
                    {' - '}
                    Grupo {insc.grupo?.nombre || 'Sin grupo'}
                    <span className="text-gray-500 ml-2 font-normal">({insc.ciclo.nombre}) - {insc.estadoEnCiclo}</span>
                  </p>
                  {insc.planPago && (
                    <div className="mt-2 inline-flex items-center px-2.5 py-1 rounded-md bg-gray-200 text-gray-700 text-xs font-medium">
                      Plan asignado: {insc.planPago.nombre}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm p-4 text-center">El alumno no cuenta con inscripciones registradas.</p>
          )}
        </div>
      </div>

      {/* Calendario de Pagos */}
      {(alumno.calendariosPagos && alumno.calendariosPagos.length > 0) && (
        <div className="mt-8">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-4 px-1">
            <Calculator size={20} />
            <h2>Calendario de Pagos</h2>
          </div>
          {Array.from(new Set(alumno.calendariosPagos.map((p: any) => p.cicloId))).map((cicloId: any) => {
            const pagosCiclo = alumno.calendariosPagos.filter((p: any) => p.cicloId === cicloId);
            const nombreCiclo = pagosCiclo[0]?.ciclo?.nombre || `Ciclo ${cicloId}`;
            
            return (
              <div key={cicloId} className="mb-6 last:mb-0">
                <h3 className="text-sm font-medium text-gray-500 mb-2 px-1">Ciclo Escolar: <span className="font-semibold text-gray-700">{nombreCiclo}</span></h3>
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-3 font-semibold text-gray-700">Mes</th>
                          <th className="px-6 py-3 font-semibold text-gray-700">Concepto</th>
                          <th className="px-6 py-3 font-semibold text-gray-700">Vencimiento</th>
                          <th className="px-6 py-3 font-semibold text-gray-700">Monto</th>
                          <th className="px-6 py-3 font-semibold text-gray-700">Referencia</th>
                          <th className="px-6 py-3 font-semibold text-gray-700">Comprobante</th>
                          <th className="px-6 py-3 font-semibold text-gray-700">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {pagosCiclo.map((pago: any) => (
                          <tr key={pago.calendarioPagoId} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-3 font-medium text-gray-900">{pago.mes || '-'}</td>
                            <td className="px-6 py-3 text-gray-600">{pago.concepto}</td>
                            <td className="px-6 py-3 text-gray-600">
                              {formatFecha(pago.fechaVencimiento)}
                            </td>
                            <td className="px-6 py-3 font-semibold text-gray-900">
                              ${Number(pago.montoOriginal).toFixed(2)}
                            </td>
                            <td className="px-6 py-3 text-gray-600">
                              {pago.aplicacionesPago?.[0]?.pago?.observaciones || '-'}
                            </td>
                            <td className="px-6 py-3">
                              {pago.aplicacionesPago?.[0]?.pago && (
                                pago.aplicacionesPago[0].pago.documentos && pago.aplicacionesPago[0].pago.documentos.length > 0 ? (
                                  <button 
                                    onClick={() => handleVerComprobante(pago.aplicacionesPago[0].pago.pagoId)}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                                    title="Ver Comprobante"
                                  >
                                    <Eye size={16} /> Ver
                                  </button>
                                ) : (
                                  <label className="inline-flex items-center gap-1 px-3 py-1 bg-gray-50 text-gray-600 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 hover:text-blue-600 transition-colors text-sm font-medium" title="Adjuntar comprobante a este pago">
                                    <UploadCloud size={16} /> Adjuntar
                                    <input 
                                      type="file" 
                                      className="hidden" 
                                      accept="image/*,.pdf"
                                      onChange={(e) => handleAdjuntar(pago.aplicacionesPago[0].pago.pagoId, e)}
                                    />
                                  </label>
                                )
                              )}
                              {!pago.aplicacionesPago?.[0]?.pago && <span className="text-gray-400">-</span>}
                            </td>
                            <td className="px-6 py-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                pago.estadoCobro === 'PAGADO' ? 'bg-green-100 text-green-700' :
                                pago.estadoCobro === 'VENCIDO' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {pago.estadoCobro}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isVincularModalOpen && (
        <VincularTutorModal
          isOpen={isVincularModalOpen}
          alumnoId={alumnoId}
          onClose={() => setIsVincularModalOpen(false)}
          onSuccess={() => {
            setIsVincularModalOpen(false);
            utils.alumnos.getById.invalidate(alumnoId);
          }}
          onRegistrarPadre={() => {
            setIsVincularModalOpen(false);
            navigate('/tutores');
          }}
        />
      )}

      {isInscribirModalOpen && (
        <InscribirAlumnoModal
          isOpen={isInscribirModalOpen}
          alumnoId={alumnoId}
          onClose={() => setIsInscribirModalOpen(false)}
        />
      )}

      {isAsignarPlanModalOpen && inscripcionActual && (
        <AsignarPlanPagoModal
          isOpen={isAsignarPlanModalOpen}
          alumnoId={alumnoId}
          inscripcionId={inscripcionActual.inscripcionId}
          onClose={() => setIsAsignarPlanModalOpen(false)}
        />
      )}

      {isAsignarBecaModalOpen && inscripcionActual && (
        <AsignarBecaModal
          isOpen={isAsignarBecaModalOpen}
          alumnoId={alumnoId}
          cicloId={inscripcionActual.cicloId}
          onClose={() => setIsAsignarBecaModalOpen(false)}
        />
      )}

      {/* Document Viewer Modal */}
      {viewerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="font-bold text-gray-800 truncate pr-4">{viewerName || 'Comprobante'}</h3>
              <div className="flex gap-2 shrink-0">
                <a 
                  href={viewerUrl} 
                  download={viewerName || 'comprobante'} 
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Descargar Original"
                >
                  <Download size={20} />
                </a>
                <button onClick={closeViewer} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-gray-100 overflow-auto flex items-center justify-center p-4">
              {viewerType.startsWith('image/') ? (
                <img src={viewerUrl} alt="Comprobante" className="max-w-full max-h-full object-contain rounded shadow-sm" />
              ) : viewerType === 'application/pdf' ? (
                <iframe src={viewerUrl} className="w-full h-full rounded shadow-sm" title="Comprobante PDF" />
              ) : (
                <div className="text-center p-8 bg-white rounded-xl shadow-sm">
                  <p className="text-gray-600 mb-4">El formato de este archivo ({viewerType}) no se puede previsualizar en el navegador.</p>
                  <a href={viewerUrl} download={viewerName} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Download size={18} /> Descargar Archivo
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

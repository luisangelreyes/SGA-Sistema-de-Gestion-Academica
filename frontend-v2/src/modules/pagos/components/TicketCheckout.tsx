import { useState, useEffect, useRef } from 'react';
import { trpc } from '../../../lib/trpc';
import { ReciboPrintTemplate } from './ReciboPrintTemplate';
import { CreditCard, Banknote, ReceiptText, Save, UploadCloud, X, User, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Adeudo {
  calendarioPagoId: number;
  concepto: string;
  saldoPendiente: number;
  fechaVencimiento: string;
}

interface TutorVinculado {
  tutorAlumnoId?: number;
  tutorId: number;
  esPrincipal?: boolean | null;
  parentesco?: string | null;
  tutor?: {
    tutorId: number;
    nombreCompleto: string;
    telefono?: string | null;
    correoElectronico?: string | null;
  } | null;
}

interface TicketCheckoutProps {
  alumnoId: number;
  tutorId?: number | null;
  tutores?: TutorVinculado[];
  onSelectTutor?: (tutorId: number) => void;
  adeudosSeleccionados: Adeudo[];
  onCheckoutSuccess: () => void;
}

export function TicketCheckout({
  alumnoId,
  tutorId,
  tutores = [],
  onSelectTutor,
  adeudosSeleccionados,
  onCheckoutSuccess
}: TicketCheckoutProps) {
  const totalAdeudos = adeudosSeleccionados.reduce((acc, curr) => acc + Number(curr.saldoPendiente), 0);
  
  const [montoPago, setMontoPago] = useState<string>(totalAdeudos.toString());
  const [metodoPago, setMetodoPago] = useState<'OTRO' | 'TRANSFERENCIA' | 'TARJETA_DEBITO' | 'TARJETA_CREDITO' | 'DEPOSITO'>('OTRO');
  const [observaciones, setObservaciones] = useState('');
  const [requiereFactura, setRequiereFactura] = useState(false);

  // Estados para comprobante adjunto
  const [archivoComprobante, setArchivoComprobante] = useState<File | null>(null);
  const [comprobanteBase64, setComprobanteBase64] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande (máx 5MB)');
        return;
      }
      setArchivoComprobante(file);
      const reader = new FileReader();
      reader.onload = () => setComprobanteBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearFile = () => {
    setArchivoComprobante(null);
    setComprobanteBase64(null);
  };

  // Estado para impresión
  const [pagoImprimirId, setPagoImprimirId] = useState<number | null>(null);
  
  const { data: reciboPrintData, isSuccess: isReciboReady } = trpc.pagos.getReciboPago.useQuery(
    { pagoId: pagoImprimirId! },
    { enabled: !!pagoImprimirId }
  );

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    // Método nativo súper confiable
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    
    // Configuramos título para que al dar "Guardar PDF" en el diálogo nativo se llame bien
    const originalTitle = document.title;
    document.title = reciboPrintData ? `Recibo_SGA_${reciboPrintData.pagoId}` : 'Recibo';
    
    document.body.innerHTML = printContent;
    window.print();
    
    // Restauramos el estado del dom
    document.body.innerHTML = originalContent;
    document.title = originalTitle;
    window.location.reload(); 
  };

  useEffect(() => {
    // Si cambia la selección, ajustamos el monto a pagar por defecto
    setMontoPago(totalAdeudos.toString());
  }, [totalAdeudos, adeudosSeleccionados]);

  const registrarMutation = trpc.pagos.registrarPago.useMutation({
    onSuccess: (data) => {
      toast.success('Cobro registrado exitosamente');
      onCheckoutSuccess();
      setMontoPago('0');
      setObservaciones('');
      setRequiereFactura(false);
      clearFile();
      
      if (data && data.pagoId) {
        setPagoImprimirId(data.pagoId);
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Error al registrar el cobro');
    }
  });

  const tutorEfectivoId = (tutorId && Number(tutorId) > 0)
    ? Number(tutorId)
    : (tutores && tutores.length > 0
      ? Number(tutores.find(t => t.esPrincipal)?.tutorId || tutores[0].tutorId)
      : null);

  useEffect(() => {
    if (tutorEfectivoId && tutorEfectivoId !== tutorId && onSelectTutor) {
      onSelectTutor(tutorEfectivoId);
    }
  }, [tutorEfectivoId, tutorId, onSelectTutor]);

  const isSinTutor = !tutorEfectivoId || (tutores && tutores.length === 0);
  const isCobroDisabled = registrarMutation.isPending || adeudosSeleccionados.length === 0 || isSinTutor;

  const handleCobrar = () => {
    if (adeudosSeleccionados.length === 0) {
      toast.error('Selecciona al menos un adeudo a cobrar');
      return;
    }
    if (!tutorEfectivoId || Number(tutorEfectivoId) <= 0) {
      toast.error('El alumno no tiene un tutor válido asignado o seleccionado para registrar el cobro.');
      return;
    }
    const monto = Number(montoPago.replace(/,/g, ''));
    if (isNaN(monto) || monto <= 0) {
      toast.error('El monto ingresado no es válido');
      return;
    }
    if (monto > totalAdeudos) {
      toast.error('El monto no puede ser mayor al total adeudado de los conceptos seleccionados');
      return;
    }

    // Distribuir el pago entre los adeudos seleccionados (priorizando los más viejos)
    // Clonamos y ordenamos por fecha
    const adeudosOrdenados = [...adeudosSeleccionados].sort((a, b) => 
      new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
    );

    let saldoRestante = monto;
    const aplicaciones = [];

    for (const adeudo of adeudosOrdenados) {
      if (saldoRestante <= 0) break;

      const deuda = Number(adeudo.saldoPendiente);
      const abono = Math.min(saldoRestante, deuda);

      if (abono > 0) {
        aplicaciones.push({
          calendarioPagoId: adeudo.calendarioPagoId,
          montoAplicado: abono,
          aplicadoA: 'CAPITAL' as const
        });
        saldoRestante -= abono;
      }
    }

    registrarMutation.mutate({
      alumnoId,
      tutorId: Number(tutorEfectivoId),
      fechaPago: new Date().toISOString(),
      montoTotal: monto,
      metodoPago,
      observaciones: observaciones ? observaciones.trim() : undefined,
      requiereFactura,
      comprobanteBase64: comprobanteBase64 || undefined,
      comprobanteNombre: archivoComprobante?.name || undefined,
      comprobanteMime: archivoComprobante?.type || undefined,
      aplicaciones
    });
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <ReceiptText className="text-emerald-500" /> Ticket de Cobro
        </h2>
        <div className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
          CAJA
        </div>
      </div>

      <div className="p-5 flex-1 overflow-y-auto space-y-6">
        {/* Sumario */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Conceptos Seleccionados:</span>
            <span className="font-bold">{adeudosSeleccionados.length}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-slate-800">
            <span>Total Adeudado:</span>
            <span>${totalAdeudos.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Sección de Tutor Responsable / Pagador */}
        <div>
          {tutores.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
              <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-bold text-amber-900 text-sm">Alumno sin tutor vinculado</h4>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Este alumno no cuenta con tutores registrados en el sistema. Debes vincular un tutor al alumno desde el módulo de <strong>Alumnos</strong> para poder emitir recibos y registrar cobros.
                </p>
              </div>
            </div>
          ) : tutores.length === 1 ? (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tutor Responsable</label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{tutores[0].tutor?.nombreCompleto || 'Tutor'}</p>
                    <p className="text-[11px] text-slate-500">{tutores[0].parentesco || 'Tutor'}{tutores[0].esPrincipal ? ' • Principal' : ''}</p>
                  </div>
                </div>
                {tutores[0].esPrincipal && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-md">Principal</span>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tutor que realiza el pago</label>
              <select
                value={tutorEfectivoId || ''}
                onChange={(e) => onSelectTutor?.(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                {tutores.map((t) => (
                  <option key={t.tutorId} value={t.tutorId}>
                    {t.tutor?.nombreCompleto || `Tutor #${t.tutorId}`} ({t.parentesco || 'Tutor'}{t.esPrincipal ? ' - Principal' : ''})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="h-px bg-slate-100 w-full" />

        {/* Input Monto a Recibir (Soporta Abonos) */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Monto que entrega el Padre ($)</label>
          <input
            type="text"
            value={montoPago}
            onChange={(e) => setMontoPago(e.target.value)}
            className="w-full text-3xl font-black text-emerald-700 p-4 bg-emerald-50/50 border-2 border-emerald-200 rounded-2xl focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {Number(montoPago.replace(/,/g, '')) < totalAdeudos && (
            <p className="text-xs text-amber-600 mt-2 font-medium bg-amber-50 p-2 rounded-lg">
              * El padre está pagando menos del total adeudado. El sistema lo registrará como un <b>Abono Parcial</b>.
            </p>
          )}
        </div>

        {/* Método de Pago */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Método de Pago</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'OTRO', label: 'Otro', icon: Banknote },
              { id: 'TRANSFERENCIA', label: 'Transferencia', icon: CreditCard },
              { id: 'TARJETA_DEBITO', label: 'Débito', icon: CreditCard },
              { id: 'TARJETA_CREDITO', label: 'Crédito', icon: CreditCard },
            ].map(mp => (
              <button
                key={mp.id}
                onClick={() => setMetodoPago(mp.id as any)}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                  metodoPago === mp.id 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <mp.icon size={16} />
                {mp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Referencia */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Folio / Referencia</label>
          <input
            type="text"
            placeholder="Ej. Num. Transferencia, Voucher, etc."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Carga de Comprobante Opcional */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Comprobante Físico (Opcional)</label>
          {!archivoComprobante ? (
            <label className="w-full flex flex-col items-center justify-center p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 hover:border-blue-400 transition-colors">
              <UploadCloud className="text-slate-400 mb-2" size={28} />
              <span className="text-sm text-slate-600 font-medium">Adjuntar foto o archivo</span>
              <span className="text-xs text-slate-400 mt-1">PNG, JPG, PDF (Max 5MB)</span>
              <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
            </label>
          ) : (
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-3 overflow-hidden">
                <ReceiptText className="text-blue-600 shrink-0" size={20} />
                <span className="text-sm font-semibold text-blue-800 truncate" title={archivoComprobante.name}>
                  {archivoComprobante.name}
                </span>
              </div>
              <button 
                onClick={clearFile}
                className="p-1 hover:bg-blue-100 rounded-full text-blue-600 transition-colors"
                title="Quitar archivo"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Botón de Cobro Movido Arriba */}
        <div className="pt-4">
          <button
            onClick={handleCobrar}
            disabled={isCobroDisabled}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex justify-center items-center gap-3 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
          >
            <Save size={24} />
            {registrarMutation.isPending ? 'Procesando...' : isSinTutor ? 'Requiere Tutor para Cobrar' : 'Cobrar Ticket'}
          </button>
        </div>
      </div>

      <div style={{ display: 'none' }}>
        <ReciboPrintTemplate ref={printRef} recibo={reciboPrintData || null} />
      </div>

      {/* Modal de Pago Exitoso */}
      {pagoImprimirId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <Save size={40} className="text-emerald-600" />
            </div>
            
            <h3 className="text-2xl font-black text-slate-800 text-center mb-2">¡Cobro Exitoso!</h3>
            <p className="text-slate-600 text-center mb-8">El pago ha sido registrado correctamente en el sistema.</p>
            
            {isReciboReady && reciboPrintData ? (
              <div className="w-full space-y-3">
                <button 
                  onClick={handlePrint}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
                >
                  <ReceiptText size={24} />
                  Imprimir o Guardar como PDF
                </button>
              </div>
            ) : (
              <div className="w-full text-center py-4 text-slate-500 animate-pulse font-medium">
                Generando recibo...
              </div>
            )}
            
            <button 
              onClick={() => setPagoImprimirId(null)}
              className="mt-6 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
            >
              Cerrar y continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

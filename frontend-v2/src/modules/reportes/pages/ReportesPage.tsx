import { useState } from 'react';
import { trpc } from '../../../lib/trpc';
import { Button } from '../../../components/ui/Button';
import { FileSpreadsheet, Download, Calendar as CalendarIcon, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '../../../components/ui/Input';

export function ReportesPage() {
  // Estado para Reporte de Ingresos
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

  // Consultas Lazy (se ejecutan al solicitar)
  const { refetch: fetchIngresos, isFetching: loadingIngresos } = trpc.reportes.reporteIngresos.useQuery(
    { 
      fechaInicio: `${fechaInicio}T00:00:00.000Z`, 
      fechaFin: `${fechaFin}T23:59:59.999Z` 
    },
    { enabled: false }
  );

  const { refetch: fetchMorosos, isFetching: loadingMorosos } = trpc.reportes.reporteDeudores.useQuery(
    undefined,
    { enabled: false }
  );

  const { refetch: fetchBecas, isFetching: loadingBecas } = trpc.reportes.reporteBecas.useQuery(
    undefined,
    { enabled: false }
  );

  // Función utilitaria para descargar CSV
  const exportToCsv = (data: any[], filename: string) => {
    if (!data || !data.length) {
      alert('No hay datos para exportar en este reporte.');
      return;
    }

    // Extraer cabeceras (keys) del primer objeto
    const headers = Object.keys(data[0]);

    // Construir contenido CSV
    const csvRows = [];
    csvRows.push(headers.join(',')); // Cabeceras

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        if (val === null || val === undefined) return '';
        // Escapar comillas dobles y envolver en comillas si hay comas
        const stringVal = String(val).replace(/"/g, '""');
        if (stringVal.includes(',') || stringVal.includes('\n') || stringVal.includes('"')) {
          return `"${stringVal}"`;
        }
        return stringVal;
      });
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' }); // \uFEFF para UTF-8 BOM
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
  };

  const handleDownloadIngresos = async () => {
    const { data } = await fetchIngresos();
    if (data) {
      // Formatear fechas para mejor legibilidad
      const formatted = data.map((d: any) => ({
        ...d,
        fecha: new Date(d.fecha).toLocaleString()
      }));
      exportToCsv(formatted, 'Reporte_Ingresos');
    }
  };

  const handleDownloadMorosos = async () => {
    const { data } = await fetchMorosos();
    if (data) exportToCsv(data, 'Reporte_Alumnos_Morosos');
  };

  const handleDownloadBecas = async () => {
    const { data } = await fetchBecas();
    if (data) {
      const formatted = data.map((d: any) => ({
        ...d,
        fechaAsignacion: new Date(d.fechaAsignacion).toLocaleDateString()
      }));
      exportToCsv(formatted, 'Reporte_Becas_Activas');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Título */}
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
          <FileSpreadsheet size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-navy-800">Reportes de Gestión</h2>
          <p className="text-gray-500">Descarga de reportes operativos en formato CSV para análisis en Excel</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card: Ingresos y Corte de Caja */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
              <Download size={20} />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Ingresos (Corte de Caja)</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6 flex-1">
            Reporte de todos los pagos registrados en el sistema filtrado por un rango de fechas. Incluye datos del alumno y recibo.
          </p>
          
          <div className="space-y-4 mb-6 bg-gray-50 p-4 rounded-xl">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Inicio</label>
              <Input 
                type="date" 
                value={fechaInicio} 
                onChange={(e) => setFechaInicio(e.target.value)} 
                icon={<CalendarIcon size={18} />} 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Fin</label>
              <Input 
                type="date" 
                value={fechaFin} 
                onChange={(e) => setFechaFin(e.target.value)} 
                icon={<CalendarIcon size={18} />} 
              />
            </div>
          </div>
          
          <Button 
            onClick={handleDownloadIngresos} 
            disabled={loadingIngresos} 
            className="w-full justify-center bg-green-600 hover:bg-green-700"
          >
            {loadingIngresos ? <Loader2 className="animate-spin mr-2" size={18} /> : <FileSpreadsheet className="mr-2" size={18} />}
            Descargar CSV
          </Button>
        </div>

        {/* Card: Alumnos Morosos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
              <AlertCircle size={20} />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Alumnos Morosos</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6 flex-1">
            Listado completo de todos los alumnos que tienen pagos vencidos (estado VENCIDO), incluyendo teléfono del tutor y meses de atraso.
          </p>
          
          <div className="mt-auto">
            <Button 
              onClick={handleDownloadMorosos} 
              disabled={loadingMorosos} 
              className="w-full justify-center"
            >
              {loadingMorosos ? <Loader2 className="animate-spin mr-2" size={18} /> : <FileSpreadsheet className="mr-2" size={18} />}
              Generar Reporte CSV
            </Button>
          </div>
        </div>

        {/* Card: Becas y Descuentos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Download size={20} />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Becas y Descuentos</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6 flex-1">
            Reporte de todos los alumnos que actualmente gozan de una beca o descuento activo (estado ACTIVO), con su porcentaje asignado.
          </p>
          
          <div className="mt-auto">
            <Button 
              onClick={handleDownloadBecas} 
              disabled={loadingBecas} 
              className="w-full justify-center"
            >
              {loadingBecas ? <Loader2 className="animate-spin mr-2" size={18} /> : <FileSpreadsheet className="mr-2" size={18} />}
              Generar Reporte CSV
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

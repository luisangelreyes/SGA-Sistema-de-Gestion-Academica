import { useRef, useState } from 'react';
import { trpc } from '../../../lib/trpc';
import { Button } from '../../../components/ui/Button';
import { Download, Upload, AlertTriangle, Check, Loader2 } from 'lucide-react';

export function ConfiguracionRespaldosTab() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportMutation = trpc.configuracion.exportBackup.useMutation();
  const importMutation = trpc.configuracion.importBackup.useMutation();

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const sqlData = await exportMutation.mutateAsync();
      
      const blob = new Blob([sqlData], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SGA_Respaldo_${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      alert('Error al exportar el respaldo: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('¡ATENCIÓN! La importación de un respaldo SOBRESCRIBIRÁ TODA la base de datos actual. Todo progreso que no esté en el archivo se perderá para siempre. ¿Estás absolutamente seguro de continuar?')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsImporting(true);
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const sqlData = event.target?.result as string;
          await importMutation.mutateAsync(sqlData);
          setImportSuccess(true);
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } catch (error: any) {
          alert('Error al importar el respaldo: ' + error.message);
          setIsImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };

      reader.onerror = () => {
        alert('Error al leer el archivo');
        setIsImporting(false);
      };

      reader.readAsText(file);
    } catch (error: any) {
      alert('Error: ' + error.message);
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 animate-in fade-in">
      <div className="max-w-3xl">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Respaldos y Seguridad</h3>
        <p className="text-gray-500 mb-8">
          Genera copias de seguridad de toda la base de datos del sistema para mantener tu información a salvo, o restaura un respaldo previo en caso de emergencia.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Exportar */}
          <div className="p-6 border border-gray-100 bg-gray-50/50 rounded-2xl">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Download size={24} />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Exportar Respaldo</h4>
            <p className="text-sm text-gray-500 mb-6">
              Descarga un archivo .sql con toda la información actual del colegio (alumnos, pagos, configuraciones).
            </p>
            <Button
              onClick={handleExport}
              disabled={isExporting || isImporting}
              className="w-full justify-center"
            >
              {isExporting ? (
                <><Loader2 className="animate-spin mr-2" size={18} /> Exportando...</>
              ) : (
                <><Download className="mr-2" size={18} /> Generar archivo de respaldo</>
              )}
            </Button>
          </div>

          {/* Card Importar */}
          <div className="p-6 border border-red-100 bg-red-50/30 rounded-2xl">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-4">
              <Upload size={24} />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Importar Respaldo</h4>
            <p className="text-sm text-gray-500 mb-6">
              Restaura la base de datos a partir de un archivo .sql. <strong className="text-red-600">Atención: esto borrará los datos actuales.</strong>
            </p>
            
            <input
              type="file"
              accept=".sql"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImport}
            />

            {importSuccess ? (
              <div className="flex items-center justify-center gap-2 text-emerald-600 font-medium p-2 bg-emerald-50 rounded-lg">
                <Check size={20} />
                Sistema restaurado. Recargando...
              </div>
            ) : (
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isExporting || isImporting}
                variant="danger"
                className="w-full justify-center"
              >
                {isImporting ? (
                  <><Loader2 className="animate-spin mr-2" size={18} /> Importando...</>
                ) : (
                  <><Upload className="mr-2" size={18} /> Subir archivo y restaurar</>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-100 rounded-xl flex gap-3 items-start">
          <AlertTriangle className="text-yellow-600 shrink-0" size={20} />
          <div className="text-sm text-yellow-800">
            <strong className="font-semibold block mb-1">Recomendaciones de seguridad</strong>
            Te sugerimos guardar tus archivos de respaldo en una unidad externa (USB) o en una carpeta sincronizada con la nube (como Google Drive o OneDrive) para tener mayor redundancia en caso de daño físico del equipo.
          </div>
        </div>
      </div>
    </div>
  );
}

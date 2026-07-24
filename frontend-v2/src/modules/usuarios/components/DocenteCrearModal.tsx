import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { trpc } from '../../../lib/trpc';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DocenteCrearModal({ isOpen, onClose, onSuccess }: Props) {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const utils = trpc.useUtils();

  const crearMutation = trpc.grupos.createDocente.useMutation({
    onSuccess: () => {
      utils.usuarios.listarUsuarios.invalidate();
      utils.grupos.getDocentes.invalidate();
      onSuccess?.();
      handleClose();
    },
    onError: (error) => {
      setErrorMsg(error.message || 'Error al crear docente');
    }
  });

  const handleClose = () => {
    setNombreCompleto('');
    setErrorMsg('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCompleto.trim()) {
      setErrorMsg('El nombre es requerido');
      return;
    }
    crearMutation.mutate({ nombreCompleto: nombreCompleto.trim() });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-navy-800">
            <UserPlus size={20} className="text-navy-600" />
            <h2 className="text-lg font-semibold">Agregar Docente Rápido</h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nombre Completo del Docente"
              type="text"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              placeholder="Ej. María López"
              required
            />
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                {errorMsg}
              </div>
            )}
          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={crearMutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" onClick={handleSubmit} isLoading={crearMutation.isPending}>
            Agregar
          </Button>
        </div>
      </div>
    </div>
  );
}

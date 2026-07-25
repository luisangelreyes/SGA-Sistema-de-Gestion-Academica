import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  remainingSeconds: number;
  onKeepAlive: () => void;
  onLogout: () => void;
}

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
  isOpen,
  remainingSeconds,
  onKeepAlive,
  onLogout
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Bloquear cierre con click afuera
      title=""
      size="md"
    >
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-amber-100 p-4 rounded-full mb-4">
          <AlertTriangle className="h-12 w-12 text-amber-600" />
        </div>
        
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          Tu sesión está a punto de expirar
        </h2>
        
        <p className="text-slate-600 mb-6">
          Por razones de seguridad, cerraremos tu sesión debido a la inactividad. 
          ¿Sigues ahí?
        </p>

        <div className="text-4xl font-bold text-slate-800 mb-8 tabular-nums">
          00:{remainingSeconds.toString().padStart(2, '0')}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={onLogout}
          >
            Cerrar Sesión
          </Button>
          <Button 
            variant="primary" 
            className="flex-1"
            onClick={onKeepAlive}
          >
            Mantener sesión activa
          </Button>
        </div>
      </div>
    </Modal>
  );
};

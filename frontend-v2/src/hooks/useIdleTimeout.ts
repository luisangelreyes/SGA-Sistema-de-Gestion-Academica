import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook para manejar la inactividad del usuario.
 * @param idleTimeMs Tiempo en milisegundos antes de considerar al usuario inactivo
 * @param onIdle Función a ejecutar cuando se acaba el tiempo de advertencia (ej. logout)
 */
export function useIdleTimeout(idleTimeMs: number, onIdle: () => void) {
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar temporizadores
  const clearTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  }, []);

  // Reiniciar temporizador de inactividad
  const resetTimer = useCallback(() => {
    clearTimers();

    // Iniciar temporizador principal de inactividad
    idleTimerRef.current = setTimeout(() => {
      onIdle();
    }, idleTimeMs);
  }, [clearTimers, idleTimeMs, onIdle]);

  useEffect(() => {
    // Eventos a monitorear
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    
    // Función optimizada para no reiniciar el timer en cada milisegundo (throttling básico)
    let lastEventTime = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastEventTime > 500) { // Solo procesar si ha pasado medio segundo
        lastEventTime = now;
        resetTimer();
      }
    };

    // Agregar listeners
    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Iniciar el primer temporizador
    resetTimer();

    // Cleanup al desmontar
    return () => {
      clearTimers();
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [clearTimers, resetTimer]);

  return {};
}

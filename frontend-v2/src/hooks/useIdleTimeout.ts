import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook para manejar la inactividad del usuario.
 * @param idleTimeMs Tiempo en milisegundos antes de considerar al usuario inactivo (mostrar advertencia)
 * @param warningTimeMs Tiempo en milisegundos de la cuenta regresiva de advertencia antes de ejecutar onIdle
 * @param onIdle Función a ejecutar cuando se acaba el tiempo de advertencia (ej. logout)
 */
export function useIdleTimeout(idleTimeMs: number, warningTimeMs: number, onIdle: () => void) {
  const [isIdleWarning, setIsIdleWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(warningTimeMs / 1000);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar temporizadores
  const clearTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
  }, []);

  // Reiniciar temporizador de inactividad
  const resetTimer = useCallback(() => {
    // Si ya estamos en advertencia, la interacción normal NO la quita automáticamente,
    // el usuario debe dar clic explícitamente en el botón del modal para cerrarla.
    if (isIdleWarning) return;

    clearTimers();
    setRemainingTime(warningTimeMs / 1000);

    // Iniciar temporizador principal de inactividad
    idleTimerRef.current = setTimeout(() => {
      setIsIdleWarning(true);
      
      // Iniciar cuenta regresiva
      countdownTimerRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearTimers();
            setIsIdleWarning(false);
            onIdle();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, idleTimeMs);
  }, [clearTimers, idleTimeMs, isIdleWarning, onIdle, warningTimeMs]);

  // Función explícita para que el usuario mantenga la sesión desde el modal
  const keepAlive = useCallback(() => {
    setIsIdleWarning(false);
    resetTimer();
  }, [resetTimer]);

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

  return {
    isIdleWarning,
    remainingTime,
    keepAlive
  };
}

import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { Edit3, FileText } from 'lucide-react';
import styles from '../../../grupos/layouts/GruposLayout/GruposLayout.module.css'; // Reutilizando los estilos de tabs

export function CalificacionesLayout() {
  return (
    <div className="module-layout">
      <header className="module-header">
        <h1>Calificaciones y Kárdex</h1>
        <p className="text-secondary">
          Gestión de boletas, evaluaciones y trayectoria académica.
        </p>
      </header>

      <div className={styles.tabsContainer}>
        <NavLink
          to="/calificaciones/captura"
          className={({ isActive }) => clsx(styles.tab, isActive && styles.activeTab)}
        >
          <Edit3 size={18} />
          Captura por Grupo
        </NavLink>
        <NavLink
          to="/calificaciones/kardex"
          className={({ isActive }) => clsx(styles.tab, isActive && styles.activeTab)}
        >
          <FileText size={18} />
          Kárdex de Alumno
        </NavLink>
      </div>

      <div className="module-content">
        <Outlet />
      </div>
    </div>
  );
}

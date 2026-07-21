import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';
import clsx from 'clsx';
import styles from '../../../grupos/layouts/GruposLayout/GruposLayout.module.css';

export function ConfiguracionLayout() {
  const location = useLocation();
  
  const tabs = [
    { name: 'Ajustes Globales del Sistema', path: '/configuracion', icon: <Settings size={18} />, exact: true },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Configuración Institucional</h1>
          <p className={styles.subtitle}>Define las reglas de negocio base: recargos, inscripciones y notificaciones automáticas.</p>
        </div>
      </div>

      <div className={styles.tabsContainer}>
        <div className={styles.tabsList}>
          {tabs.map((tab) => {
            const isActive = tab.exact 
              ? location.pathname === tab.path 
              : location.pathname.startsWith(tab.path);

            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={clsx(styles.tabItem, isActive && styles.tabActive)}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}

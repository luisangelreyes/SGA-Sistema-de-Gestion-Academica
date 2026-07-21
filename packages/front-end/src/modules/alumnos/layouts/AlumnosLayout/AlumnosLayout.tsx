import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Users } from 'lucide-react';
import clsx from 'clsx';
import styles from '../../../grupos/layouts/GruposLayout/GruposLayout.module.css';

export function AlumnosLayout() {
  const location = useLocation();
  
  const tabs = [
    { name: 'Directorio Escolar', path: '/alumnos', icon: <Users size={18} />, exact: false },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Gestión de Alumnos</h1>
          <p className={styles.subtitle}>Administra los expedientes académicos y médicos de los estudiantes.</p>
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

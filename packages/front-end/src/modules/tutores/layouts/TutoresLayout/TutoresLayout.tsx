import { Outlet } from 'react-router-dom';

export function TutoresLayout() {
  return (
    <div className="module-layout">
      <header className="module-header">
        <h1>Gestión de Tutores</h1>
        <p className="text-secondary">
          Administración de padres de familia y responsables legales.
        </p>
      </header>
      <div className="module-content">
        <Outlet />
      </div>
    </div>
  );
}

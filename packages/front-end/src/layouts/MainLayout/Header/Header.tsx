import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <h2 className={styles.pageTitle}>Sistema de Gestión Académica</h2>
    </header>
  );
}

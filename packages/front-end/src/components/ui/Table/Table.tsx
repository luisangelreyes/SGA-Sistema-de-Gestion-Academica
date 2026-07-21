import React from 'react';
import styles from './Table.module.css';
import { clsx } from 'clsx';
import { EmptyState } from '../EmptyState/EmptyState';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading,
  emptyMessage = 'No hay registros',
  onRowClick,
  className
}: TableProps<T>) {
  if (!isLoading && data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className={clsx(styles.container, className)}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={index} className={clsx(styles.th, col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={isLoading ? styles.loadingBody : ''}>
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              className={clsx(styles.tr, onRowClick && styles.clickable)}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((col, index) => (
                <td key={index} className={clsx(styles.td, col.className)}>
                  {typeof col.accessor === 'function'
                    ? col.accessor(row)
                    : (row[col.accessor] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

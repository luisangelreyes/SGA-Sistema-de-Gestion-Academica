import React from 'react';
import { Loader2 } from 'lucide-react';
import styles from './Spinner.module.css';
import { clsx } from 'clsx';

export interface SpinnerProps {
  size?: number;
  className?: string;
  centered?: boolean;
}

export function Spinner({ size = 24, className, centered = false }: SpinnerProps) {
  const spinner = (
    <Loader2 
      size={size} 
      className={clsx(styles.spinner, className)} 
    />
  );

  if (centered) {
    return (
      <div className={styles.centered}>
        {spinner}
      </div>
    );
  }

  return spinner;
}

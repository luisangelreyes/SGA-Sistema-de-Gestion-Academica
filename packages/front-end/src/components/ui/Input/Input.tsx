import React, { forwardRef } from 'react';
import styles from './Input.module.css';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, disabled, id, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className={clsx(styles.container, className)}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={styles.inputWrapper}>
          {leftIcon && <div className={clsx(styles.icon, styles.leftIcon)}>{leftIcon}</div>}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={clsx(
              styles.input,
              error && styles.hasError,
              leftIcon && styles.hasLeftIcon,
              rightIcon && styles.hasRightIcon,
              disabled && styles.disabled
            )}
            {...props}
          />
          {rightIcon && <div className={clsx(styles.icon, styles.rightIcon)}>{rightIcon}</div>}
        </div>
        {error && <span className={styles.errorMessage}>{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

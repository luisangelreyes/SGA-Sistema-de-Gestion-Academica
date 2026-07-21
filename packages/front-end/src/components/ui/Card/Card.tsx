import React from 'react';
import styles from './Card.module.css';
import { clsx } from 'clsx';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={clsx(styles.card, className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={clsx(styles.header, className)}>{children}</div>;
}

export function CardTitle({ children, className }: CardProps) {
  return <h3 className={clsx(styles.title, className)}>{children}</h3>;
}

export function CardContent({ children, className }: CardProps) {
  return <div className={clsx(styles.content, className)}>{children}</div>;
}

export function CardFooter({ children, className }: CardProps) {
  return <div className={clsx(styles.footer, className)}>{children}</div>;
}

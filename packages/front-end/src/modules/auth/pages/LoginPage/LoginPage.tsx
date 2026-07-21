import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../../../components/ui/Input/Input';
import { Button } from '../../../../components/ui/Button/Button';
import { useAuth } from '../../../../hooks/useAuth';
import { trpc } from '../../../../lib/trpc';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const setToken = useAuth(state => state.setToken);
  const setUsuario = useAuth(state => state.setUsuario);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      setToken(data.token);
      setUsuario(data.usuario);
      navigate('/dashboard');
    },
    onError: (err) => {
      setError(err.message || 'Credenciales inválidas');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!identificador || !password) {
      setError('Por favor, ingresa tu correo/usuario y contraseña');
      return;
    }
    
    loginMutation.mutate({ identificador, contrasena: password });
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.header}>
        <img src="/logo.png" alt="Colegio San Diego" className={styles.logoImage} />
        <h2 className={styles.title}>Bienvenido de vuelta</h2>
        <p className={styles.description}>Ingresa tus credenciales para acceder</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          type="text"
          label="Usuario"
          placeholder="admin"
          value={identificador}
          onChange={(e) => setIdentificador(e.target.value)}
          disabled={loginMutation.isPending}
        />
        
        <Input
          type="password"
          label="Contraseña"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loginMutation.isPending}
        />

        {error && <div className={styles.errorAlert}>{error}</div>}

        <Button 
          type="submit" 
          className={styles.submitBtn} 
          isLoading={loginMutation.isPending}
        >
          Iniciar Sesión
        </Button>
      </form>
    </div>
  );
}

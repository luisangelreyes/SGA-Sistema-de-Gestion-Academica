import { create } from 'zustand';

interface AuthState {
  token: string | null;
  usuario: any | null; // Tipar mejor si se tiene exportado del back
  setToken: (token: string) => void;
  setUsuario: (usuario: any) => void;
  logout: () => void;
}

// Simulamos persistencia básica con localStorage para el token
const initialToken = localStorage.getItem('sga_token');

export const useAuth = create<AuthState>((set) => ({
  token: initialToken,
  usuario: null,
  setToken: (token) => {
    localStorage.setItem('sga_token', token);
    set({ token });
  },
  setUsuario: (usuario) => set({ usuario }),
  logout: () => {
    localStorage.removeItem('sga_token');
    set({ token: null, usuario: null });
  },
}));

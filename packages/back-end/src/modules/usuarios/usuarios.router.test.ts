// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from '../../router';
import { prismaMock } from '../../../tests/setup/prisma-mock';
import { TRPCError } from '@trpc/server';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(() => ({ usuarioId: 99, jti: 'test-jti' }))
  }
}));

describe('Usuarios Router (Unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.logAuditoria.create.mockResolvedValue({} as any);
    prismaMock.usuarioPermisoModulo.findUnique.mockResolvedValue({
      activo: true,
      nivel: 'LECTURA_Y_ESCRITURA'
    } as any);
  });

  const ctxMock = {
    prisma: prismaMock as any,
    user: { usuarioId: 99, jti: 'test-jti' },
    req: {} as any,
    res: {} as any,
    token: 'fake-token'
  };

  const caller = appRouter.createCaller(ctxMock as any);

  describe('listarUsuarios', () => {
    it('debería retornar datos paginados y metadatos correctos', async () => {
      prismaMock.usuario.count.mockResolvedValue(100);
      prismaMock.usuario.findMany.mockResolvedValue([
        { usuarioId: 1, nombreUsuario: 'admin', roles: [] }
      ] as any);

      const result = await caller.usuarios.listarUsuarios({ pagina: 1, limite: 10 });

      expect(prismaMock.usuario.count).toHaveBeenCalled();
      expect(prismaMock.usuario.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0,
        take: 10,
        orderBy: { usuarioId: 'desc' }
      }));
      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(100);
      expect(result.meta.totalPaginas).toBe(10);
    });
  });

  describe('crearUsuario', () => {
    it('debería rechazar si el usuario o correo ya existen', async () => {
      prismaMock.usuario.findFirst.mockResolvedValue({ usuarioId: 1 } as any);

      await expect(
        caller.usuarios.crearUsuario({
          nombreUsuario: 'admin',
          nombreCompleto: 'Admin Tester',
          password: 'password123',
          rolId: 1
        })
      ).rejects.toThrowError(new TRPCError({ code: 'CONFLICT', message: 'El nombre de usuario ya está registrado' }));
    });

    it('debería crear el usuario y sus roles transaccionalmente', async () => {
      prismaMock.usuario.findFirst.mockResolvedValue(null);
      
      // Simular $transaction ejecutando el callback
      prismaMock.$transaction.mockImplementation(async (callback) => {
        return await callback(prismaMock);
      });

      prismaMock.usuario.create.mockResolvedValue({ usuarioId: 5 } as any);
      prismaMock.usuarioRol.createMany.mockResolvedValue({ count: 1 } as any);
      prismaMock.rol.findMany.mockResolvedValue([
        { rolId: 2, codigo: 'GESTOR', nombre: 'Gestor' }
      ] as any);

      const result = await caller.usuarios.crearUsuario({
        nombreUsuario: 'nuevo',
        nombreCompleto: 'Nuevo Usuario',
        password: 'password123',
        rolId: 2
      });

      expect(result.success).toBe(true);
      expect(result.usuarioId).toBe(5);
      expect(prismaMock.usuario.create).toHaveBeenCalled();
      expect(prismaMock.usuarioRol.createMany).toHaveBeenCalledWith({
        data: [{ usuarioId: 5, rolId: 2, asignadoPor: 99 }]
      });
    });
  });

  describe('actualizarEstadoUsuario', () => {
    it('debería rechazar si el usuario intenta desactivar su propia cuenta', async () => {
      await expect(
        caller.usuarios.actualizarEstadoUsuario({ usuarioId: 99, activo: false })
      ).rejects.toThrowError(new TRPCError({ code: 'BAD_REQUEST', message: 'No puedes desactivar tu propia cuenta' }));
    });

    it('debería actualizar el estado de otro usuario', async () => {
      prismaMock.usuario.update.mockResolvedValue({ activo: false } as any);

      const result = await caller.usuarios.actualizarEstadoUsuario({ usuarioId: 5, activo: false });

      expect(result.success).toBe(true);
      expect(prismaMock.usuario.update).toHaveBeenCalledWith({
        where: { usuarioId: 5 },
        data: { activo: false }
      });
    });
  });
});

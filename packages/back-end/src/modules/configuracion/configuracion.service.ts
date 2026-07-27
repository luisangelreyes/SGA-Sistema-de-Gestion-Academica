import { TRPCError } from '@trpc/server';
import { type UpdateConfigInput } from './configuracion.schema';
import { ConfiguracionRepository } from './configuracion.repository';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { prisma } from '@sga/data-access';

const execAsync = promisify(exec);

export class ConfiguracionService {
  // Siempre asumiremos que la configuración global tiene el ID 1 (Single Row)
  private static CONFIG_ID = 1;

  /**
   * Obtiene la configuración global actual
   */
  static async getConfiguracion() {
    let config = await ConfiguracionRepository.findConfiguracion(this.CONFIG_ID);

    if (!config) {
      // Si no existe, creamos una por defecto
      config = await ConfiguracionRepository.createConfiguracion({
        configuracionId: this.CONFIG_ID,
        montoRecargoDefecto: 400.00,
        diasGraciaRecargo: 5,
        plazoInscripcionDias: 60,
        umbralesSmtpDias: [5, 3, 1] // Umbrales por defecto en la DB (JSON)
      });
    }

    return {
      configuracionId: config.configuracionId,
      montoRecargoDefecto: Number(config.montoRecargoDefecto),
      diasGraciaRecargo: config.diasGraciaRecargo,
      plazoInscripcionDias: config.plazoInscripcionDias,
      umbralesSmtpDias: config.umbralesSmtpDias as number[],
      actualizadoEn: config.actualizadoEn
    };
  }

  /**
   * Actualiza la configuración global
   */
  static async updateConfiguracion(input: UpdateConfigInput) {
    // Asegurarse de que exista primero
    await this.getConfiguracion();

    try {
      const updatedConfig = await ConfiguracionRepository.updateConfiguracion(this.CONFIG_ID, {
        montoRecargoDefecto: input.montoRecargoDefecto !== undefined ? input.montoRecargoDefecto : undefined,
        diasGraciaRecargo: input.diasGraciaRecargo,
        plazoInscripcionDias: input.plazoInscripcionDias,
        umbralesSmtpDias: input.umbralesSmtpDias ? input.umbralesSmtpDias : undefined,
        actualizadoEn: new Date()
      });

      return {
        configuracionId: updatedConfig.configuracionId,
        montoRecargoDefecto: Number(updatedConfig.montoRecargoDefecto),
        diasGraciaRecargo: updatedConfig.diasGraciaRecargo,
        plazoInscripcionDias: updatedConfig.plazoInscripcionDias,
        umbralesSmtpDias: updatedConfig.umbralesSmtpDias as number[],
        actualizadoEn: updatedConfig.actualizadoEn
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error al actualizar la configuración global'
      });
    }
  }

  /**
   * Exportar base de datos a formato SQL
   */
  static async exportarBackup(): Promise<string> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DATABASE_URL no configurada' });
    }

    try {
      // Usamos maxBuffer de 100MB para evitar que falle con BDs medianas
      const { stdout } = await execAsync(`pg_dump --clean -F p "${databaseUrl}"`, { maxBuffer: 1024 * 1024 * 100 });
      return stdout;
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error al exportar respaldo: ' + (error.message || 'Error desconocido')
      });
    }
  }

  /**
   * Importar y restaurar la base de datos desde formato SQL
   */
  static async importarBackup(sqlData: string): Promise<boolean> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DATABASE_URL no configurada' });
    }

    const tempFile = path.join(os.tmpdir(), `sga_restore_${Date.now()}.sql`);
    
    try {
      await fs.writeFile(tempFile, sqlData, 'utf-8');
      
      // Desconectar Prisma antes de borrar tablas
      await prisma.$disconnect();

      // Restaurar el archivo (pg_dump --clean incluye los comandos DROP TABLE)
      await execAsync(`psql "${databaseUrl}" -f "${tempFile}"`);

      // Reconectar Prisma
      await prisma.$connect();

      return true;
    } catch (error: any) {
      await prisma.$connect().catch(() => {});
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error al importar respaldo: ' + (error.message || 'Error desconocido')
      });
    } finally {
      await fs.unlink(tempFile).catch(() => {});
    }
  }
}

# SGA (Sistema de Gestión Académico)

Este es un monorepo para el Sistema de Gestión Académico "SGA".
Utiliza una arquitectura "Todo en Uno" con Tauri Sidecars para ser distribuido como un único instalable sin requerir Docker, Node.js ni PostgreSQL preinstalados en el equipo del usuario.

## Estructura de paquetes

- `@sga/front-end`: Interfaz de usuario (Vite + React + TypeScript).
- `@sga/back-end`: Servidor HTTP (Fastify + tRPC). Se compila como ejecutable independiente (sidecar).
- `@sga/data-access`: Acceso a datos (Prisma ORM). Único punto de conexión con la base de datos PostgreSQL.
- `@sga/app-tauri`: Contenedor de escritorio (Tauri). Orquesta PostgreSQL y el backend como sidecars.

## Requisitos para desarrollo

1. **Node.js** (v18+)
2. **Rust** y dependencias para Tauri (v2)
3. **PostgreSQL portable**: Debes obtener los binarios de PostgreSQL para Windows (`initdb.exe`, `postgres.exe`, `pg_ctl.exe` y sus DLLs) y colocarlos en la carpeta `packages/app-tauri/src-tauri/binaries/`. Nota: Cambiarles el nombre según tu configuración en `tauri.conf.json` (ej: `initdb-x86_64-pc-windows-msvc.exe`).

## Entorno de Desarrollo

1. Crea un archivo `.env` basado en `.env.example`:
   ```bash
   cp .env.example .env
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Levanta la aplicación en desarrollo:
   ```bash
   npm run dev:tauri
   ```

## Compilación y Validación en Cascada

Este proyecto cuenta con un flujo de tipado y construcción en cascada. Al realizar modificaciones en el backend o en el esquema de base de datos, debes ejecutar la validación completa para comprobar que no se rompan las importaciones o el frontend:

```bash
npm run validate
```

### Flujo de Trabajo para Modificaciones
1. **Modificar Esquema**: Si cambias `packages/data-access/prisma/schema.prisma`, corre `npm run db:generate` para actualizar el cliente.
2. **Backend**: Ajusta la lógica en repositorios/servicios.
3. **Frontend**: tRPC propagará los tipos. Verifica errores de TypeScript corriendo `npm run validate`.
4. **Sidecar de Tauri**: Si modificas el backend y vas a compilar la app de Tauri, recuerda regenerar el binario ejecutable en el backend con:
   ```bash
   npm run build:sidecar --workspace=@sga/back-end
   ```


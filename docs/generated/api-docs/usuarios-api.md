# Documentación de API - Módulo `usuarios`

Este módulo se encarga de la administración del personal del sistema, incluyendo la creación de cuentas de usuario, la activación/desactivación de las mismas y la asignación o modificación de sus roles de acceso.

> [!NOTE]
> Todos los procedimientos de este módulo están protegidos bajo el procedimiento administrativo (`adminProcedure`) y requieren un token de autenticación que posea el rol de administrador.

## Procedimientos

### Gestión de Usuarios (`usuario`)

---

#### `usuarios.getRoles` (Query)
Obtiene el listado completo de los roles disponibles en la plataforma para poder asociarlos a los usuarios.

- **Nivel de Acceso**: Administrador (`adminProcedure`)
- **Inputs**: Ninguno
- **Outputs**:
  ```typescript
  Array<{
    rolId: number;
    nombre: string;
    descripcion: string | null;
  }>
  ```

---

#### `usuarios.listarUsuarios` (Query)
Retorna un listado paginado y filtrable de todos los usuarios registrados en el sistema, incluyendo sus roles asociados.

- **Nivel de Acceso**: Administrador (`adminProcedure`)
- **Inputs**:
  ```typescript
  {
    pagina?: number;  // Entero >= 1 (por defecto 1)
    limite?: number;  // Entero entre 1 y 100 (por defecto 20)
    busqueda?: string; // Opcional. Filtra por nombreUsuario, nombreCompleto o correo
  }
  ```
- **Outputs**:
  ```typescript
  {
    data: Array<{
      usuarioId: number;
      nombreUsuario: string;
      nombreCompleto: string;
      correo: string;
      telefono: string | null;
      activo: boolean;
      debeCambiarPwd: boolean;
      registradoEn: Date;
      usuariosRoles: Array<{
        rol: {
          rolId: number;
          nombre: string;
        }
      }>
    }>;
    meta: {
      total: number;
      pagina: number;
      limite: number;
      totalPaginas: number;
    }
  }
  ```

---

#### `usuarios.crearUsuario` (Mutation)
Crea un nuevo usuario en la base de datos con su contraseña encriptada y le asigna al menos un rol de acceso inicial.

- **Nivel de Acceso**: Administrador (`adminProcedure`)
- **Inputs**:
  ```typescript
  {
    nombreUsuario: string;   // Mínimo 4, máximo 80 caracteres
    nombreCompleto: string;  // Mínimo 10, máximo 120 caracteres
    correo: string;          // Formato de email válido, máximo 255 caracteres
    password: string;        // Mínimo 8, máximo 50 caracteres
    telefono?: string;       // Opcional, máximo 15 caracteres
    roles: number[];         // Arreglo de IDs de roles (mínimo 1 rol)
  }
  ```
- **Outputs**:
  ```typescript
  {
    success: boolean;
    usuarioId: number;
  }
  ```
- **Errores Posibles**:
  * `CONFLICT`: Si el `nombreUsuario` o `correo` ya está registrado en el sistema.
  * `BAD_REQUEST`: Si no se cumple con el tamaño o formato de las validaciones de Zod.

---

#### `usuarios.actualizarEstadoUsuario` (Mutation)
Permite activar o desactivar la cuenta de un usuario para impedir o permitir su acceso.

- **Nivel de Acceso**: Administrador (`adminProcedure`)
- **Inputs**:
  ```typescript
  {
    usuarioId: number;
    activo: boolean;
  }
  ```
- **Outputs**:
  ```typescript
  {
    success: boolean;
    activo: boolean;
  }
  ```
- **Errores Posibles**:
  * `BAD_REQUEST`: Si un administrador intenta desactivar su propia cuenta activa.

---

#### `usuarios.asignarRoles` (Mutation)
Reemplaza por completo los roles actuales del usuario por una nueva lista de roles proporcionada.

- **Nivel de Acceso**: Administrador (`adminProcedure`)
- **Inputs**:
  ```typescript
  {
    usuarioId: number;
    roles: number[]; // Arreglo de IDs de roles a asignar
  }
  ```
- **Outputs**:
  ```typescript
  {
    success: boolean;
  }
  ```
- **Errores Posibles**:
  * `BAD_REQUEST`: Si el ID de usuario no es válido o el arreglo de roles está vacío.

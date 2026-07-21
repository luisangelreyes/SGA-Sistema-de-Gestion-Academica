# Documentación de API - Módulo `auth`

Este módulo se encarga del manejo de acceso, autenticación de usuarios y sesiones del sistema.

## Procedimientos

### Autenticación y Sesiones

---

#### `auth.login` (Mutation)
Valida las credenciales del usuario, registra el intento de acceso (exitoso o fallido) y emite un token JWT si todo es correcto. Se aplican reglas de bloqueo automático si se alcanzan los 5 intentos fallidos consecutivos en la misma IP o cuenta.

- **Nivel de Acceso**: Público (`publicProcedure`)
- **Inputs**:
  ```typescript
  {
    correo: string; // Correo electrónico válido
    contrasena: string; // Contraseña plana
  }
  ```
- **Outputs**:
  ```typescript
  {
    token: string; // Token JWT para incluir en encabezados (Authorization: Bearer <token>)
    usuario: {
      id: number;
      nombre: string;
      roles: string[]; // Lista de nombres de roles asociados al usuario
      debeCambiarPwd: boolean | null;
    }
  }
  ```
- **Errores Posibles**:
  - `BAD_REQUEST`: Si el correo es inválido o falta algún dato.
  - `UNAUTHORIZED`: 
    - "Credenciales inválidas" (contraseña incorrecta o correo inexistente).
    - "Cuenta desactivada o eliminada".
    - "Cuenta bloqueada temporalmente" (por superar intentos de acceso).

---

#### `auth.logout` (Mutation)
Revoca el token activo agregándolo a la lista negra (`token_revocado`) para que no pueda volver a utilizarse hasta que expire naturalmente.

- **Nivel de Acceso**: Protegido (`protectedProcedure`)
- **Inputs**: Ninguno (Depende exclusivamente del token enviado en el Header)
- **Outputs**:
  ```typescript
  {
    success: boolean; // Indica si se completó exitosamente
  }
  ```
- **Errores Posibles**:
  - `UNAUTHORIZED`: Si no se proporciona token, es inválido, o ya ha sido revocado.
  - `INTERNAL_SERVER_ERROR`: Fallo del lado del servidor al intentar registrar la revocación.

---

#### `auth.me` (Query)
Permite a una aplicación cliente obtener la información del usuario autenticado actual y validar si el token sigue activo.

- **Nivel de Acceso**: Protegido (`protectedProcedure`)
- **Inputs**: Ninguno (Depende del Header)
- **Outputs**:
  ```typescript
  {
    usuarioId: number;
    nombreUsuario: string;
    jti: string; // ID único del token actual
    iat: number;
    exp: number;
  }
  ```
- **Errores Posibles**:
  - `UNAUTHORIZED`: Si el token no existe, expiró o está revocado.

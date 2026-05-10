# Guía de Registro de Aplicaciones en Oura y Whoop

Esta guía te ayudará a registrar BuddyOne como aplicación en Oura y Whoop para obtener las credenciales necesarias (Client ID y Client Secret).

## Tabla de Contenidos

1. [Registro en Oura Ring](#registro-en-oura-ring)
2. [Registro en Whoop](#registro-en-whoop)
3. [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
4. [Validación de Credenciales](#validación-de-credenciales)
5. [Solución de Problemas](#solución-de-problemas)

---

## Registro en Oura Ring

### Paso 1: Crear Cuenta de Desarrollador

1. Abre tu navegador y ve a [Oura Developer Portal](https://cloud.ouraring.com/oauth/applications)
2. Si no tienes cuenta, crea una en [Oura Sign Up](https://cloud.ouraring.com/auth/register)
3. Completa el formulario de registro con tu información
4. Verifica tu email
5. Inicia sesión en el portal de desarrolladores

### Paso 2: Crear Nueva Aplicación

1. En el dashboard de Oura, busca el botón **"Create Application"** o **"New Application"**
2. Completa el formulario con la siguiente información:

| Campo | Valor |
|-------|-------|
| **Nombre** | BuddyOne Health Hub |
| **Descripción** | Integración de datos de salud con Oura Ring para personalizar recomendaciones nutricionales |
| **Tipo de Aplicación** | Web Application |
| **Website** | https://buddyoneapp.com |
| **Contacto** | tu-email@buddyoneapp.com |

3. Haz clic en **"Create"** o **"Register Application"**

### Paso 3: Configurar URIs de Redirección

Después de crear la aplicación, necesitas configurar los URIs de redirección donde Oura redirigirá a los usuarios después de la autenticación.

**Para desarrollo local:**
```
http://localhost:3000/api/health-hub/oauth/oura/callback
```

**Para producción:**
```
https://buddyoneapp.com/api/health-hub/oauth/oura/callback
https://www.buddyoneapp.com/api/health-hub/oauth/oura/callback
```

**Pasos:**
1. En la página de tu aplicación, busca la sección **"Redirect URIs"** o **"OAuth Redirect URIs"**
2. Haz clic en **"Add URI"** o **"Add Redirect URI"**
3. Pega el primer URI: `http://localhost:3000/api/health-hub/oauth/oura/callback`
4. Haz clic en **"Add"**
5. Repite para los URIs de producción
6. Haz clic en **"Save"** o **"Update"**

### Paso 4: Obtener Credenciales

1. En la página de tu aplicación, busca la sección **"Credentials"** o **"API Keys"**
2. Encontrarás dos valores:
   - **Client ID**: Un identificador único para tu aplicación
   - **Client Secret**: Una contraseña secreta para tu aplicación

3. **Copia ambos valores** y guárdalos en un lugar seguro

**Ejemplo:**
```
Client ID: abc123def456ghi789jkl012mno345pqr
Client Secret: xyz789uvw456rst123opq890lmn567ijk
```

### Paso 5: Configurar Scopes

Oura permite solicitar acceso a diferentes tipos de datos. Asegúrate de que tu aplicación tenga acceso a:

- `personal_info` - Información personal del usuario
- `sleep` - Datos de sueño
- `activity` - Datos de actividad
- `readiness` - Puntuación de preparación
- `heart_rate` - Frecuencia cardíaca
- `hrv` - Variabilidad de frecuencia cardíaca
- `spo2` - Saturación de oxígeno
- `workout` - Datos de entrenamientos

Estos scopes se configuran en el código, no en el portal.

---

## Registro en Whoop

### Paso 1: Crear Cuenta de Desarrollador

1. Abre tu navegador y ve a [Whoop Developer Dashboard](https://developer.whoop.com/dashboard)
2. Si no tienes cuenta, crea una en [Whoop Developer Sign Up](https://developer.whoop.com/signup)
3. Completa el formulario de registro
4. Verifica tu email
5. Inicia sesión en el dashboard de desarrolladores

### Paso 2: Crear Nueva Aplicación

1. En el dashboard de Whoop, busca el botón **"Create Application"** o **"New App"**
2. Completa el formulario con la siguiente información:

| Campo | Valor |
|-------|-------|
| **Nombre** | BuddyOne Health Hub |
| **Descripción** | Integración de datos de salud con Whoop para personalizar recomendaciones nutricionales |
| **Tipo de Aplicación** | Web Application |
| **Website** | https://buddyoneapp.com |
| **Contacto** | tu-email@buddyoneapp.com |

3. Haz clic en **"Create"** o **"Register"**

### Paso 3: Configurar URIs de Redirección

**Para desarrollo local:**
```
http://localhost:3000/api/health-hub/oauth/whoop/callback
```

**Para producción:**
```
https://buddyoneapp.com/api/health-hub/oauth/whoop/callback
https://www.buddyoneapp.com/api/health-hub/oauth/whoop/callback
```

**Pasos:**
1. En la página de tu aplicación, busca la sección **"Redirect URIs"** o **"OAuth Redirect URIs"**
2. Haz clic en **"Add URI"** o **"Add Redirect URI"**
3. Pega el primer URI: `http://localhost:3000/api/health-hub/oauth/whoop/callback`
4. Haz clic en **"Add"**
5. Repite para los URIs de producción
6. Haz clic en **"Save"** o **"Update"**

### Paso 4: Configurar Scopes

Whoop permite solicitar acceso a diferentes tipos de datos. Asegúrate de seleccionar los siguientes scopes:

| Scope | Descripción |
|-------|-------------|
| `read:recovery` | Leer datos de recuperación (puntuación, HRV, frecuencia cardíaca en reposo) |
| `read:cycles` | Leer ciclos fisiológicos diarios (strain, recuperación) |
| `read:workout` | Leer datos de entrenamientos (duración, strain, calorías) |
| `read:sleep` | Leer datos de sueño (duración, calidad, etapas) |
| `read:profile` | Leer perfil de usuario (nombre, email) |
| `read:body_measurement` | Leer medidas corporales (altura, peso, frecuencia cardíaca máxima) |

**Pasos:**
1. En la página de tu aplicación, busca la sección **"Scopes"** o **"Permissions"**
2. Marca cada uno de los scopes listados arriba
3. Haz clic en **"Save"** o **"Update"**

### Paso 5: Obtener Credenciales

1. En la página de tu aplicación, busca la sección **"Credentials"** o **"API Keys"**
2. Encontrarás dos valores:
   - **Client ID**: Un identificador único para tu aplicación
   - **Client Secret**: Una contraseña secreta para tu aplicación

3. **Copia ambos valores** y guárdalos en un lugar seguro

**Ejemplo:**
```
Client ID: 987654321fedcba
Client Secret: abcdef123456789ghijklmnop
```

---

## Configuración de Variables de Entorno

Una vez que tengas las credenciales de Oura y Whoop, necesitas configurarlas en tu proyecto.

### Opción 1: Usar el Script Automatizado

```bash
bash scripts/register-wearables.sh
```

Este script te guiará interactivamente a través de todo el proceso.

### Opción 2: Configuración Manual

1. Crea un archivo `.env.local` en la raíz del proyecto (si no existe):

```bash
touch .env.local
```

2. Agrega las siguientes variables:

```env
# Oura Ring Configuration
OURA_CLIENT_ID=tu_oura_client_id_aqui
OURA_CLIENT_SECRET=tu_oura_client_secret_aqui
OURA_REDIRECT_URI=http://localhost:3000/api/health-hub/oauth/oura/callback

# Whoop Configuration
WHOOP_CLIENT_ID=tu_whoop_client_id_aqui
WHOOP_CLIENT_SECRET=tu_whoop_client_secret_aqui
WHOOP_REDIRECT_URI=http://localhost:3000/api/health-hub/oauth/whoop/callback

# Encryption Key (genera con: openssl rand -base64 32)
ENCRYPTION_KEY=tu_clave_encriptacion_aqui

# Health Hub Configuration
HEALTH_HUB_SYNC_INTERVAL=21600000
HEALTH_HUB_SYNC_ENABLED=true
```

3. Reemplaza los valores con tus credenciales reales

### Generar Clave de Encriptación

Para generar una clave de encriptación segura:

```bash
openssl rand -base64 32
```

Copia el resultado y pégalo en `ENCRYPTION_KEY` en tu `.env.local`.

---

## Validación de Credenciales

Para verificar que tus credenciales son correctas, puedes ejecutar el siguiente comando:

```bash
pnpm run validate-wearables
```

Este comando verificará:
- ✓ Que las variables de entorno estén configuradas
- ✓ Que los valores no estén vacíos
- ✓ Que el formato sea válido
- ✓ Que la conexión con las APIs sea posible

---

## Solución de Problemas

### "Client ID o Client Secret inválido"

**Causa:** Las credenciales no son correctas o están mal copiadas.

**Solución:**
1. Abre el portal de desarrolladores (Oura o Whoop)
2. Verifica que estés viendo la aplicación correcta
3. Copia nuevamente los valores, asegurándote de no incluir espacios
4. Actualiza tu `.env.local`
5. Reinicia el servidor

### "Redirect URI no coincide"

**Causa:** El URI de redirección en tu código no coincide con el registrado en el portal.

**Solución:**
1. Abre el portal de desarrolladores
2. Verifica que el URI registrado sea exactamente: `http://localhost:3000/api/health-hub/oauth/oura/callback` (o Whoop)
3. Asegúrate de que no haya espacios adicionales
4. Si cambias el puerto local, actualiza el URI registrado

### "Error 401: Unauthorized"

**Causa:** El Client Secret es inválido o ha expirado.

**Solución:**
1. Abre el portal de desarrolladores
2. Regenera el Client Secret (si es posible)
3. Copia el nuevo valor
4. Actualiza tu `.env.local`
5. Reinicia el servidor

### "Error 403: Forbidden"

**Causa:** Tu aplicación no tiene permiso para acceder a ciertos datos.

**Solución:**
1. Abre el portal de desarrolladores
2. Verifica que los scopes estén correctamente configurados
3. Para Whoop, asegúrate de que todos los scopes requeridos estén marcados
4. Reinicia el servidor

### "Error de conexión a la API"

**Causa:** Problema de conectividad o la API está caída.

**Solución:**
1. Verifica tu conexión a Internet
2. Intenta hacer ping a los servidores:
   ```bash
   ping api.ouraring.com
   ping api.prod.whoop.com
   ```
3. Verifica el estado de los servicios en:
   - [Oura Status](https://status.ouraring.com)
   - [Whoop Status](https://status.whoop.com)

---

## Seguridad

### Mejores Prácticas

1. **Nunca compartas tus credenciales**
   - No las publiques en GitHub
   - No las envíes por email
   - No las compartas en mensajes

2. **Mantén `.env.local` seguro**
   - Está en `.gitignore` por defecto
   - No lo commits al repositorio
   - No lo compartas con otros

3. **Usa variables de entorno en producción**
   - Configura las variables en tu plataforma de hosting
   - No uses archivos `.env` en producción
   - Usa secretos encriptados

4. **Rota tus credenciales regularmente**
   - Cada 3-6 meses, regenera los secretos
   - Actualiza las nuevas credenciales en tu código
   - Elimina las antiguas del portal

5. **Monitorea el acceso**
   - Revisa los logs de acceso a la API
   - Detecta actividades sospechosas
   - Desconecta usuarios no autorizados

---

## Referencias

- [Oura API Documentation](https://cloud.ouraring.com/v2/docs)
- [Oura OAuth Guide](https://support.ouraring.com/hc/en-us/articles/4415266939155-The-Oura-API)
- [Whoop API Documentation](https://developer.whoop.com/api/)
- [Whoop OAuth Guide](https://developer.whoop.com/docs/authentication)
- [OAuth 2.0 Specification](https://tools.ietf.org/html/rfc6749)

---

**Última actualización:** 10 de mayo de 2026  
**Versión:** 1.0  
**Autor:** Manus AI Agent

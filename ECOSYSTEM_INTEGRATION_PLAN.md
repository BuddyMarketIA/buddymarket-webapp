# Plan de Integración de Login Unificado del Ecosistema BuddyOne

**Versión:** 1.0  
**Fecha:** 10 de mayo de 2026  
**Estado:** En Diseño  
**Objetivo:** Implementar un sistema de login unificado que permita a los usuarios acceder a BuddyOne, BuddyCoach, BuddyShop y BuddyCare con una única cuenta y sesión.

---

## 1. Visión General

El ecosistema BuddyOne está compuesto por múltiples aplicaciones especializadas:

| Aplicación | Propósito | URL | Estado |
|------------|----------|-----|--------|
| **BuddyOne** | Gestor nutricional inteligente | buddyoneapp.com | ✅ Activo |
| **BuddyCoach** | Entrenamiento personal con IA | buddycoach.io | 🔄 Integración pendiente |
| **BuddyShop** | Tienda de productos saludables | buddyshop.io | 🔄 Integración pendiente |
| **BuddyCare** | Salud y bienestar integral | buddycare.io | 🔄 Integración pendiente |

### Objetivo del Login Unificado

Crear una experiencia de usuario seamless donde:
- Un usuario se autentica una sola vez en BuddyOne
- Accede automáticamente a todas las aplicaciones del ecosistema
- Mantiene una sesión única y sincronizada
- Sus datos y preferencias se comparten de forma segura entre aplicaciones

---

## 2. Arquitectura Actual

### 2.1 Autenticación en BuddyOne

**Métodos soportados:**
- Email/Contraseña
- Google SSO (OAuth 2.0)
- Apple Sign In (OAuth 2.0)
- OTP por Email

**Identificador único:**
- `openId`: Identificador único del usuario en el ecosistema (64 caracteres, único a nivel global)
- `id`: ID interno de la base de datos BuddyOne

**Sesión:**
- Cookie de sesión HTTP-only (`BUDDY_SESSION`)
- Validación mediante JWT firmado
- Dominio: `.manus.computer` (desarrollo) / `buddyoneapp.com` (producción)

### 2.2 Integración Actual con BuddyCoach

**Endpoint existente:**
```
GET /api/ecosystem/data?openId={openId}
```

**Headers requeridos:**
```
x-ecosystem-secret: {ECOSYSTEM_SECRET}
x-source-app: buddyone
```

**Respuesta:**
```json
{
  "workout": {
    "totalWorkouts": 42,
    "currentStreak": 7,
    "weeklyMinutes": 180
  }
}
```

### 2.3 Variables de Entorno Configuradas

```
BUDDYCOACH_API_URL=https://buddycoach.io
BUDDYSHOP_API_URL=https://buddyshop.io
BUDDYCARE_API_URL=https://buddycare.io
ECOSYSTEM_SECRET=buddyone-ecosystem-2026
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
```

---

## 3. Flujo de Login Unificado Propuesto

### 3.1 Flujo de Autenticación Inicial

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Usuario accede a buddyoneapp.com/login                       │
├─────────────────────────────────────────────────────────────────┤
│ 2. Selecciona método de login:                                  │
│    - Email/Contraseña                                           │
│    - Google SSO                                                 │
│    - Apple Sign In                                              │
│    - OTP por Email                                              │
├─────────────────────────────────────────────────────────────────┤
│ 3. BuddyOne valida credenciales                                 │
├─────────────────────────────────────────────────────────────────┤
│ 4. Genera/obtiene openId único                                  │
├─────────────────────────────────────────────────────────────────┤
│ 5. Crea sesión en BuddyOne                                      │
│    - Cookie BUDDY_SESSION                                       │
│    - JWT con openId y datos de usuario                          │
├─────────────────────────────────────────────────────────────────┤
│ 6. Redirige a dashboard de BuddyOne                             │
│    - Usuario autenticado en BuddyOne                            │
│    - openId disponible en contexto                              │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Flujo de Acceso a Aplicaciones del Ecosistema

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Usuario hace clic en "Ir a BuddyCoach"                       │
├─────────────────────────────────────────────────────────────────┤
│ 2. BuddyOne genera un token de sesión temporal                  │
│    - Contiene: openId, userId, email, rol                       │
│    - Válido por 5 minutos                                       │
│    - Firmado con ECOSYSTEM_SECRET                               │
├─────────────────────────────────────────────────────────────────┤
│ 3. Redirige a BuddyCoach con token:                             │
│    buddycoach.io/ecosystem/login?token={JWT}                    │
├─────────────────────────────────────────────────────────────────┤
│ 4. BuddyCoach valida token                                      │
│    - Verifica firma con ECOSYSTEM_SECRET                        │
│    - Verifica expiración                                        │
├─────────────────────────────────────────────────────────────────┤
│ 5. BuddyCoach crea sesión local                                 │
│    - Usa openId como identificador                              │
│    - Obtiene datos del usuario desde BuddyOne si es necesario   │
├─────────────────────────────────────────────────────────────────┤
│ 6. Redirige a dashboard de BuddyCoach                           │
│    - Usuario autenticado en BuddyCoach                          │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Flujo de Sincronización de Sesión

```
┌─────────────────────────────────────────────────────────────────┐
│ Cuando usuario está en BuddyCoach y vuelve a BuddyOne:          │
├─────────────────────────────────────────────────────────────────┤
│ 1. BuddyOne verifica sesión existente                           │
│    - Si cookie BUDDY_SESSION válida → mantener sesión          │
│    - Si expirada → mostrar login                                │
├─────────────────────────────────────────────────────────────────┤
│ 2. Si el usuario cierra sesión en BuddyOne:                     │
│    - Invalida BUDDY_SESSION                                     │
│    - Notifica a BuddyCoach, BuddyShop, BuddyCare               │
│    - Invalida sesiones en todas las apps                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Componentes Técnicos Requeridos

### 4.1 Backend - BuddyOne

#### Nuevos Endpoints

**1. Generar Token de Sesión Temporal**
```
POST /api/ecosystem/session-token
Content-Type: application/json
Authorization: Bearer {JWT_SESSION}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 300,
  "ecosystem": ["buddycoach", "buddyshop", "buddycare"]
}
```

**2. Validar Token de Sesión**
```
POST /api/ecosystem/validate-token
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response:
{
  "valid": true,
  "openId": "user-123-abc",
  "userId": 42,
  "email": "user@example.com",
  "role": "user",
  "expiresAt": 1715427600
}
```

**3. Obtener Datos de Usuario para Ecosistema**
```
GET /api/ecosystem/user/{openId}
Headers:
  x-ecosystem-secret: {ECOSYSTEM_SECRET}
  x-source-app: buddycoach

Response:
{
  "openId": "user-123-abc",
  "name": "Luis García",
  "email": "luis@example.com",
  "role": "user",
  "subscriptionStatus": "active",
  "subscriptionPlan": "pro_max",
  "locale": "es"
}
```

**4. Invalidar Sesión en Ecosistema**
```
POST /api/ecosystem/logout
Headers:
  x-ecosystem-secret: {ECOSYSTEM_SECRET}
  x-source-app: buddycoach

{
  "openId": "user-123-abc",
  "sourceApp": "buddyone"
}

Response:
{
  "success": true,
  "invalidatedApps": ["buddycoach", "buddyshop", "buddycare"]
}
```

#### Cambios en Routers Existentes

**Actualizar `ecosystem.getBuddyCoachSummary`:**
```typescript
// Agregar validación de suscripción activa
// Agregar caché de resultados
// Agregar retry logic con backoff exponencial
```

#### Nuevas Utilidades

**`server/_core/ecosystem.ts`:**
```typescript
// Generar token de sesión temporal
export async function generateEcosystemToken(
  user: User,
  expiresIn: number = 300
): Promise<string>

// Validar token de sesión
export async function validateEcosystemToken(
  token: string
): Promise<{ valid: boolean; user?: User; error?: string }>

// Notificar logout a todas las apps
export async function notifyEcosystemLogout(
  openId: string,
  sourceApp: string
): Promise<void>

// Obtener estado de suscripción
export async function getSubscriptionStatus(
  userId: number
): Promise<SubscriptionStatus>
```

### 4.2 Frontend - BuddyOne

#### Nuevos Componentes

**`EcosystemNavigation.tsx`:**
- Botones para acceder a BuddyCoach, BuddyShop, BuddyCare
- Verificación de suscripción activa antes de permitir acceso
- Indicadores de estado de conexión

**`EcosystemLoginModal.tsx`:**
- Modal para seleccionar aplicación del ecosistema
- Verificación de permisos y suscripción
- Spinner de carga durante redirección

#### Cambios en Componentes Existentes

**`DashboardLayout.tsx`:**
- Agregar sección "Ecosistema" en navegación lateral
- Mostrar estado de conexión con otras apps
- Agregar botones de acceso rápido

**`LoginPage.tsx`:**
- Agregar opción "Continuar con otra app del ecosistema"
- Permitir login desde BuddyCoach/BuddyShop/BuddyCare

#### Nuevos Hooks

**`useEcosystem.ts`:**
```typescript
export function useEcosystem() {
  return {
    // Generar token para acceder a otra app
    generateAccessToken: (appName: string) => Promise<string>,
    
    // Verificar si usuario tiene acceso a una app
    hasAccess: (appName: string) => boolean,
    
    // Obtener URL de redirección a otra app
    getRedirectUrl: (appName: string) => string,
    
    // Sincronizar sesión con otras apps
    syncSession: () => Promise<void>,
  }
}
```

### 4.3 Cambios en Base de Datos

#### Nueva Tabla: `ecosystem_sessions`

```sql
CREATE TABLE ecosystem_sessions (
  id SERIAL PRIMARY KEY,
  openId VARCHAR(64) NOT NULL UNIQUE,
  userId INTEGER NOT NULL REFERENCES users(id),
  
  -- Sesiones en cada app
  buddycoach_session_id VARCHAR(255),
  buddycoach_expires_at TIMESTAMP,
  buddyshop_session_id VARCHAR(255),
  buddyshop_expires_at TIMESTAMP,
  buddycare_session_id VARCHAR(255),
  buddycare_expires_at TIMESTAMP,
  
  -- Sincronización
  last_sync_at TIMESTAMP DEFAULT NOW(),
  sync_status VARCHAR(50) DEFAULT 'synced',
  
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Nueva Tabla: `ecosystem_tokens`

```sql
CREATE TABLE ecosystem_tokens (
  id SERIAL PRIMARY KEY,
  openId VARCHAR(64) NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  target_app VARCHAR(50) NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  
  FOREIGN KEY (openId) REFERENCES users(openId) ON DELETE CASCADE
);
```

#### Índices

```sql
CREATE INDEX idx_ecosystem_sessions_openId ON ecosystem_sessions(openId);
CREATE INDEX idx_ecosystem_sessions_userId ON ecosystem_sessions(userId);
CREATE INDEX idx_ecosystem_tokens_openId ON ecosystem_tokens(openId);
CREATE INDEX idx_ecosystem_tokens_expires_at ON ecosystem_tokens(expires_at);
```

---

## 5. Flujo de Implementación

### Fase 1: Preparación (Semana 1)

- [ ] Crear tablas en base de datos
- [ ] Crear utilidades de ecosistema en `server/_core/ecosystem.ts`
- [ ] Escribir tests para funciones de token
- [ ] Documentar API de ecosistema

### Fase 2: Backend (Semana 2)

- [ ] Implementar endpoints de token
- [ ] Implementar endpoint de validación
- [ ] Implementar endpoint de logout
- [ ] Agregar tests de integración
- [ ] Configurar CORS para dominios del ecosistema

### Fase 3: Frontend (Semana 3)

- [ ] Crear componentes de navegación del ecosistema
- [ ] Crear hook `useEcosystem`
- [ ] Integrar en `DashboardLayout`
- [ ] Agregar botones de acceso rápido

### Fase 4: Integración con BuddyCoach (Semana 4)

- [ ] Implementar endpoint de login en BuddyCoach
- [ ] Implementar validación de token
- [ ] Probar flujo completo
- [ ] Documentar para BuddyCoach

### Fase 5: Integración con BuddyShop y BuddyCare (Semana 5-6)

- [ ] Repetir proceso para BuddyShop
- [ ] Repetir proceso para BuddyCare
- [ ] Pruebas de sincronización

### Fase 6: Validación de Suscripción (Semana 7)

- [ ] Implementar verificación de suscripción activa
- [ ] Crear página de upsell para usuarios sin suscripción
- [ ] Agregar analytics de acceso

### Fase 7: Testing y Deployment (Semana 8)

- [ ] Tests E2E
- [ ] Tests de seguridad
- [ ] Deployment a producción
- [ ] Monitoreo

---

## 6. Seguridad

### 6.1 Consideraciones de Seguridad

**Token de Sesión Temporal:**
- Válido solo por 5 minutos
- Puede usarse una sola vez
- Contiene hash del IP del usuario (opcional)
- Firmado con ECOSYSTEM_SECRET

**Validación de Dominio:**
- Solo aceptar redirecciones desde dominios autorizados
- Validar `Referer` header
- Usar CORS restrictivo

**Secreto Compartido:**
- `ECOSYSTEM_SECRET` debe ser rotado regularmente
- Usar diferentes secretos por ambiente
- Almacenar en variables de entorno seguras

### 6.2 Checklist de Seguridad

- [ ] Validar todos los tokens antes de usar
- [ ] Implementar rate limiting en endpoints de token
- [ ] Usar HTTPS en todas las comunicaciones
- [ ] Implementar CSRF protection
- [ ] Validar CORS headers
- [ ] Loguear intentos de acceso fallidos
- [ ] Implementar alertas de acceso anómalo

---

## 7. Validación de Suscripción

### 7.1 Flujo de Validación

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Usuario intenta acceder a BuddyCoach                         │
├─────────────────────────────────────────────────────────────────┤
│ 2. BuddyOne verifica estado de suscripción                      │
│    - Plan: free, basic, premium, pro_max                        │
│    - Estado: active, trial, cancelled, expired                  │
├─────────────────────────────────────────────────────────────────┤
│ 3. Si suscripción activa:                                       │
│    - Generar token                                              │
│    - Redirigir a BuddyCoach                                     │
├─────────────────────────────────────────────────────────────────┤
│ 4. Si sin suscripción o plan insuficiente:                      │
│    - Mostrar modal de upsell                                    │
│    - Ofrecer upgrade a Pro o Pro Max                            │
│    - Opción de prueba gratuita                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Planes y Acceso

| Plan | BuddyCoach | BuddyShop | BuddyCare |
|------|-----------|-----------|-----------|
| Free | ❌ | ❌ | ❌ |
| Basic | ✅ | ✅ | ❌ |
| Premium | ✅ | ✅ | ✅ |
| Pro Max | ✅ | ✅ | ✅ |

---

## 8. Monitoreo y Analytics

### 8.1 Métricas a Rastrear

- Número de usuarios que acceden al ecosistema
- Aplicación más accedida
- Tasa de conversión de free a paid
- Tiempo promedio de sesión en cada app
- Tasa de error en transiciones entre apps

### 8.2 Alertas

- Tasa de error > 5% en endpoint de token
- Tiempo de respuesta > 2 segundos
- Más de 10 intentos fallidos de token en 5 minutos
- Logout masivo en corto período

---

## 9. Roadmap Futuro

### Fase 2: Sincronización de Datos

- Sincronizar datos de usuario entre apps
- Compartir historial de actividad
- Notificaciones unificadas

### Fase 3: Experiencia Unificada

- Dashboard unificado con datos de todas las apps
- Búsqueda global
- Notificaciones en tiempo real

### Fase 4: Monetización

- Planes de suscripción unificados
- Pago único para acceso a todas las apps
- Descuentos por bundle

---

## 10. Referencias y Recursos

- [OAuth 2.0 Specification](https://tools.ietf.org/html/rfc6749)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- Código existente: `server/_core/oauth.ts`, `server/routers.ts`
- Tests existentes: `server/buddycoach-integration.test.ts`

---

## 11. Aprobaciones y Firmas

| Rol | Nombre | Fecha | Firma |
|-----|--------|-------|-------|
| Product Manager | | | |
| Tech Lead | | | |
| Security Lead | | | |
| Project Manager | | | |

---

**Documento preparado por:** Manus AI Agent  
**Fecha de creación:** 10 de mayo de 2026  
**Última actualización:** 10 de mayo de 2026  
**Versión:** 1.0

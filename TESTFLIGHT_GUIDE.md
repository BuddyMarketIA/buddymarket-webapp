# Guía de Subida a TestFlight — BuddyMarket

## Estado actual del proyecto Capacitor

| Elemento | Estado |
|---|---|
| Capacitor versión | 8.3.0 ✅ |
| Bundle ID iOS | `io.buddymarket.app` ✅ |
| Bundle ID Android | `io.buddymarket.app` ✅ |
| Icono iOS (1024x1024) | ✅ Icono oficial |
| Splash screen iOS (2732x2732) | ✅ |
| Iconos Android (mdpi→xxxhdpi) | ✅ |
| Info.plist con permisos | ✅ |
| AndroidManifest.xml con permisos | ✅ |
| codemagic.yaml | ✅ |

---

## Opción A: Compilar con Codemagic (recomendado — sin Mac necesario)

### Paso 1: Conectar el repositorio a Codemagic

1. Ir a [codemagic.io](https://codemagic.io) → Sign up con GitHub
2. Clic en **Add application** → seleccionar el repositorio `buddymarket-webapp`
3. Codemagic detectará automáticamente el `codemagic.yaml`

### Paso 2: Configurar las credenciales de Apple en Codemagic

En Codemagic → **Teams** → **Global variables** → crear el grupo `apple_credentials`:

| Variable | Valor |
|---|---|
| `APP_STORE_CONNECT_ISSUER_ID` | Tu Issuer ID de App Store Connect API |
| `APP_STORE_CONNECT_KEY_IDENTIFIER` | `98XKBK9WR7` (ya lo tienes) |
| `APP_STORE_CONNECT_PRIVATE_KEY` | Contenido del archivo `.p8` |

**Cómo obtener el Issuer ID:**
1. Ir a [App Store Connect](https://appstoreconnect.apple.com) → Users and Access → Integrations → App Store Connect API
2. El Issuer ID aparece en la parte superior de la página

### Paso 3: Crear la app en App Store Connect

1. Ir a [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. **My Apps** → **+** → **New App**
3. Rellenar:
   - **Platform:** iOS
   - **Name:** BuddyMarket
   - **Primary Language:** Spanish
   - **Bundle ID:** `io.buddymarket.app`
   - **SKU:** `buddymarket-ios-001`
4. Guardar el **Apple ID** numérico que aparece (ej: `6744649860`) y actualizarlo en `codemagic.yaml`

### Paso 4: Crear el certificado de distribución

En Codemagic, en la sección **Code signing** del workflow `ios-testflight`:
- Codemagic puede crear y gestionar el certificado automáticamente si le das permisos de App Store Connect API

Alternativamente, en Xcode (si tienes Mac):
1. Xcode → Preferences → Accounts → Manage Certificates → + → Apple Distribution

### Paso 5: Lanzar el primer build

1. En Codemagic → seleccionar workflow `ios-testflight` → **Start new build**
2. El build tarda ~20-30 minutos
3. Al terminar, el `.ipa` se sube automáticamente a TestFlight

### Paso 6: Añadir testers en TestFlight

1. App Store Connect → Tu app → TestFlight
2. **Internal Testing** → Add testers (hasta 100 personas de tu equipo)
3. **External Testing** → Add group → invitar testers externos (requiere revisión de Apple, ~24h)

---

## Opción B: Compilar localmente con Xcode (requiere Mac)

### Requisitos
- Mac con macOS 14+ (Sonoma o superior)
- Xcode 16+
- Apple Developer account activa

### Pasos

```bash
# 1. Clonar el repo y hacer build
git clone https://github.com/tu-usuario/buddymarket-webapp
cd buddymarket-webapp
pnpm install
pnpm build
npx cap sync ios

# 2. Abrir en Xcode
npx cap open ios
```

En Xcode:
1. Seleccionar el target **App**
2. **Signing & Capabilities** → Team: `66G44X4PZ3` (tu Team ID)
3. Bundle Identifier: `io.buddymarket.app`
4. **Product** → **Archive**
5. Cuando termine → **Distribute App** → **TestFlight & App Store**

---

## Permisos configurados

### iOS (Info.plist)
| Permiso | Uso |
|---|---|
| NSCameraUsageDescription | Escaneo de códigos de barras |
| NSPhotoLibraryUsageDescription | Foto de perfil |
| NSLocationWhenInUseUsageDescription | Supermercados cercanos |
| NSFaceIDUsageDescription | Acceso rápido seguro |

### Android (AndroidManifest.xml)
| Permiso | Uso |
|---|---|
| CAMERA | Escaneo de códigos de barras |
| READ_MEDIA_IMAGES | Foto de perfil |
| POST_NOTIFICATIONS | Recordatorios de comidas |
| ACCESS_FINE_LOCATION | Supermercados cercanos |
| USE_BIOMETRIC | Acceso rápido seguro |

---

## Antes del lanzamiento público en App Store (no TestFlight)

- [ ] Implementar StoreKit 2 para suscripciones PRO en iOS (Stripe no está permitido)
- [ ] Completar los metadatos de la app: descripción, capturas de pantalla, palabras clave
- [ ] Declarar el uso de datos de salud en App Store Connect (Privacy Nutrition Label)
- [ ] Añadir URL de soporte y URL de política de privacidad en App Store Connect

---

## Credenciales Apple ya configuradas

| Dato | Valor |
|---|---|
| Team ID | `66G44X4PZ3` |
| Key ID | `98XKBK9WR7` |
| Bundle ID | `io.buddymarket.app` |
| Service ID (web) | `com.buddymarket.web` |
| Archivo .p8 | `/home/ubuntu/upload/pasted_file_dLWnJJ_AuthKey_98XKBK9WR7.p8` |

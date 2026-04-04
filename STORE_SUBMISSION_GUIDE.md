# BuddyMarket — Guía de Publicación en Stores

## Resumen de la arquitectura

BuddyMarket usa **Capacitor** como wrapper nativo sobre la PWA. Esto permite publicar en App Store y Google Play con el mismo código base.

```
Web App (React + Vite) → dist/public/ → Capacitor → iOS (.ipa) / Android (.aab)
```

---

## Requisitos previos

| Herramienta | Versión mínima | Plataforma |
|---|---|---|
| Xcode | 15.0+ | macOS únicamente |
| Android Studio | Hedgehog (2023.1.1)+ | macOS / Windows / Linux |
| Node.js | 18+ | Ambas |
| CocoaPods | 1.14+ | iOS |
| Java JDK | 17+ | Android |

---

## 1. Preparación del build

```bash
# Instalar dependencias
pnpm install

# Build web + sync a nativo
pnpm build:mobile
# Equivale a: pnpm build && npx cap sync
```

---

## 2. iOS — App Store

### 2.1 Configuración inicial (primera vez)

```bash
# Inicializar proyecto iOS (solo la primera vez)
npx cap add ios

# Abrir en Xcode
npx cap open ios
```

### 2.2 Configuración en Xcode

1. **Bundle Identifier**: `com.buddymarket.app`
2. **Display Name**: `BuddyMarket`
3. **Version**: `1.0.0` / **Build**: `1`
4. **Deployment Target**: iOS 15.0+
5. **Signing & Capabilities**:
   - Seleccionar tu Apple Developer Team
   - Activar "Automatically manage signing"
6. **Capabilities a añadir**:
   - Push Notifications
   - Background Modes → Remote notifications

### 2.3 Info.plist — Permisos requeridos

Añadir en `ios/App/App/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>BuddyMarket necesita acceso a la cámara para subir tu foto de perfil.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>BuddyMarket necesita acceso a tus fotos para subir tu foto de perfil.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>BuddyMarket necesita guardar imágenes en tu galería.</string>

<key>NSUserNotificationsUsageDescription</key>
<string>BuddyMarket te enviará recordatorios de comidas y resúmenes nutricionales.</string>
```

### 2.4 Iconos iOS

Copiar los iconos generados a `ios/App/App/Assets.xcassets/AppIcon.appiconset/`:

| Archivo | Tamaño | Uso |
|---|---|---|
| `iphone-app-60pt@2x.png` | 120×120 | iPhone App @2x |
| `iphone-app-60pt@3x.png` | 180×180 | iPhone App @3x |
| `ipad-app-76pt.png` | 76×76 | iPad App |
| `ipad-app-76pt@2x.png` | 152×152 | iPad App @2x |
| `ipad-pro-app-83.5pt@2x.png` | 167×167 | iPad Pro |
| `ios-app-store-1024.png` | 1024×1024 | App Store |

> Los iconos generados están en: `scripts/generate-icons.py` → `/home/ubuntu/webdev-static-assets/buddymarket-store-assets/ios/`

### 2.5 Subir a App Store Connect

```bash
# En Xcode:
# Product → Archive → Distribute App → App Store Connect → Upload
```

### 2.6 Metadatos para App Store Connect

| Campo | Valor |
|---|---|
| **Nombre** | BuddyMarket — Gestor Nutricional |
| **Subtítulo** | Menús, recetas y diario con IA |
| **Bundle ID** | com.buddymarket.app |
| **Categoría primaria** | Health & Fitness |
| **Categoría secundaria** | Food & Drink |
| **Precio** | Gratis (con compras integradas) |
| **Edad** | 4+ |
| **Idiomas** | Español (principal) |

**Descripción corta (30 chars):**
```
Tu nutrición, inteligente
```

**Descripción larga:**
```
BuddyMarket es el ecosistema nutricional inteligente que se adapta a ti.

✅ MENÚS SEMANALES PERSONALIZADOS
Genera automáticamente menús equilibrados según tus objetivos, restricciones alimentarias y presupuesto. Con un solo tap, tienes toda la semana planificada.

🛒 LISTA DE LA COMPRA AUTOMÁTICA
Exporta directamente a Mercadona o Carrefour. La app detecta los productos y los añade al carrito del supermercado por ti.

📊 DIARIO NUTRICIONAL CON IA
Registra tus comidas y recibe análisis detallados de calorías, proteínas, carbohidratos y grasas. Compara con tus objetivos en tiempo real.

🍳 RECETAS PERSONALIZADAS
Más de 500 recetas filtradas por tus preferencias, tiempo disponible e ingredientes que ya tienes en casa.

📦 CONTROL DE INVENTARIO
Gestiona tu despensa y recibe alertas de caducidad. La app sabe lo que tienes y lo usa para planificar tus menús.

🏆 SISTEMA DE LOGROS
Mantén la motivación con retos, puntos y niveles. Comparte tus progresos con la comunidad BuddyMarket.

🤖 BUDDYIA — Tu asistente nutricional
Pregunta cualquier cosa sobre nutrición, recetas o tu plan semanal. Powered by IA.
```

**Palabras clave:**
```
nutrición,dieta,recetas,menú semanal,lista compra,calorías,macros,fitness,salud,meal planning
```

---

## 3. Android — Google Play Store

### 3.1 Configuración inicial (primera vez)

```bash
# Inicializar proyecto Android (solo la primera vez)
npx cap add android

# Abrir en Android Studio
npx cap open android
```

### 3.2 Configuración en Android Studio

1. **Application ID**: `com.buddymarket.app`
2. **App Name**: `BuddyMarket`
3. **Version Name**: `1.0.0` / **Version Code**: `1`
4. **Min SDK**: 26 (Android 8.0)
5. **Target SDK**: 34 (Android 14)

### 3.3 AndroidManifest.xml — Permisos

En `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

### 3.4 Iconos Android

Copiar los iconos generados a `android/app/src/main/res/`:

```
mipmap-mdpi/ic_launcher.png          (48×48)
mipmap-hdpi/ic_launcher.png          (72×72)
mipmap-xhdpi/ic_launcher.png         (96×96)
mipmap-xxhdpi/ic_launcher.png        (144×144)
mipmap-xxxhdpi/ic_launcher.png       (192×192)
mipmap-*/ic_launcher_round.png       (mismo tamaño, circular)
mipmap-*/ic_launcher_foreground.png  (con padding para adaptive icon)
mipmap-*/ic_launcher_background.png  (fondo naranja)
```

> Los iconos generados están en: `/home/ubuntu/webdev-static-assets/buddymarket-store-assets/android/`

### 3.5 Generar AAB firmado

```bash
# En Android Studio:
# Build → Generate Signed Bundle/APK → Android App Bundle
# Crear keystore si no existe (guardar en lugar seguro)
```

> **IMPORTANTE**: Guarda el keystore y las contraseñas en un lugar seguro. Sin ellos no podrás actualizar la app.

### 3.6 Metadatos para Google Play Console

| Campo | Valor |
|---|---|
| **Nombre** | BuddyMarket — Gestor Nutricional |
| **Nombre corto** | BuddyMarket |
| **Package** | com.buddymarket.app |
| **Categoría** | Salud y bienestar |
| **Clasificación de contenido** | Apto para todos |
| **Precio** | Gratis |

**Descripción corta (80 chars):**
```
Menús semanales, recetas y lista de la compra con IA nutricional
```

**Descripción larga** (misma que iOS)

---

## 4. Assets necesarios para las stores

### App Store (iOS)
| Asset | Tamaño | Formato |
|---|---|---|
| Icono App Store | 1024×1024 | PNG sin transparencia |
| Screenshots iPhone 6.7" | 1290×2796 | PNG/JPG (mín. 3, máx. 10) |
| Screenshots iPhone 6.5" | 1242×2688 | PNG/JPG |
| Screenshots iPad 12.9" | 2048×2732 | PNG/JPG |

### Google Play (Android)
| Asset | Tamaño | Formato |
|---|---|---|
| Icono | 512×512 | PNG 32-bit |
| Feature Graphic | 1024×500 | PNG/JPG |
| Screenshots teléfono | mín. 320px | PNG/JPG (mín. 2, máx. 8) |
| Screenshots tablet 7" | mín. 320px | PNG/JPG (opcional) |

---

## 5. Flujo de actualización

```bash
# 1. Hacer cambios en el código
# 2. Incrementar versión en package.json
# 3. Build y sync
pnpm build:mobile

# 4. iOS: incrementar Build Number en Xcode → Archive → Upload
# 5. Android: incrementar versionCode en build.gradle → Generate AAB → Upload
```

---

## 6. Checklist antes de publicar

### General
- [ ] Bundle ID / Package name: `com.buddymarket.app`
- [ ] Versión: `1.0.0` (o la que corresponda)
- [ ] Todos los iconos en los tamaños correctos
- [ ] Splash screen configurado
- [ ] Política de privacidad publicada en: `https://buddymarketapp.com/privacy`
- [ ] Términos de uso publicados en: `https://buddymarketapp.com/terms`

### iOS específico
- [ ] Apple Developer Program activo ($99/año)
- [ ] Certificados de distribución configurados
- [ ] Provisioning Profile creado
- [ ] Info.plist con todos los permisos justificados
- [ ] App Store Connect: ficha creada con metadatos
- [ ] Screenshots subidas (mín. iPhone 6.7")
- [ ] Clasificación de edad completada
- [ ] Información de privacidad (App Privacy) completada

### Android específico
- [ ] Cuenta Google Play Console activa ($25 único pago)
- [ ] Keystore generado y guardado en lugar seguro
- [ ] AAB firmado generado
- [ ] Google Play Console: ficha creada
- [ ] Screenshots subidas (mín. 2 teléfono)
- [ ] Feature Graphic subido (1024×500)
- [ ] Política de privacidad URL añadida
- [ ] Cuestionario de clasificación de contenido completado

---

## 7. Comandos útiles

```bash
# Verificar configuración de Capacitor
npx cap doctor

# Sincronizar cambios web a nativo
npx cap sync

# Solo copiar assets (sin actualizar plugins)
npx cap copy

# Abrir en IDE nativo
npx cap open ios
npx cap open android

# Listar plugins instalados
npx cap ls
```

---

## 8. Soporte y recursos

- [Capacitor Docs](https://capacitorjs.com/docs)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Guidelines](https://m3.material.io/)

# Scripts de Integración de Wearables

Este directorio contiene scripts para registrar y validar las aplicaciones en Oura y Whoop.

## Archivos

### 1. `register-wearables.sh`

Script interactivo en Bash que guía el proceso completo de registro de aplicaciones en Oura y Whoop.

**Uso:**
```bash
bash scripts/register-wearables.sh
```

**Funcionalidades:**
- Validación del entorno
- Guía paso a paso para registrar en Oura
- Guía paso a paso para registrar en Whoop
- Captura interactiva de credenciales
- Generación automática de clave de encriptación
- Configuración de variables de entorno
- Guardado seguro de credenciales

**Requisitos:**
- Bash 4.0+
- `jq` (opcional, para procesamiento JSON)
- `openssl` (para generar claves de encriptación)

**Salida:**
- `.env.local` - Variables de entorno configuradas
- `wearables-credentials.json` - Credenciales guardadas (NO COMMITEAR)

### 2. `validate-wearables.py`

Script en Python que valida las credenciales y la conectividad con las APIs.

**Uso:**
```bash
python3 scripts/validate-wearables.py
```

**Validaciones:**
- ✓ Variables de entorno configuradas
- ✓ Formato de credenciales válido
- ✓ Conectividad con APIs de Oura y Whoop
- ✓ Obtención exitosa de tokens de acceso

**Requisitos:**
- Python 3.6+
- `requests` library (instala con: `pip install requests`)

**Salida:**
- Reporte detallado de validaciones
- Código de salida 0 si todo es válido, 1 si hay errores

## Flujo Recomendado

### Primer Setup

1. **Registrar aplicaciones:**
   ```bash
   bash scripts/register-wearables.sh
   ```
   Este script te guiará interactivamente a través de:
   - Crear cuenta de desarrollador en Oura
   - Registrar aplicación en Oura
   - Configurar URIs de redirección en Oura
   - Obtener Client ID y Client Secret de Oura
   - Repetir lo mismo para Whoop
   - Guardar credenciales de forma segura

2. **Validar credenciales:**
   ```bash
   python3 scripts/validate-wearables.py
   ```
   Este script verificará que todo esté configurado correctamente.

3. **Crear tablas en BD:**
   ```bash
   pnpm db:push
   ```

4. **Iniciar servidor:**
   ```bash
   pnpm dev
   ```

### Validación Periódica

Para verificar que las credenciales siguen siendo válidas:

```bash
python3 scripts/validate-wearables.py
```

Esto es útil después de:
- Cambios en variables de entorno
- Actualización de credenciales
- Cambios de entorno (dev → staging → prod)

## Configuración Manual

Si prefieres no usar los scripts, puedes configurar manualmente:

1. **Registrar en Oura:**
   - Ve a https://cloud.ouraring.com/oauth/applications
   - Crea una nueva aplicación
   - Configura los URIs de redirección
   - Copia Client ID y Client Secret

2. **Registrar en Whoop:**
   - Ve a https://developer.whoop.com/dashboard
   - Crea una nueva aplicación
   - Configura los URIs de redirección
   - Configura los scopes
   - Copia Client ID y Client Secret

3. **Configurar variables de entorno:**
   ```bash
   cat > .env.local << EOF
   OURA_CLIENT_ID=tu_client_id
   OURA_CLIENT_SECRET=tu_client_secret
   WHOOP_CLIENT_ID=tu_client_id
   WHOOP_CLIENT_SECRET=tu_client_secret
   ENCRYPTION_KEY=$(openssl rand -base64 32)
   EOF
   ```

## Seguridad

### ⚠️ IMPORTANTE

- **NUNCA** compartas `wearables-credentials.json`
- **NUNCA** commitees `.env.local` a Git
- **NUNCA** publiques tus credenciales en redes sociales o foros
- **NUNCA** incluyas credenciales en logs o mensajes de error

### Buenas Prácticas

1. Mantén `.env.local` en `.gitignore` (ya está configurado)
2. Usa variables de entorno en producción
3. Rota tus credenciales cada 3-6 meses
4. Monitorea el acceso a tus aplicaciones
5. Usa claves de encriptación fuertes

## Solución de Problemas

### "Permission denied" al ejecutar script

```bash
chmod +x scripts/register-wearables.sh
bash scripts/register-wearables.sh
```

### "Command not found: python3"

Instala Python 3:
```bash
sudo apt-get install python3
```

### "ModuleNotFoundError: No module named 'requests'"

Instala la librería requests:
```bash
pip3 install requests
```

### "jq: command not found"

Instala jq (opcional):
```bash
sudo apt-get install jq
```

### Las credenciales no funcionan

1. Verifica que estén correctamente copiadas (sin espacios)
2. Verifica que los URIs de redirección coincidan
3. Verifica que los scopes estén configurados (especialmente en Whoop)
4. Regenera los secretos en el portal de desarrolladores
5. Ejecuta `python3 scripts/validate-wearables.py` para más detalles

## Referencias

- [Oura Developer Portal](https://cloud.ouraring.com/oauth/applications)
- [Oura API Documentation](https://cloud.ouraring.com/v2/docs)
- [Whoop Developer Dashboard](https://developer.whoop.com/dashboard)
- [Whoop API Documentation](https://developer.whoop.com/api/)
- [Guía de Registro Manual](../docs/WEARABLES_REGISTRATION_GUIDE.md)
- [Plan de Integración Completo](../HEALTH_HUB_INTEGRATION_PLAN.md)

## Soporte

Para más información sobre la integración de Health Hub:
- Lee `HEALTH_HUB_INTEGRATION_PLAN.md`
- Lee `docs/WEARABLES_REGISTRATION_GUIDE.md`
- Revisa los comentarios en el código
- Consulta la documentación de Oura y Whoop

---

**Última actualización:** 10 de mayo de 2026  
**Versión:** 1.0

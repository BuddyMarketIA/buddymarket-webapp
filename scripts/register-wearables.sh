#!/bin/bash

################################################################################
# Script de Registro de Aplicaciones en Oura y Whoop
# 
# Este script guía el proceso de registro de BuddyOne en Oura y Whoop
# para obtener las credenciales necesarias (Client ID y Client Secret)
#
# Uso: bash scripts/register-wearables.sh
################################################################################

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.local"
CREDENTIALS_FILE="$PROJECT_ROOT/wearables-credentials.json"

################################################################################
# Funciones Auxiliares
################################################################################

print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_step() {
    echo -e "\n${YELLOW}→ $1${NC}"
}

pause_for_user() {
    echo -e "\n${YELLOW}Presiona Enter para continuar...${NC}"
    read -r
}

################################################################################
# Validaciones Iniciales
################################################################################

validate_environment() {
    print_header "Validando Entorno"
    
    # Verificar que estamos en el directorio correcto
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        print_error "No se encontró package.json. Asegúrate de ejecutar este script desde la raíz del proyecto."
        exit 1
    fi
    
    print_success "Directorio del proyecto validado"
    
    # Verificar que jq está instalado (para procesar JSON)
    if ! command -v jq &> /dev/null; then
        print_warning "jq no está instalado. Algunas funciones pueden no funcionar correctamente."
        print_info "Instala jq con: sudo apt-get install jq"
    else
        print_success "jq está instalado"
    fi
}

################################################################################
# Registro en Oura
################################################################################

register_oura() {
    print_header "Registro de Aplicación en Oura"
    
    print_info "Necesitarás crear una cuenta de desarrollador en Oura y registrar tu aplicación."
    print_info "Esto te permitirá obtener el Client ID y Client Secret necesarios."
    
    print_step "Paso 1: Acceder a Oura Developer Portal"
    echo -e "
    1. Abre tu navegador y ve a: ${BLUE}https://cloud.ouraring.com/oauth/applications${NC}
    2. Si no tienes cuenta, crea una en: ${BLUE}https://cloud.ouraring.com/auth/register${NC}
    3. Inicia sesión con tus credenciales
    "
    pause_for_user
    
    print_step "Paso 2: Crear Nueva Aplicación"
    echo -e "
    1. Haz clic en 'Create Application' o 'New Application'
    2. Completa el formulario con:
       - Nombre: BuddyOne Health Hub
       - Descripción: Integración de datos de salud con Oura Ring
       - Tipo: Web Application
    3. Haz clic en 'Create'
    "
    pause_for_user
    
    print_step "Paso 3: Configurar URIs de Redirección"
    echo -e "
    En la sección 'Redirect URIs', agrega:
    
    Para desarrollo local:
    ${BLUE}http://localhost:3000/api/health-hub/oauth/oura/callback${NC}
    
    Para producción:
    ${BLUE}https://buddyoneapp.com/api/health-hub/oauth/oura/callback${NC}
    ${BLUE}https://www.buddyoneapp.com/api/health-hub/oauth/oura/callback${NC}
    
    Haz clic en 'Add' para cada URI y luego 'Save'
    "
    pause_for_user
    
    print_step "Paso 4: Copiar Credenciales"
    echo -e "
    1. En la página de tu aplicación, busca:
       - Client ID
       - Client Secret
    2. Copia ambos valores
    "
    
    # Solicitar credenciales
    read -p "$(echo -e ${BLUE})Ingresa tu Oura Client ID: $(echo -e ${NC})" OURA_CLIENT_ID
    read -sp "$(echo -e ${BLUE})Ingresa tu Oura Client Secret: $(echo -e ${NC})" OURA_CLIENT_SECRET
    echo ""
    
    if [ -z "$OURA_CLIENT_ID" ] || [ -z "$OURA_CLIENT_SECRET" ]; then
        print_error "Credenciales de Oura incompletas"
        return 1
    fi
    
    print_success "Credenciales de Oura capturadas"
}

################################################################################
# Registro en Whoop
################################################################################

register_whoop() {
    print_header "Registro de Aplicación en Whoop"
    
    print_info "Necesitarás crear una cuenta de desarrollador en Whoop y registrar tu aplicación."
    print_info "Esto te permitirá obtener el Client ID y Client Secret necesarios."
    
    print_step "Paso 1: Acceder a Whoop Developer Dashboard"
    echo -e "
    1. Abre tu navegador y ve a: ${BLUE}https://developer.whoop.com/dashboard${NC}
    2. Si no tienes cuenta, crea una en: ${BLUE}https://developer.whoop.com/signup${NC}
    3. Inicia sesión con tus credenciales
    "
    pause_for_user
    
    print_step "Paso 2: Crear Nueva Aplicación"
    echo -e "
    1. En el Dashboard, busca 'Create Application' o 'New App'
    2. Completa el formulario con:
       - Nombre: BuddyOne Health Hub
       - Descripción: Integración de datos de salud con Whoop
       - Tipo: Web Application
    3. Haz clic en 'Create'
    "
    pause_for_user
    
    print_step "Paso 3: Configurar URIs de Redirección"
    echo -e "
    En la sección 'Redirect URIs' o 'OAuth Redirect URIs', agrega:
    
    Para desarrollo local:
    ${BLUE}http://localhost:3000/api/health-hub/oauth/whoop/callback${NC}
    
    Para producción:
    ${BLUE}https://buddyoneapp.com/api/health-hub/oauth/whoop/callback${NC}
    ${BLUE}https://www.buddyoneapp.com/api/health-hub/oauth/whoop/callback${NC}
    
    Haz clic en 'Add' para cada URI y luego 'Save'
    "
    pause_for_user
    
    print_step "Paso 4: Configurar Scopes"
    echo -e "
    Selecciona los siguientes scopes:
    - ${BLUE}read:recovery${NC} - Leer datos de recuperación
    - ${BLUE}read:cycles${NC} - Leer ciclos fisiológicos
    - ${BLUE}read:workout${NC} - Leer datos de entrenamientos
    - ${BLUE}read:sleep${NC} - Leer datos de sueño
    - ${BLUE}read:profile${NC} - Leer perfil de usuario
    - ${BLUE}read:body_measurement${NC} - Leer medidas corporales
    "
    pause_for_user
    
    print_step "Paso 5: Copiar Credenciales"
    echo -e "
    1. En la página de tu aplicación, busca:
       - Client ID
       - Client Secret
    2. Copia ambos valores
    "
    
    # Solicitar credenciales
    read -p "$(echo -e ${BLUE})Ingresa tu Whoop Client ID: $(echo -e ${NC})" WHOOP_CLIENT_ID
    read -sp "$(echo -e ${BLUE})Ingresa tu Whoop Client Secret: $(echo -e ${NC})" WHOOP_CLIENT_SECRET
    echo ""
    
    if [ -z "$WHOOP_CLIENT_ID" ] || [ -z "$WHOOP_CLIENT_SECRET" ]; then
        print_error "Credenciales de Whoop incompletas"
        return 1
    fi
    
    print_success "Credenciales de Whoop capturadas"
}

################################################################################
# Guardar Credenciales
################################################################################

save_credentials() {
    print_header "Guardando Credenciales"
    
    # Crear archivo de credenciales JSON
    cat > "$CREDENTIALS_FILE" << EOF
{
  "oura": {
    "clientId": "$OURA_CLIENT_ID",
    "clientSecret": "$OURA_CLIENT_SECRET",
    "redirectUri": "http://localhost:3000/api/health-hub/oauth/oura/callback",
    "redirectUriProduction": "https://buddyoneapp.com/api/health-hub/oauth/oura/callback",
    "registeredAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  },
  "whoop": {
    "clientId": "$WHOOP_CLIENT_ID",
    "clientSecret": "$WHOOP_CLIENT_SECRET",
    "redirectUri": "http://localhost:3000/api/health-hub/oauth/whoop/callback",
    "redirectUriProduction": "https://buddyoneapp.com/api/health-hub/oauth/whoop/callback",
    "registeredAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  }
}
EOF
    
    print_success "Credenciales guardadas en: $CREDENTIALS_FILE"
    
    # Mostrar advertencia de seguridad
    print_warning "Este archivo contiene secretos. Asegúrate de:"
    echo -e "
    1. NO compartir este archivo
    2. NO commitear a Git (ya está en .gitignore)
    3. Mantenerlo seguro y privado
    4. Usar variables de entorno en producción
    "
}

################################################################################
# Configurar Variables de Entorno
################################################################################

setup_environment_variables() {
    print_header "Configurando Variables de Entorno"
    
    print_step "Actualizando .env.local"
    
    # Crear o actualizar .env.local
    if [ -f "$ENV_FILE" ]; then
        print_info "Archivo .env.local ya existe. Actualizando..."
        
        # Usar sed para actualizar o agregar variables
        if grep -q "OURA_CLIENT_ID" "$ENV_FILE"; then
            sed -i "s/^OURA_CLIENT_ID=.*/OURA_CLIENT_ID=$OURA_CLIENT_ID/" "$ENV_FILE"
        else
            echo "OURA_CLIENT_ID=$OURA_CLIENT_ID" >> "$ENV_FILE"
        fi
        
        if grep -q "OURA_CLIENT_SECRET" "$ENV_FILE"; then
            sed -i "s/^OURA_CLIENT_SECRET=.*/OURA_CLIENT_SECRET=$OURA_CLIENT_SECRET/" "$ENV_FILE"
        else
            echo "OURA_CLIENT_SECRET=$OURA_CLIENT_SECRET" >> "$ENV_FILE"
        fi
        
        if grep -q "WHOOP_CLIENT_ID" "$ENV_FILE"; then
            sed -i "s/^WHOOP_CLIENT_ID=.*/WHOOP_CLIENT_ID=$WHOOP_CLIENT_ID/" "$ENV_FILE"
        else
            echo "WHOOP_CLIENT_ID=$WHOOP_CLIENT_ID" >> "$ENV_FILE"
        fi
        
        if grep -q "WHOOP_CLIENT_SECRET" "$ENV_FILE"; then
            sed -i "s/^WHOOP_CLIENT_SECRET=.*/WHOOP_CLIENT_SECRET=$WHOOP_CLIENT_SECRET/" "$ENV_FILE"
        else
            echo "WHOOP_CLIENT_SECRET=$WHOOP_CLIENT_SECRET" >> "$ENV_FILE"
        fi
    else
        cat > "$ENV_FILE" << EOF
# Oura Ring Configuration
OURA_CLIENT_ID=$OURA_CLIENT_ID
OURA_CLIENT_SECRET=$OURA_CLIENT_SECRET
OURA_REDIRECT_URI=http://localhost:3000/api/health-hub/oauth/oura/callback

# Whoop Configuration
WHOOP_CLIENT_ID=$WHOOP_CLIENT_ID
WHOOP_CLIENT_SECRET=$WHOOP_CLIENT_SECRET
WHOOP_REDIRECT_URI=http://localhost:3000/api/health-hub/oauth/whoop/callback

# Encryption Key (genera una con: openssl rand -base64 32)
ENCRYPTION_KEY=

# Health Hub Configuration
HEALTH_HUB_SYNC_INTERVAL=21600000
HEALTH_HUB_SYNC_ENABLED=true
EOF
    fi
    
    print_success "Variables de entorno configuradas en .env.local"
}

################################################################################
# Validar Credenciales
################################################################################

validate_credentials() {
    print_header "Validando Credenciales"
    
    print_step "Verificando formato de credenciales..."
    
    # Validar que no estén vacías
    if [ -z "$OURA_CLIENT_ID" ] || [ -z "$OURA_CLIENT_SECRET" ]; then
        print_error "Credenciales de Oura incompletas"
        return 1
    fi
    
    if [ -z "$WHOOP_CLIENT_ID" ] || [ -z "$WHOOP_CLIENT_SECRET" ]; then
        print_error "Credenciales de Whoop incompletas"
        return 1
    fi
    
    # Validar longitud mínima
    if [ ${#OURA_CLIENT_ID} -lt 10 ]; then
        print_error "Oura Client ID parece ser inválido (muy corto)"
        return 1
    fi
    
    if [ ${#WHOOP_CLIENT_ID} -lt 10 ]; then
        print_error "Whoop Client ID parece ser inválido (muy corto)"
        return 1
    fi
    
    print_success "Todas las credenciales son válidas"
    return 0
}

################################################################################
# Generar Clave de Encriptación
################################################################################

generate_encryption_key() {
    print_header "Generando Clave de Encriptación"
    
    print_info "Se necesita una clave de encriptación para almacenar tokens de forma segura."
    
    if command -v openssl &> /dev/null; then
        ENCRYPTION_KEY=$(openssl rand -base64 32)
        print_success "Clave de encriptación generada"
        
        # Actualizar .env.local
        if grep -q "ENCRYPTION_KEY=" "$ENV_FILE"; then
            sed -i "s/^ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" "$ENV_FILE"
        else
            echo "ENCRYPTION_KEY=$ENCRYPTION_KEY" >> "$ENV_FILE"
        fi
        
        print_success "Clave guardada en .env.local"
    else
        print_warning "openssl no está disponible. Genera la clave manualmente con:"
        echo -e "${BLUE}openssl rand -base64 32${NC}"
    fi
}

################################################################################
# Resumen Final
################################################################################

print_summary() {
    print_header "Resumen de Registro"
    
    echo -e "
${GREEN}✓ Registro completado exitosamente${NC}

${YELLOW}Credenciales guardadas en:${NC}
  - $CREDENTIALS_FILE
  - $ENV_FILE

${YELLOW}Próximos pasos:${NC}

1. ${BLUE}Crear tablas en la base de datos:${NC}
   pnpm db:push

2. ${BLUE}Implementar endpoints de OAuth:${NC}
   - server/routers/health-hub.ts
   - server/_core/wearables.ts

3. ${BLUE}Crear componentes frontend:${NC}
   - client/src/pages/HealthHub.tsx
   - client/src/components/WearableCard.tsx

4. ${BLUE}Probar la integración:${NC}
   pnpm dev
   # Visita http://localhost:3000/health-hub

${YELLOW}Variables de entorno configuradas:${NC}
  - OURA_CLIENT_ID
  - OURA_CLIENT_SECRET
  - WHOOP_CLIENT_ID
  - WHOOP_CLIENT_SECRET
  - ENCRYPTION_KEY
  - OURA_REDIRECT_URI
  - WHOOP_REDIRECT_URI

${YELLOW}Documentación:${NC}
  - HEALTH_HUB_INTEGRATION_PLAN.md
  - scripts/register-wearables.sh (este script)

${RED}⚠️  IMPORTANTE:${NC}
  - Nunca compartas wearables-credentials.json
  - Usa variables de entorno en producción
  - Mantén los secretos seguros
  - Revisa la documentación de seguridad en HEALTH_HUB_INTEGRATION_PLAN.md
    "
}

################################################################################
# Función Principal
################################################################################

main() {
    clear
    print_header "Registro de Aplicaciones en Oura y Whoop"
    
    print_info "Este script te guiará a través del proceso de registro de BuddyOne"
    print_info "en Oura y Whoop para obtener las credenciales necesarias."
    
    # Validar entorno
    validate_environment
    
    # Registrar en Oura
    if ! register_oura; then
        print_error "Falló el registro en Oura"
        exit 1
    fi
    
    # Registrar en Whoop
    if ! register_whoop; then
        print_error "Falló el registro en Whoop"
        exit 1
    fi
    
    # Validar credenciales
    if ! validate_credentials; then
        print_error "Validación de credenciales falló"
        exit 1
    fi
    
    # Guardar credenciales
    save_credentials
    
    # Configurar variables de entorno
    setup_environment_variables
    
    # Generar clave de encriptación
    generate_encryption_key
    
    # Mostrar resumen
    print_summary
    
    print_success "¡Registro completado!"
}

# Ejecutar función principal
main "$@"

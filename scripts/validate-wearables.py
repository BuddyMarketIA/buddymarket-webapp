#!/usr/bin/env python3

"""
Script para validar credenciales de Oura y Whoop

Este script verifica que:
1. Las variables de entorno estén configuradas
2. Las credenciales tengan el formato correcto
3. Las conexiones con las APIs sean posibles
4. Los tokens se puedan obtener correctamente

Uso: python3 scripts/validate-wearables.py
"""

import os
import sys
import json
import requests
from pathlib import Path
from datetime import datetime
from typing import Dict, Tuple, Optional

# Colores para output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text: str) -> None:
    """Imprime un encabezado formateado"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.ENDC}\n")

def print_success(text: str) -> None:
    """Imprime un mensaje de éxito"""
    print(f"{Colors.GREEN}✓ {text}{Colors.ENDC}")

def print_error(text: str) -> None:
    """Imprime un mensaje de error"""
    print(f"{Colors.RED}✗ {text}{Colors.ENDC}")

def print_warning(text: str) -> None:
    """Imprime un mensaje de advertencia"""
    print(f"{Colors.YELLOW}⚠ {text}{Colors.ENDC}")

def print_info(text: str) -> None:
    """Imprime un mensaje de información"""
    print(f"{Colors.CYAN}ℹ {text}{Colors.ENDC}")

def load_env_file(env_file: str) -> Dict[str, str]:
    """Carga variables de entorno desde un archivo .env"""
    env_vars = {}
    
    if not os.path.exists(env_file):
        print_warning(f"Archivo {env_file} no encontrado")
        return env_vars
    
    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                if '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    
    return env_vars

def validate_environment_variables() -> Tuple[bool, Dict[str, str]]:
    """Valida que las variables de entorno estén configuradas"""
    print_header("Validando Variables de Entorno")
    
    required_vars = {
        'OURA_CLIENT_ID': 'ID de cliente de Oura',
        'OURA_CLIENT_SECRET': 'Secret de cliente de Oura',
        'WHOOP_CLIENT_ID': 'ID de cliente de Whoop',
        'WHOOP_CLIENT_SECRET': 'Secret de cliente de Whoop',
    }
    
    env_vars = {}
    all_valid = True
    
    # Cargar desde .env.local si existe
    env_file = '.env.local'
    if os.path.exists(env_file):
        print_info(f"Cargando variables desde {env_file}")
        env_vars.update(load_env_file(env_file))
    
    # Cargar desde variables de entorno del sistema
    for key in required_vars:
        if key not in env_vars:
            env_vars[key] = os.getenv(key, '')
    
    # Validar cada variable
    for var_name, var_description in required_vars.items():
        value = env_vars.get(var_name, '')
        
        if not value:
            print_error(f"{var_description} ({var_name}) no está configurada")
            all_valid = False
        elif len(value) < 10:
            print_error(f"{var_description} ({var_name}) parece ser inválida (muy corta)")
            all_valid = False
        else:
            # Mostrar solo los primeros y últimos caracteres por seguridad
            masked_value = f"{value[:8]}...{value[-4:]}"
            print_success(f"{var_description} ({var_name}): {masked_value}")
    
    return all_valid, env_vars

def validate_oura_credentials(client_id: str, client_secret: str) -> bool:
    """Valida las credenciales de Oura"""
    print_header("Validando Credenciales de Oura")
    
    print_info("Intentando obtener token de acceso de Oura...")
    
    try:
        # Endpoint de token de Oura
        token_url = "https://cloud.ouraring.com/oauth/token"
        
        # Datos para solicitar token
        data = {
            'grant_type': 'client_credentials',
            'client_id': client_id,
            'client_secret': client_secret,
        }
        
        # Realizar solicitud
        response = requests.post(token_url, data=data, timeout=10)
        
        if response.status_code == 200:
            token_data = response.json()
            if 'access_token' in token_data:
                print_success("Credenciales de Oura válidas")
                print_info(f"Token obtenido: {token_data['access_token'][:20]}...")
                print_info(f"Tipo de token: {token_data.get('token_type', 'N/A')}")
                print_info(f"Expira en: {token_data.get('expires_in', 'N/A')} segundos")
                return True
            else:
                print_error("Respuesta inesperada de Oura (sin access_token)")
                return False
        elif response.status_code == 401:
            print_error("Credenciales de Oura inválidas (401 Unauthorized)")
            print_info(f"Respuesta: {response.json()}")
            return False
        elif response.status_code == 400:
            print_error("Solicitud inválida (400 Bad Request)")
            print_info(f"Respuesta: {response.json()}")
            return False
        else:
            print_error(f"Error al validar credenciales de Oura (HTTP {response.status_code})")
            print_info(f"Respuesta: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print_error("Timeout al conectar con Oura (conexión lenta)")
        return False
    except requests.exceptions.ConnectionError:
        print_error("Error de conexión con Oura (verifica tu conexión a Internet)")
        return False
    except Exception as e:
        print_error(f"Error inesperado: {str(e)}")
        return False

def validate_whoop_credentials(client_id: str, client_secret: str) -> bool:
    """Valida las credenciales de Whoop"""
    print_header("Validando Credenciales de Whoop")
    
    print_info("Intentando obtener token de acceso de Whoop...")
    
    try:
        # Endpoint de token de Whoop
        token_url = "https://api.prod.whoop.com/oauth/oauth2/token"
        
        # Datos para solicitar token
        data = {
            'grant_type': 'client_credentials',
            'client_id': client_id,
            'client_secret': client_secret,
        }
        
        # Realizar solicitud
        response = requests.post(token_url, data=data, timeout=10)
        
        if response.status_code == 200:
            token_data = response.json()
            if 'access_token' in token_data:
                print_success("Credenciales de Whoop válidas")
                print_info(f"Token obtenido: {token_data['access_token'][:20]}...")
                print_info(f"Tipo de token: {token_data.get('token_type', 'N/A')}")
                print_info(f"Expira en: {token_data.get('expires_in', 'N/A')} segundos")
                return True
            else:
                print_error("Respuesta inesperada de Whoop (sin access_token)")
                return False
        elif response.status_code == 401:
            print_error("Credenciales de Whoop inválidas (401 Unauthorized)")
            print_info(f"Respuesta: {response.json()}")
            return False
        elif response.status_code == 400:
            print_error("Solicitud inválida (400 Bad Request)")
            print_info(f"Respuesta: {response.json()}")
            return False
        else:
            print_error(f"Error al validar credenciales de Whoop (HTTP {response.status_code})")
            print_info(f"Respuesta: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print_error("Timeout al conectar con Whoop (conexión lenta)")
        return False
    except requests.exceptions.ConnectionError:
        print_error("Error de conexión con Whoop (verifica tu conexión a Internet)")
        return False
    except Exception as e:
        print_error(f"Error inesperado: {str(e)}")
        return False

def validate_api_connectivity() -> bool:
    """Valida que se pueda conectar con las APIs"""
    print_header("Validando Conectividad con APIs")
    
    apis = [
        ("Oura", "https://cloud.ouraring.com/v2/docs"),
        ("Whoop", "https://api.prod.whoop.com/"),
    ]
    
    all_valid = True
    
    for api_name, api_url in apis:
        print_info(f"Verificando conectividad con {api_name}...")
        
        try:
            response = requests.head(api_url, timeout=5)
            if response.status_code < 500:
                print_success(f"{api_name} API accesible")
            else:
                print_warning(f"{api_name} API respondió con error {response.status_code}")
        except requests.exceptions.Timeout:
            print_warning(f"{api_name} API timeout (conexión lenta)")
            all_valid = False
        except requests.exceptions.ConnectionError:
            print_error(f"{api_name} API no accesible (verifica tu conexión)")
            all_valid = False
        except Exception as e:
            print_warning(f"{api_name} API error: {str(e)}")
    
    return all_valid

def print_summary(results: Dict[str, bool]) -> None:
    """Imprime un resumen de los resultados"""
    print_header("Resumen de Validación")
    
    total_checks = len(results)
    passed_checks = sum(1 for v in results.values() if v)
    
    print(f"Checks completados: {passed_checks}/{total_checks}\n")
    
    for check_name, result in results.items():
        if result:
            print_success(check_name)
        else:
            print_error(check_name)
    
    print()
    
    if passed_checks == total_checks:
        print_success("¡Todas las validaciones pasaron!")
        print_info("Puedes proceder con la implementación de Health Hub")
        return 0
    else:
        print_error(f"Falló {total_checks - passed_checks} validación(es)")
        print_info("Por favor, revisa los errores arriba y corrígelos")
        return 1

def main() -> int:
    """Función principal"""
    print(f"\n{Colors.BOLD}{Colors.CYAN}")
    print("╔════════════════════════════════════════════════════════════════════╗")
    print("║  Validador de Credenciales - Oura y Whoop                         ║")
    print("║  Health Hub Integration - BuddyOne                                ║")
    print("╚════════════════════════════════════════════════════════════════════╝")
    print(f"{Colors.ENDC}")
    
    results = {}
    
    # Validar variables de entorno
    env_valid, env_vars = validate_environment_variables()
    results['Variables de Entorno'] = env_valid
    
    if not env_valid:
        print_error("No se pueden validar credenciales sin variables de entorno")
        return print_summary(results)
    
    # Validar conectividad con APIs
    api_valid = validate_api_connectivity()
    results['Conectividad con APIs'] = api_valid
    
    # Validar credenciales de Oura
    oura_valid = validate_oura_credentials(
        env_vars.get('OURA_CLIENT_ID', ''),
        env_vars.get('OURA_CLIENT_SECRET', '')
    )
    results['Credenciales de Oura'] = oura_valid
    
    # Validar credenciales de Whoop
    whoop_valid = validate_whoop_credentials(
        env_vars.get('WHOOP_CLIENT_ID', ''),
        env_vars.get('WHOOP_CLIENT_SECRET', '')
    )
    results['Credenciales de Whoop'] = whoop_valid
    
    # Mostrar resumen
    return print_summary(results)

if __name__ == '__main__':
    sys.exit(main())

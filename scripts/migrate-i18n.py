#!/usr/bin/env python3
"""
Script para automatizar la migración de strings hardcodeados a i18n.
Busca strings comunes y los reemplaza con llamadas a t() de i18next.
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Tuple

# Strings comunes a traducir
COMMON_STRINGS = {
    # Botones
    "Guardar": ("common.save", "Save"),
    "Cancelar": ("common.cancel", "Cancel"),
    "Eliminar": ("common.delete", "Delete"),
    "Editar": ("common.edit", "Edit"),
    "Añadir": ("common.add", "Add"),
    "Buscar": ("common.search", "Search"),
    "Enviar": ("common.send", "Send"),
    "Cargar": ("common.load", "Load"),
    "Descargar": ("common.download", "Download"),
    "Cerrar": ("common.close", "Close"),
    "Atrás": ("common.back", "Back"),
    "Siguiente": ("common.next", "Next"),
    "Anterior": ("common.previous", "Previous"),
    "Confirmar": ("common.confirm", "Confirm"),
    "Sí": ("common.yes", "Yes"),
    "No": ("common.no", "No"),
    "OK": ("common.ok", "OK"),
    "Aplicar": ("common.apply", "Apply"),
    "Limpiar": ("common.clear", "Clear"),
    "Reiniciar": ("common.reset", "Reset"),
    "Enviar": ("common.submit", "Submit"),
    
    # Estados
    "Cargando...": ("common.loading_ellipsis", "Loading..."),
    "Guardando...": ("common.saving", "Saving..."),
    "Enviando...": ("common.sending", "Sending..."),
    "Eliminando...": ("common.deleting", "Deleting..."),
    "Actualizando...": ("common.updating", "Updating..."),
    "Error": ("common.error", "Error"),
    "Éxito": ("common.success", "Success"),
    "Pendiente": ("common.pending", "Pending"),
    "Completado": ("common.completed", "Completed"),
    "Cancelado": ("common.cancelled", "Cancelled"),
    "Activo": ("common.active", "Active"),
    "Inactivo": ("common.inactive", "Inactive"),
    
    # Mensajes
    "No hay datos": ("common.noData", "No data"),
    "No hay resultados": ("common.noResults", "No results"),
    "Algo salió mal": ("common.somethingWentWrong", "Something went wrong"),
    "¿Estás seguro?": ("common.areYouSure", "Are you sure?"),
    "¿Estás seguro de que deseas eliminar esto?": ("common.confirmDelete", "Are you sure you want to delete this?"),
}

class I18nMigrator:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.locales_dir = self.project_root / "client/src/i18n/locales"
        self.pages_dir = self.project_root / "client/src/pages"
        self.components_dir = self.project_root / "client/src/components"
        
    def load_translations(self) -> Dict[str, Dict]:
        """Carga todos los archivos de traducción."""
        translations = {}
        for lang_file in self.locales_dir.glob("*.json"):
            lang = lang_file.stem
            with open(lang_file, 'r', encoding='utf-8') as f:
                translations[lang] = json.load(f)
        return translations
    
    def find_hardcoded_strings(self, file_path: Path) -> List[str]:
        """Encuentra strings hardcodeados en un archivo."""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        found_strings = []
        for string_es, (key, string_en) in COMMON_STRINGS.items():
            # Buscar strings entre comillas
            patterns = [
                f'"{string_es}"',
                f"'{string_es}'",
                f'`{string_es}`',
            ]
            for pattern in patterns:
                if pattern in content:
                    found_strings.append((string_es, key, string_en))
        
        return found_strings
    
    def has_i18n_import(self, content: str) -> bool:
        """Verifica si el archivo ya tiene import de useTranslation."""
        return "useTranslation" in content or "import.*i18n" in content
    
    def add_i18n_import(self, content: str) -> str:
        """Agrega import de useTranslation si no existe."""
        if self.has_i18n_import(content):
            return content
        
        # Buscar la línea de imports de React
        react_import_match = re.search(r"import\s+.*\s+from\s+['\"]react['\"]", content)
        if react_import_match:
            insert_pos = react_import_match.end()
            import_line = "\nimport { useTranslation } from 'react-i18next';"
            return content[:insert_pos] + import_line + content[insert_pos:]
        
        return content
    
    def add_i18n_hook(self, content: str) -> str:
        """Agrega el hook useTranslation en la función del componente."""
        # Buscar la función del componente
        func_match = re.search(r"(export\s+(?:default\s+)?function\s+\w+\s*\([^)]*\)\s*\{)", content)
        if func_match:
            insert_pos = func_match.end()
            hook_line = "\n  const { t } = useTranslation();"
            return content[:insert_pos] + hook_line + content[insert_pos:]
        
        return content
    
    def replace_strings(self, content: str, strings: List[Tuple]) -> str:
        """Reemplaza strings hardcodeados con llamadas a t()."""
        for string_es, key, _ in strings:
            # Reemplazar diferentes formatos de strings
            patterns = [
                (f'"{string_es}"', f't("{key}")'),
                (f"'{string_es}'", f"t('{key}')"),
                (f'`{string_es}`', f't("{key}")'),
            ]
            
            for pattern, replacement in patterns:
                content = content.replace(pattern, replacement)
        
        return content
    
    def update_translation_files(self, strings: List[Tuple]):
        """Actualiza los archivos de traducción con las nuevas claves."""
        translations = self.load_translations()
        
        for string_es, key, string_en in strings:
            # Asegurar que la clave existe en todos los idiomas
            keys = key.split('.')
            
            for lang, trans_dict in translations.items():
                # Navegar por la estructura anidada
                current = trans_dict
                for k in keys[:-1]:
                    if k not in current:
                        current[k] = {}
                    current = current[k]
                
                # Establecer el valor
                if keys[-1] not in current:
                    if lang == 'es':
                        current[keys[-1]] = string_es
                    elif lang == 'en':
                        current[keys[-1]] = string_en
                    else:
                        # Para otros idiomas, usar el valor en inglés como fallback
                        current[keys[-1]] = string_en
        
        # Guardar los archivos actualizados
        for lang, trans_dict in translations.items():
            output_file = self.locales_dir / f"{lang}.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(trans_dict, f, ensure_ascii=False, indent=2)
            print(f"✅ Actualizado: {output_file}")
    
    def migrate_file(self, file_path: Path) -> bool:
        """Migra un archivo individual a i18n."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Encontrar strings hardcodeados
            found_strings = self.find_hardcoded_strings(file_path)
            if not found_strings:
                return False
            
            # Agregar imports y hooks
            content = self.add_i18n_import(content)
            if not self.has_i18n_import(content):
                content = self.add_i18n_hook(content)
            
            # Reemplazar strings
            content = self.replace_strings(content, found_strings)
            
            # Guardar el archivo actualizado
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            # Actualizar archivos de traducción
            self.update_translation_files(found_strings)
            
            print(f"✅ Migrado: {file_path.name}")
            for string_es, key, _ in found_strings:
                print(f"   - '{string_es}' → t('{key}')")
            
            return True
        
        except Exception as e:
            print(f"❌ Error en {file_path.name}: {e}")
            return False
    
    def migrate_all(self):
        """Migra todos los archivos de páginas y componentes."""
        print("🚀 Iniciando migración a i18n...\n")
        
        migrated = 0
        skipped = 0
        
        # Migrar páginas
        print("📄 Migrando páginas...")
        for page_file in sorted(self.pages_dir.glob("*.tsx")):
            if self.migrate_file(page_file):
                migrated += 1
            else:
                skipped += 1
        
        print(f"\n📦 Migrando componentes...")
        for component_file in sorted(self.components_dir.glob("*.tsx")):
            if self.migrate_file(component_file):
                migrated += 1
            else:
                skipped += 1
        
        print(f"\n✨ Migración completada!")
        print(f"   Archivos migrados: {migrated}")
        print(f"   Archivos sin cambios: {skipped}")

if __name__ == "__main__":
    project_root = "/home/ubuntu/buddymarket-webapp"
    migrator = I18nMigrator(project_root)
    migrator.migrate_all()

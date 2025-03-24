import subprocess
import json
import os

DEFAULT_LANG_FILE = "lang/en.json"
LOCALES_TO_TRANSLATE = ["en", "fi", "es"]

def run_command(command):
    """Run a shell command and print its output."""
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print(result.stderr)

def extract_translations():
    """Extract translation keys from source files."""
    command = (
        f"npm run extract -- 'src/**/*.ts*' --ignore '**/*.d.ts' "
        f"--id-interpolation-pattern '[sha512:contenthash:base64:6]' --out-file {DEFAULT_LANG_FILE}"
    )
    run_command(command)

def add_missing_default_messages(locale):
    """Ensure locale file exists and merge missing translations."""
    local_lang_file = f"lang/{locale}.json"
    
    if not os.path.exists(local_lang_file):
        print(f"{local_lang_file} does not exist. Creating a new file with default content.")
        with open(local_lang_file, "w", encoding="utf-8") as f:
            json.dump({}, f, ensure_ascii=False)
    
    print(f"Merging missing translations into {local_lang_file}")
    with open(DEFAULT_LANG_FILE, "r", encoding="utf-8") as default_file, open(local_lang_file, "r", encoding="utf-8") as local_file:
        default_translations = json.load(default_file)
        local_translations = json.load(local_file)
        
        # Merge missing keys from the default language
        merged_translations = {**default_translations, **local_translations}
    
    with open(local_lang_file, "w", encoding="utf-8") as f:
        json.dump(merged_translations, f, indent=2, ensure_ascii=False)

def compile_translations():
    """Compile translation files."""
    for locale in LOCALES_TO_TRANSLATE:
        formatjs_output = f"src/compiled-lang/{locale}.json"
        command = f"npm run compile -- lang/{locale}.json --ast --out-file={formatjs_output}"
        run_command(command)
        print(f"Compiled lang/{locale}.json into {formatjs_output}")

def main():
    print("Extracting translations...")
    extract_translations()
    
    for locale in LOCALES_TO_TRANSLATE:
        add_missing_default_messages(locale)
    
    print("Compiling translations...")
    compile_translations()
    print("Translation merge and compilation completed.")

if __name__ == "__main__":
    main()
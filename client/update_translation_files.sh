#!/bin/bash
DEFAULT_LANG_FILE="lang/en.json"
LOCALES_TO_TRANSLATE=("en" "fi")

npm run extract -- "src/**/*.ts*" --ignore "**/*.d.ts" --id-interpolation-pattern "[sha512:contenthash:base64:6]" --out-file $DEFAULT_LANG_FILE

add_missing_default_messages() {
    LOCAL_LANG_FILE="lang/$1.json"
    
    if [ ! -f "$LOCAL_LANG_FILE" ]; then
        echo "$LOCAL_LANG_FILE does not exist. Creating a new file with default content."
        echo '{}' > "$LOCAL_LANG_FILE"
    fi

    echo "Merging missing translations into $LOCAL_LANG_FILE"
    # Merge the translations
    jq -s '.[0] * .[1]' "$DEFAULT_LANG_FILE" "$LOCAL_LANG_FILE" > "$LOCAL_LANG_FILE.tmp" && mv "$LOCAL_LANG_FILE.tmp" "$LOCAL_LANG_FILE"
}

for LOCALE in "${LOCALES_TO_TRANSLATE[@]}"
do
    add_missing_default_messages "$LOCALE"
done

echo "Compiling translations..."


for LOCALE in "${LOCALES_TO_TRANSLATE[@]}"
do
    FORMATJS_OUTPUT="src/compiled-lang/$LOCALE.json"
    npm run compile -- "lang/$LOCALE.json" --ast --out-file="$FORMATJS_OUTPUT"
    echo "Compiled lang/$LOCALE.json into $FORMATJS_OUTPUT"
done

echo "Translation merge and compilation completed."

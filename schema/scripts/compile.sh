#!/bin/bash

echo -e "\033[0;35mTranspiling JSON-Schema to TypeScript Typings\033[0m";
rm -f src/types/schema-generated/*
[ ! -d src/types/schema-generated ]; mkdir src/types; mkdir src/types/schema-generated

./node_modules/.bin/json2ts \
    --cwd schema/ schema/exports.json  \
    --declareExternallyReferenced=true \
    --unreachableDefinitions=true > src/types/schema-generated/index.ts
    # --no-enableConstEnums \

echo -e "\033[0;92mTypings generated!!\033[0m";
echo -e "  │\n     └───  \033[0;92msrc/types/schema-generated/index.ts \033[0m";
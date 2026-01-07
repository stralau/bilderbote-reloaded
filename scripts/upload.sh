#!/usr/bin/env bash

set -euo pipefail

if [ index.ts -nt index.zip ]; then
  npm run build
  zip remote/index.zip -j dist/index.js
fi

if ! aws sts get-caller-identity &>/dev/null; then
  aws login
fi

aws lambda update-function-code \
  --function-name post-images-reloaded \
  --zip-file fileb://remote/index.zip

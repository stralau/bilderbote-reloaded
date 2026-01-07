#!/usr/bin/env bash

set -euo pipefail

npm run build
zip -r remote/lambda.zip dist


if ! aws sts get-caller-identity &>/dev/null; then
  aws login
fi

aws lambda update-function-code \
  --function-name post-images-reloaded \
  --zip-file fileb://remote/lambda.zip

#!/usr/bin/env bash

set -euo pipefail

if ! aws sts get-caller-identity &>/dev/null; then
  aws login
fi

rm -rf remote/lambda.zip

npm install && npm run build
zip -r remote/lambda.zip dist node_modules package.json package-lock.json

aws s3 cp remote/lambda.zip s3://lambda-post-images-artifacts/post-images-reloaded/lambda.zip

aws lambda update-function-code \
  --function-name post-images-reloaded \
  --s3-bucket lambda-post-images-artifacts \
  --s3-key post-images-reloaded/lambda.zip | jq '.'

aws s3 rm s3://lambda-post-images-artifacts/post-images-reloaded/lambda.zip

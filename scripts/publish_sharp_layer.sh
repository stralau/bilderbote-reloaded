#!/usr/bin/env bash

set -euo pipefail

layer_version_arn=$(aws lambda publish-layer-version \
  --layer-name sharp-layer \
  --zip-file fileb://sharp-x64.zip \
  --compatible-runtimes nodejs20.x \
  --region eu-central-1 |  jq -r '.LayerVersionArn')

aws lambda update-function-configuration \
  --function-name post-images-reloaded \
  --layers "$layer_version_arn" \
  --region eu-central-1 | jq '.'

  aws lambda update-function-configuration \
  --function-name repost-images-reloaded \
  --layers "$layer_version_arn" \
  --region eu-central-1 | jq '.'
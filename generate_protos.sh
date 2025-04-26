#!/bin/bash

PROTO_DIR=spotify-backend-service

echo "🔄 Regenerating gRPC Python code from $PROTO_FILE..."

python -m grpc_tools.protoc \
  -I$PROTO_DIR \
  --python_out=$PROTO_DIR \
  --grpc_python_out=$PROTO_DIR \
  $PROTO_DIR/protos/spotify.proto


if [ $? -eq 0 ]; then
  echo "✅ Proto generation complete."
else
  echo "❌ Failed to generate proto files."
fi

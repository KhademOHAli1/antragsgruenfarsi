#!/bin/bash

# Build script for Go WebAssembly diff module
set -e

echo "Building Go WebAssembly diff module..."

# Set up Go environment for WebAssembly
export GOOS=js
export GOARCH=wasm

# Build the WebAssembly module
go build -o diff.wasm main.go

# Copy the Go runtime JavaScript support file
cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" ./

echo "Build complete!"
echo "Files created:"
echo "  - diff.wasm (WebAssembly module)"
echo "  - wasm_exec.js (Go runtime support)"
echo ""
echo "To use in your web application:"
echo "1. Import wasm_exec.js in your HTML"
echo "2. Load diff.wasm"
echo "3. Call goDiffChar(), goDiffLine(), etc."

#!/bin/bash
# Build script for Render deployment
# Forces use of pre-built wheels to avoid Rust compilation

pip install --upgrade pip
pip install --only-binary :all: -r requirements.txt || pip install -r requirements.txt


#!/bin/bash
echo "Building the project..."
python -m pip install --upgrade pip
pip install -r requirements.txt

echo "Make migrations..."
flask db upgrade

echo "Build completed."
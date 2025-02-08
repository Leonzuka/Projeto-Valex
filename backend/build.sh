#!/bin/bash
# Atualizar pip
python -m pip install --upgrade pip

# Instalar dependências
pip install -r requirements.txt

# Criar diretório para migrations se não existir
mkdir -p migrations

# Inicializar migrations
export FLASK_APP=run.py
flask db init || true
flask db migrate
flask db upgrade

echo "Build completed."
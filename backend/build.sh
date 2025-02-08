# build.sh
#!/bin/bash
# Atualizar pip
python -m pip install --upgrade pip

# Instalar dependências
pip install -r requirements.txt

# Inicializar migrations
export FLASK_APP=app.py
flask db init || true
flask db migrate
flask db upgrade

echo "Build completed."
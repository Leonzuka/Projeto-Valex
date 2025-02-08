# build.sh
#!/bin/bash
# Atualizar pip
python -m pip install --upgrade pip

# Instalar dependências
pip install -r requirements.txt

# Remover pasta de migrations se existir
rm -rf migrations/

# Reinicializar migrations do zero
export FLASK_APP=app:create_app
flask db init
flask db migrate -m "initial migration"
flask db upgrade

echo "Build completed."
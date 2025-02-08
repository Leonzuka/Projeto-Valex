@echo off
REM Atualizar pip
python -m pip install --upgrade pip

REM Instalar dependências
pip install -r requirements.txt

REM Limpar diretório de migrações se existir
if exist migrations rmdir /s /q migrations

REM Criar diretório para migrations
mkdir migrations

REM Inicializar migrations do zero
set FLASK_APP=app:create_app
flask db init
flask db migrate -m "initial migration"
flask db upgrade

echo "Build completed."
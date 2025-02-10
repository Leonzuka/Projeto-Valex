# Use uma imagem base do Python
FROM python:3.9-slim

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos do backend
COPY backend/ .

# Instala as dependências
RUN pip install --no-cache-dir -r requirements.txt

# Expõe a porta que a aplicação vai usar
EXPOSE 8000

# Comando para iniciar a aplicação
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:create_app()"]
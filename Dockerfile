# Use uma imagem base do Python
FROM python:3.9-slim

# Define o diretório de trabalho
WORKDIR /app

# Instala as dependências do sistema necessárias
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copia os arquivos do backend
COPY backend/ .

# Instala as dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Expõe a porta padrão
EXPOSE 8000

# Comando para iniciar a aplicação
CMD ["python3", "start.py"]
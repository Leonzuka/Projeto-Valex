# Imagem base
FROM python:3.9-slim

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos necessários
COPY requirements.txt requirements.txt
COPY . .

# Instalar dependências
RUN pip install -r requirements.txt

# Expor porta
EXPOSE 8000

# Comando para iniciar a aplicação
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "run:app"]
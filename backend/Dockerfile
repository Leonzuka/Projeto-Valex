FROM python:3.9-slim

# Instalar dependências do sistema (pkg-config, gcc, e as bibliotecas necessárias para MySQL/MariaDB)
RUN apt-get update && apt-get install -y \
    pkg-config \
    gcc \
    libmariadb-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt . 
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "start.py"]

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

# Instala dependências do sistema necessárias para compilação (se houver libs C)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Cache de dependências do Python
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código da aplicação
COPY . /app/

# Expõe a porta padrão
EXPOSE ${PORT}

# Comando de inicialização:
# Se for FastAPI/Uvicorn (ajuste 'main:app' se seu entrypoint for outro):
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}

# Se for Django/Gunicorn, substitua a linha CMD acima por:
# CMD gunicorn config.wsgi:application --bind 0.0.0.0:${PORT}

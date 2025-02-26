# middleware.py
from flask import request  # Adicione esta linha no topo do arquivo
import os

# Vamos atualizar esta função
def setup_cors_middleware(app):
    @app.after_request
    def after_request(response):
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        # Permitir múltiplas origens
        allowed_origins = [
            frontend_url, 
            "http://localhost:3000", 
            "https://frontend-production-dde7.up.railway.app"
        ]
        
        # Obter a origem da requisição
        request_origin = request.headers.get('Origin')
        
        # Se a origem estiver na lista de permitidas, adicionar ao cabeçalho
        if request_origin in allowed_origins:
            response.headers['Access-Control-Allow-Origin'] = request_origin
        else:
            # Caso contrário, usar a URL do frontend como padrão
            response.headers['Access-Control-Allow-Origin'] = frontend_url
            
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Max-Age'] = '3600'
        
        # Permitir cookies
        if request.method == 'OPTIONS':
            response.status_code = 204
            return response
            
        return response
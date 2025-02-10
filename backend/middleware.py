def setup_cors_middleware(app):
    @app.after_request
    def after_request(response):
        # Remover headers existentes para evitar duplicação
        if 'Access-Control-Allow-Origin' in response.headers:
            del response.headers['Access-Control-Allow-Origin']
            
        # Ajustando os headers CORS
        response.headers['Access-Control-Allow-Origin'] = 'https://frontend-production-dde7.up.railway.app'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Credentials'] = 'true'  # Importante!
        response.headers['Access-Control-Max-Age'] = '3600'
        
        # Permitir cookies
        if request.method == 'OPTIONS':
            response.headers['Access-Control-Max-Age'] = '3600'
            response.status_code = 204
            return response
            
        return response
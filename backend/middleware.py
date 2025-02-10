def setup_cors_middleware(app):
    @app.after_request
    def after_request(response):
        # Remover headers existentes para evitar duplicação
        if 'Access-Control-Allow-Origin' in response.headers:
            del response.headers['Access-Control-Allow-Origin']
            
        response.headers['Access-Control-Allow-Origin'] = 'https://frontend-production-dde7.up.railway.app'
        response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
        return response
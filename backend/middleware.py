# middleware.py
def setup_cors_middleware(app):
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', 'https://frontend-production-dde7.up.railway.app')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
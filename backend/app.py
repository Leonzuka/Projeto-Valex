from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from models.models import db
from routes.routes import api
from dotenv import load_dotenv
from middleware import setup_cors_middleware
import os
import logging

def create_app():
    app = Flask(__name__)
    
    # Configurar logging
    logging.basicConfig(level=logging.DEBUG)
    
    # Carregar variáveis de ambiente
    load_dotenv()
    
    # Log das variáveis importantes
    app.logger.debug(f"DATABASE_URL: {os.getenv('DATABASE_URL')}")
    app.logger.debug(f"FRONTEND_URL: {os.getenv('FRONTEND_URL')}")
    
    # Configuração CORS atualizada
    CORS(app, 
         resources={r"/api/*": {
             "origins": ["https://frontend-production-dde7.up.railway.app"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True
         }})

    # Configuração do banco de dados
    try:
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        db.init_app(app)
        app.logger.info("Banco de dados configurado com sucesso")
    except Exception as e:
        app.logger.error(f"Erro ao configurar banco de dados: {str(e)}")
        
    setup_cors_middleware(app)
    
    # Registrar blueprint para API
    app.register_blueprint(api, url_prefix='/api')
    
    @app.route('/')
    def home():
        return jsonify({"message": "API está funcionando"}), 200
        
    @app.errorhandler(500)
    def handle_500(error):
        app.logger.error(f"Erro 500: {str(error)}")
        return jsonify({"error": "Erro interno do servidor", "details": str(error)}), 500
        
    return app
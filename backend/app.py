# app.py
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from models.models import db
from routes.routes import api
from dotenv import load_dotenv
from middleware import setup_cors_middleware
import os

def create_app():
    app = Flask(__name__)
    
    # Atualize a configuração CORS
    CORS(app, 
         resources={r"/api/*": {
             "origins": ["https://frontend-production-dde7.up.railway.app"],
             "supports_credentials": True,
             "allow_headers": ["Content-Type", "Authorization"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
         }})
     
    # Carregar variáveis de ambiente
    load_dotenv()
    
    # Configuração do banco de dados
    DATABASE_URL = os.getenv('DATABASE_URL')
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL não está configurada")
    
    # Garantir que a URL do banco de dados esteja completa
    if 'railway' in DATABASE_URL and '@' in DATABASE_URL and ':' in DATABASE_URL.split('@')[1]:
        host = DATABASE_URL.split('@')[1].split(':')[0]
        if not host:
            DATABASE_URL = DATABASE_URL.replace('@:', '@monorail.proxy.rlwy.net:')
    
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    setup_cors_middleware(app)
    
    # Inicializar extensões
    db.init_app(app)
    
    # Registrar blueprint para API
    app.register_blueprint(api, url_prefix='/api')
    @app.route('/')
    def home():
        return jsonify({"message": "API está funcionando"}), 200
    
    return app
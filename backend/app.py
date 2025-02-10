# app.py
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from models.models import db
from routes.routes import api
from dotenv import load_dotenv
import os

def create_app():
    app = Flask(__name__)
    CORS(app, origins=['https://frontend-production-dde7.up.railway.app', 'http://localhost:3000'], 
     methods=['GET', 'POST', 'PUT', 'DELETE'],
     allow_headers=['Content-Type'],
     supports_credentials=True)
     
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
    
    # Inicializar extensões
    db.init_app(app)
    
    # Registrar blueprint para API
    app.register_blueprint(api, url_prefix='/api')
    @app.route('/')
    def home():
        return jsonify({"message": "API está funcionando"}), 200
    
    return app
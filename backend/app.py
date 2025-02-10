# app.py
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from models.models import db
from routes.routes import api
from dotenv import load_dotenv
import os

def create_app():
    # Definindo o caminho absoluto para a pasta build
    static_folder = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend', 'build')
    
    app = Flask(__name__, static_folder=static_folder, static_url_path='')
    CORS(app)
     
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
    
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, 'index.html')
    
    return app
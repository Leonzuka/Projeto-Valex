from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from models.models import db  # Mudando a importação
from routes.routes import api  # Mudando a importação
from dotenv import load_dotenv
import os

def create_app():
    app = Flask(__name__)
    CORS(app)
     
    # Carregar variáveis de ambiente
    load_dotenv()
    
    # Configuração do banco de dados
    DATABASE_URL = os.getenv('DATABASE_URL')
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL não está configurada")
        
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    if app.config['SQLALCHEMY_DATABASE_URI'].startswith('postgres://'):
        app.config['SQLALCHEMY_DATABASE_URI'] = app.config['SQLALCHEMY_DATABASE_URI'].replace('postgres://', 'postgresql://')
    
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Inicializar extensões
    db.init_app(app)
    migrate = Migrate(app, db)
    
    # Registrar blueprint
    app.register_blueprint(api, url_prefix='/api')
    
    return app
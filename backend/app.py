# app.py
from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from models.models import db
from routes.routes import api
from dotenv import load_dotenv
import os

def create_app():
    app = Flask(__name__)
    CORS(app)
     
    # Carregar variáveis de ambiente
    load_dotenv()
    
    # Configuração do banco de dados
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL não está configurada nas variáveis de ambiente")
        
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://')
    
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Inicializar extensões
    db.init_app(app)
    migrate = Migrate(app, db)
    
    # Registrar blueprint
    app.register_blueprint(api, url_prefix='/api')
    
    return app
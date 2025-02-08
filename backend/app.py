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
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    if app.config['SQLALCHEMY_DATABASE_URI'] and app.config['SQLALCHEMY_DATABASE_URI'].startswith('postgres://'):
        app.config['SQLALCHEMY_DATABASE_URI'] = app.config['SQLALCHEMY_DATABASE_URI'].replace('postgres://', 'postgresql://')
    
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Inicializar extensões
    db.init_app(app)
    migrate = Migrate(app, db)
    
    # Registrar blueprint
    app.register_blueprint(api, url_prefix='/api')
    
    return app
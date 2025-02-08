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
    if DATABASE_URL:
        # Garantir que a URL comece com postgresql://
        if DATABASE_URL.startswith('postgres://'):
            DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://')
        app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    else:
        # URL de fallback usando as credenciais do seu banco
        app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://valex_3u5h_user:sua_senha@dpg-cujrttlds78s739it6a0-a:5432/valex_3u5h'
        
    # Inicializar extensões
    db.init_app(app)
    migrate = Migrate(app, db)
    
    # Registrar blueprint
    app.register_blueprint(api, url_prefix='/api')
    
    return app
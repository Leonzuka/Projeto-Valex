import os
from flask import Flask
from flask_cors import CORS
from .models.models import db
from .routes.routes import api
from dotenv import load_dotenv

# Carregar variáveis de ambiente apropriadas
if os.getenv('FLASK_ENV') == 'production':
    load_dotenv('.env.production')
else:
    load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app)
     
    # Configuração do banco de dados
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    if app.config['SQLALCHEMY_DATABASE_URI'].startswith('postgres://'):
        app.config['SQLALCHEMY_DATABASE_URI'] = app.config['SQLALCHEMY_DATABASE_URI'].replace('postgres://', 'postgresql://')
    
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    app.register_blueprint(api, url_prefix='/api')
    
    return app
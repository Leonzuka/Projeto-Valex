import pymysql
pymysql.install_as_MySQLdb()

from flask import Flask
from flask_cors import CORS
from .models.models import db
from .routes.routes import api  # Importar o blueprint
from dotenv import load_dotenv
import os

load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})
     
    # Configuração do banco de dados
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Inicializar o banco de dados
    db.init_app(app)
    
    # Registrar o blueprint
    app.register_blueprint(api, url_prefix='/api')
    
    return app
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Produtor(db.Model):
    __tablename__ = 'produtor'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome = db.Column(db.String(100), nullable=False)
    ggn = db.Column(db.String(13), unique=True)
    sigla = db.Column(db.String(5), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    fazendas = db.relationship('Fazenda', backref='produtor', lazy=True)

class Variedade(db.Model):
    __tablename__ = 'variedade'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome = db.Column(db.String(50), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    fazendas = db.relationship('Fazenda', backref='variedade', lazy=True)

class Fazenda(db.Model):
    __tablename__ = 'fazenda'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome = db.Column(db.String(100), nullable=False)
    area_parcela = db.Column(db.String(20), nullable=False)
    produtor_id = db.Column(db.Integer, db.ForeignKey('produtor.id'), nullable=False)
    variedade_id = db.Column(db.Integer, db.ForeignKey('variedade.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Atividade(db.Model):
    __tablename__ = 'atividade'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    produtor_id = db.Column(db.Integer, db.ForeignKey('produtor.id'), nullable=False)
    fazenda_id = db.Column(db.Integer, db.ForeignKey('fazenda.id'), nullable=False)
    variedade_id = db.Column(db.Integer, db.ForeignKey('variedade.id'), nullable=False)
    tipo_atividade = db.Column(db.String(20), nullable=False)
    quantidade_pallets = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
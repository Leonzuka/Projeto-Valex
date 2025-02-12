from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Produtor(db.Model):
    __tablename__ = 'produtor'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome = db.Column(db.String(100), nullable=False)
    ggn = db.Column(db.String(13), unique=True)
    sigla = db.Column(db.String(5), nullable=False)
    telefone = db.Column(db.String(20))  # Novo campo
    endereco = db.Column(db.String(255)) # Novo campo
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
    area_total = db.Column(db.Float)     # Novo campo
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
    classificacao_id = db.Column(db.Integer, db.ForeignKey('classificacao_uva.id'), nullable=True)
    tipo_atividade = db.Column(db.String(20), nullable=False)
    quantidade_pallets = db.Column(db.Integer, nullable=False)
    caixas = db.Column(db.Integer, nullable=True)  # Nova coluna
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    classificacao = db.relationship('ClassificacaoUva', backref='atividades', lazy=True)

class ClassificacaoUva(db.Model):
    __tablename__ = 'classificacao_uva'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    classificacao = db.Column(db.String(50), nullable=False)
    caixa = db.Column(db.String(50), nullable=False)
    cinta = db.Column(db.String(50))
    peso = db.Column(db.String(10), nullable=False)
    cumbuca = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
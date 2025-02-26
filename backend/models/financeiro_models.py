from datetime import datetime
from models.models import db
from sqlalchemy import DECIMAL, Date, Text, Enum, Boolean

class PlanoContas(db.Model):
    __tablename__ = 'plano_contas'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    sequencial = db.Column(db.String(20))  # Adicionando campo sequencial
    codigo = db.Column(db.String(20), nullable=False)
    codigo_reduzido = db.Column(db.String(20))  # Aumentando tamanho
    descricao = db.Column(db.String(200), nullable=False)
    nivel = db.Column(db.Integer)
    conta_pai_id = db.Column(db.Integer, db.ForeignKey('plano_contas.id'), nullable=True)
    tipo_conta = db.Column(Enum('ATIVO', 'PASSIVO', 'RECEITA', 'DESPESA', 'PATRIMONIO_LIQUIDO'))
    natureza_saldo = db.Column(Enum('DEVEDOR', 'CREDOR'))
    permite_lancamento = db.Column(Boolean, default=True)
    tipo = db.Column(db.String(5))  # Campo para o tipo (S ou A)
    referencia = db.Column(db.String(50))  # Campo para referência
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamento próprio para hierarquia
    conta_pai = db.relationship('PlanoContas', remote_side=[id], backref='contas_filhas')
    
    # Adicionando índice para o código para melhorar performance
    __table_args__ = (
        db.Index('idx_plano_contas_codigo', 'codigo'),
    )
    
class BalanceteItem(db.Model):
    __tablename__ = 'balancete_items'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    conta = db.Column(db.String(20), nullable=True)
    reducao = db.Column(db.Integer, nullable=True)
    tipo = db.Column(db.String(1), nullable=True)  # Mantendo como 1 caractere
    descricao = db.Column(db.String(255), nullable=True)
    valor_anterior = db.Column(DECIMAL(15,2), nullable=True)
    valor_periodo_debito = db.Column(DECIMAL(15,2), nullable=True)
    valor_periodo_credito = db.Column(DECIMAL(15,2), nullable=True)
    valor_atual = db.Column(DECIMAL(15,2), nullable=True)
    competencia = db.Column(db.String(7), default='2024-12')  # Adicionando campo competencia
    data_importacao = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        db.Index('idx_balancete_conta', 'conta'),
        db.Index('idx_balancete_data_importacao', 'data_importacao'),
    )
    
class PeriodoContabil(db.Model):
    __tablename__ = 'periodos_contabeis'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    ano = db.Column(db.Integer, nullable=False)
    mes = db.Column(db.Integer, nullable=False)
    status = db.Column(Enum('ABERTO', 'FECHADO', 'EM_PROCESSAMENTO'), default='ABERTO')
    data_abertura = db.Column(db.DateTime)
    data_fechamento = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AnaliseFinanceira(db.Model):
    __tablename__ = 'analises_financeiras'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    periodo_id = db.Column(db.Integer, db.ForeignKey('periodos_contabeis.id'), nullable=False)
    tipo_analise = db.Column(Enum('VERTICAL', 'HORIZONTAL'))
    tipo_demonstrativo = db.Column(Enum('BP', 'DRE', 'DFC', 'DMPL'))
    conta_id = db.Column(db.Integer, db.ForeignKey('plano_contas.id'), nullable=False)
    valor_base = db.Column(DECIMAL(15,2))
    valor_calculado = db.Column(DECIMAL(15,2))
    percentual = db.Column(DECIMAL(8,4))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    periodo = db.relationship('PeriodoContabil')

class LancamentoContabil(db.Model):
    __tablename__ = 'lancamentos_contabeis'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    periodo_id = db.Column(db.Integer, db.ForeignKey('periodos_contabeis.id'), nullable=False)
    data_lancamento = db.Column(Date, nullable=False)
    numero_lancamento = db.Column(db.String(20), nullable=False)
    tipo_lancamento = db.Column(Enum('NORMAL', 'ESTORNO', 'ABERTURA', 'FECHAMENTO'))
    conta_debito_id = db.Column(db.Integer, db.ForeignKey('plano_contas.id'), nullable=False)
    conta_credito_id = db.Column(db.Integer, db.ForeignKey('plano_contas.id'), nullable=False)
    valor = db.Column(DECIMAL(15,2), nullable=False)
    historico = db.Column(Text)
    documento_tipo = db.Column(db.String(50))
    documento_numero = db.Column(db.String(50))
    usuario_id = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class FluxoCaixa(db.Model):
    __tablename__ = 'fluxo_caixa'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    periodo_id = db.Column(db.Integer, db.ForeignKey('periodos_contabeis.id'), nullable=False)
    data_movimento = db.Column(Date, nullable=False)
    tipo_movimento = db.Column(Enum('OPERACIONAL', 'INVESTIMENTO', 'FINANCIAMENTO'))
    descricao = db.Column(db.String(200))
    valor = db.Column(DECIMAL(15,2))
    natureza = db.Column(Enum('ENTRADA', 'SAIDA'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class FundoEspecial(db.Model):
    __tablename__ = 'fundos_especiais'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    tipo_fundo = db.Column(Enum('FATES', 'INVESTIMENTO'))
    periodo_id = db.Column(db.Integer, db.ForeignKey('periodos_contabeis.id'), nullable=False)
    data_movimento = db.Column(Date, nullable=False)
    lancamento_id = db.Column(db.Integer, db.ForeignKey('lancamentos_contabeis.id'))
    valor_movimento = db.Column(DECIMAL(15,2))
    tipo_movimento = db.Column(Enum('ENTRADA', 'SAIDA'))
    descricao = db.Column(Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class IndicadorFinanceiro(db.Model):
    __tablename__ = 'indicadores_financeiros'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    periodo_id = db.Column(db.Integer, db.ForeignKey('periodos_contabeis.id'), nullable=False)
    tipo_indicador = db.Column(db.String(50), nullable=False)
    nome_indicador = db.Column(db.String(100), nullable=False)
    valor = db.Column(DECIMAL(15,4))
    formula = db.Column(Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
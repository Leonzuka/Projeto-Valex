from flask import Blueprint, request, jsonify
from models.financeiro_models import db, BalanceteItem, PeriodoContabil, AnaliseFinanceira, LancamentoContabil, FluxoCaixa, FundoEspecial, IndicadorFinanceiro, PlanoContas
import pandas as pd
from datetime import datetime
from decimal import Decimal
import numpy as np
from models.models import db
from sqlalchemy import func, case

financeiro_api = Blueprint('financeiro_api', __name__)


@financeiro_api.route('/importar-balancete', methods=['POST'])
def importar_balancete():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Nenhum arquivo enviado'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Nome do arquivo vazio'}), 400

        # Lê o arquivo Excel
        xls = pd.ExcelFile(file)
        
        # Busca o período existente ou cria um novo com tratamento de erro
        try:
            periodo_atual = PeriodoContabil.query.filter_by(
                ano=2024,
                mes=2
            ).with_for_update().first()  # Adiciona lock para concorrência
            
            if not periodo_atual:
                # Se não existir, cria novo período
                periodo_atual = PeriodoContabil(
                    ano=2024,
                    mes=2,
                    status='ABERTO',
                    data_abertura=datetime.now()
                )
                db.session.add(periodo_atual)
                db.session.flush()  # Obter ID sem commit
            
            # Limpar dados existentes do período
            print(f"Limpando dados do período {periodo_atual.id}")
            AnaliseFinanceira.query.filter_by(periodo_id=periodo_atual.id).delete()
            BalanceteItem.query.filter_by(periodo_id=periodo_atual.id).delete() if hasattr(BalanceteItem, 'periodo_id') else None
            FluxoCaixa.query.filter_by(periodo_id=periodo_atual.id).delete()
            FundoEspecial.query.filter_by(periodo_id=periodo_atual.id).delete()
            IndicadorFinanceiro.query.filter_by(periodo_id=periodo_atual.id).delete()
            
            db.session.commit()
            print(f"Dados antigos limpos com sucesso para o período {periodo_atual.id}")
            
        except Exception as e:
            db.session.rollback()
            print(f"Erro ao manipular período: {str(e)}")
            raise e

        # Importa FATES e Fundos de Investimento
        df_fates = pd.read_excel(xls, 'FATES 2024 ', na_values=['', 'NA', 'N/A'])
        df_investimento = pd.read_excel(xls, 'FUNDO DE INVESTIMENTO 2024', na_values=['', 'NA', 'N/A'])

        # Preenchendo valores nulos de forma específica para cada coluna
        df_investimento = df_investimento.assign(
            Emissao=df_investimento['Emissao'].fillna(pd.NaT),
            Historico=df_investimento['Historico'].fillna(''),
            Debito=df_investimento['Debito'].fillna(0),
            Credito=df_investimento['Credito'].fillna(0)
        )

        df_fates = df_fates.assign(
            Emissao=df_fates['Emissao'].fillna(pd.NaT),
            Historico=df_fates['Historico'].fillna(''),
            Debito=df_fates['Debito'].fillna(0),
            Credito=df_fates['Credito'].fillna(0)
        )

        # Importa Fluxo de Caixa
        df_dfc = pd.read_excel(xls, 'DFC')
        FluxoCaixa.query.filter_by(periodo_id=periodo_atual.id).delete()
        # Processa dados do Fluxo de Caixa...

        db.session.commit()
        return jsonify({
            'message': 'Importação completa realizada com sucesso',
            'periodo_id': periodo_atual.id
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Erro na importação: {str(e)}")
        return jsonify({'error': str(e)}), 500

@financeiro_api.route('/resumo', methods=['GET'])
def get_resumo_financeiro():
    try:
        # Consulta para obter saldos atuais do balancete
        balancete = db.session.query(
            func.sum(BalanceteItem.valor_atual).label('total')
        ).first()

        # Cálculos financeiros básicos
        ativos = db.session.query(
            func.sum(BalanceteItem.valor_atual)
        ).filter(
            BalanceteItem.conta.like('1%')  # Contas que começam com 1 são ativos
        ).scalar() or 0

        passivos = db.session.query(
            func.sum(BalanceteItem.valor_atual)
        ).filter(
            BalanceteItem.conta.like('2%')  # Contas que começam com 2 são passivos
        ).scalar() or 0

        patrimonio_liquido = ativos - abs(passivos)

        # Saldo em caixa (contas do grupo 1.1.1)
        saldo_caixa = db.session.query(
            func.sum(BalanceteItem.valor_atual)
        ).filter(
            BalanceteItem.conta.like('1.1.1%')
        ).scalar() or 0

        return jsonify({
            'saldo_caixa': float(saldo_caixa),
            'total_ativos': float(ativos),
            'total_passivos': float(abs(passivos)),
            'patrimonio_liquido': float(patrimonio_liquido)
        })

    except Exception as e:
        print(f"Erro ao buscar resumo financeiro: {str(e)}")
        return jsonify({"error": "Erro ao buscar dados financeiros"}), 500

@financeiro_api.route('/fundos', methods=['GET'])
def get_fundos():
    try:
        # Cálculo do saldo do FATES
        fates = db.session.query(
            func.sum(
                case(
                    (FundoEspecial.tipo_movimento == 'ENTRADA', FundoEspecial.valor_movimento),
                    else_=-FundoEspecial.valor_movimento
                )
            )
        ).filter(
            FundoEspecial.tipo_fundo == 'FATES'
        ).scalar() or 0

        # Cálculo do saldo do Fundo de Investimento
        investimento = db.session.query(
            func.sum(
                case(
                    (FundoEspecial.tipo_movimento == 'ENTRADA', FundoEspecial.valor_movimento),
                    else_=-FundoEspecial.valor_movimento
                )
            )
        ).filter(
            FundoEspecial.tipo_fundo == 'INVESTIMENTO'
        ).scalar() or 0

        return jsonify({
            'fates': float(fates),
            'investimento': float(investimento)
        })

    except Exception as e:
        print(f"Erro ao buscar dados dos fundos: {str(e)}")
        return jsonify({"error": "Erro ao buscar dados dos fundos"}), 500
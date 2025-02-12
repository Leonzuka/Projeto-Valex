from flask import Blueprint, request, jsonify, current_app
from models.models import db, Produtor, Fazenda, Variedade, Atividade, ClassificacaoUva
from datetime import datetime
from pytz import timezone

# Criar Blueprint
api = Blueprint('api', __name__)

# Rotas para Produtor
@api.route('/produtores', methods=['GET'])
def get_produtores():
    try:
        produtores = Produtor.query.all()
        return jsonify([{
            'id': p.id,
            'nome': p.nome,
            'ggn': p.ggn,
            'sigla': p.sigla
        } for p in produtores])
    except Exception as e:
        print(f"Erro ao buscar produtores: {str(e)}")  # Log mais simples
        return jsonify({"error": "Erro ao buscar produtores", "details": str(e)}), 500

@api.route('/produtores/<int:id>', methods=['GET'])
def get_produtor(id):
    produtor = Produtor.query.get_or_404(id)
    return jsonify({
        'id': produtor.id,
        'nome': produtor.nome,
        'ggn': produtor.ggn,
        'sigla': produtor.sigla
    })

@api.route('/produtores', methods=['POST'])
def create_produtor():
    data = request.get_json()
    novo_produtor = Produtor(
        nome=data['nome'],
        ggn=data.get('ggn'),  # opcional
        sigla=data['sigla'],
        telefone=data.get('telefone'),  # novos campos
        endereco=data.get('endereco')
    )
    db.session.add(novo_produtor)
    db.session.commit()
    return jsonify({
        'id': novo_produtor.id,
        'nome': novo_produtor.nome,
        'ggn': novo_produtor.ggn,
        'sigla': novo_produtor.sigla,
        'telefone': novo_produtor.telefone,
        'endereco': novo_produtor.endereco
    }), 201

@api.route('/produtores/<int:id>', methods=['PUT'])
def update_produtor(id):
    produtor = Produtor.query.get_or_404(id)
    data = request.get_json()
    
    produtor.nome = data.get('nome', produtor.nome)
    produtor.ggn = data.get('ggn', produtor.ggn)
    produtor.sigla = data.get('sigla', produtor.sigla)
    produtor.telefone = data.get('telefone', produtor.telefone)
    produtor.endereco = data.get('endereco', produtor.endereco)
    
    db.session.commit()
    return jsonify({
        'id': produtor.id,
        'nome': produtor.nome,
        'ggn': produtor.ggn,
        'sigla': produtor.sigla,
        'telefone': produtor.telefone,
        'endereco': produtor.endereco
    })

@api.route('/produtores/<int:id>', methods=['DELETE'])
def delete_produtor(id):
    produtor = Produtor.query.get_or_404(id)
    db.session.delete(produtor)
    db.session.commit()
    return '', 204

# Rotas para Fazenda
@api.route('/fazendas', methods=['GET'])
def get_fazendas():
    fazendas = Fazenda.query.all()
    return jsonify([{
        'id': f.id,
        'nome': f.nome,
        'area_parcela': f.area_parcela,
        'produtor_id': f.produtor_id,
        'variedade_id': f.variedade_id
    } for f in fazendas])

# Rotas para Variedade
@api.route('/variedades', methods=['GET'])
def get_variedades():
    variedades = Variedade.query.all()
    return jsonify([{
        'id': v.id,
        'nome': v.nome
    } for v in variedades])

@api.route('/fazendas/produtor/<int:produtor_id>', methods=['GET'])
def get_fazendas_by_produtor(produtor_id):
    fazendas = Fazenda.query.filter_by(produtor_id=produtor_id).all()
    return jsonify([{
        'id': f.id,
        'nome': f.nome,
        'area_parcela': f.area_parcela,
        'variedade_id': f.variedade_id,
        'variedade_nome': f.variedade.nome
    } for f in fazendas])

@api.route('/fazendas/<int:fazenda_id>/variedades', methods=['GET'])
def get_variedades_by_fazenda(fazenda_id):
    try:
        fazenda = Fazenda.query.get_or_404(fazenda_id)
        variedades = db.session.query(Variedade)\
            .join(Fazenda, Fazenda.variedade_id == Variedade.id)\
            .filter(Fazenda.nome == fazenda.nome)\
            .distinct()\
            .all()
            
        return jsonify([{
            'id': v.id,
            'nome': v.nome
        } for v in variedades])
    except Exception as e:
        return jsonify({"error": "Erro ao buscar variedades"}), 500

@api.route('/atividades', methods=['POST'])
def create_atividade():
    data = request.get_json()
    nova_atividade = Atividade(
        produtor_id=data['produtor_id'],
        fazenda_id=data['fazenda_id'],
        variedade_id=data['variedade_id'],
        classificacao_id=data.get('classificacao_id'), 
        tipo_atividade=data['tipo_atividade'],
        quantidade_pallets=data['quantidade_pallets'],
        caixas=data.get('caixas')  # Adicionando caixas
    )
    db.session.add(nova_atividade)
    db.session.commit()
    return jsonify({
        'id': nova_atividade.id,
        'message': 'Atividade registrada com sucesso'
    }), 201

@api.route('/atividades/resumo/<int:produtor_id>', methods=['GET'])
def get_resumo_dia(produtor_id):
    try:
        hoje = datetime.utcnow().date()
        
        # Buscar atividades do dia com informações relacionadas
        atividades = db.session.query(
            Atividade,
            Variedade.nome.label('variedade_nome'),
            ClassificacaoUva.classificacao.label('classificacao_nome')
        ).join(
            Variedade, Atividade.variedade_id == Variedade.id
        ).outerjoin(  # usando outerjoin pois nem toda atividade tem classificação
            ClassificacaoUva, Atividade.classificacao_id == ClassificacaoUva.id
        ).filter(
            Atividade.produtor_id == produtor_id,
            db.func.date(Atividade.created_at) == hoje
        ).all()
        
        # Agrupar por variedade e classificação
        resumo_detalhado = {}
        total_pallets = 0
        
        for atividade, var_nome, class_nome in atividades:
            total_pallets += atividade.quantidade_pallets
            
            # Agrupar por variedade
            if var_nome not in resumo_detalhado:
                resumo_detalhado[var_nome] = {
                    'total_pallets': 0,
                    'classificacoes': {}
                }
            
            resumo_detalhado[var_nome]['total_pallets'] += atividade.quantidade_pallets
            
            # Agrupar por classificação dentro da variedade
            if class_nome:  # só agrupa se tiver classificação
                if class_nome not in resumo_detalhado[var_nome]['classificacoes']:
                    resumo_detalhado[var_nome]['classificacoes'][class_nome] = 0
                resumo_detalhado[var_nome]['classificacoes'][class_nome] += atividade.quantidade_pallets
        
        return jsonify({
            'total_pallets': total_pallets,
            'detalhamento': resumo_detalhado
        })
    except Exception as e:
        print(f"Erro ao buscar resumo do dia: {str(e)}")
        return jsonify({"error": "Erro ao buscar resumo do dia"}), 500

@api.route('/atividades/historico/<int:produtor_id>', methods=['GET'])
def get_historico_atividades(produtor_id):
    try:
        # Adiciona índices para melhorar performance
        atividades = db.session.query(
            Atividade,
            Fazenda.nome.label('fazenda_nome'),
            Variedade.nome.label('variedade_nome'),
            ClassificacaoUva.classificacao.label('classificacao_nome')
        ).join(
            Fazenda, Atividade.fazenda_id == Fazenda.id
        ).join(
            Variedade, Atividade.variedade_id == Variedade.id
        ).outerjoin(
            ClassificacaoUva, Atividade.classificacao_id == ClassificacaoUva.id
        ).filter(
            Atividade.produtor_id == produtor_id
        ).order_by(
            Atividade.created_at.desc()
        ).limit(20).all()  # Reduz o limite para 20 registros
        
        # Usa list comprehension para melhor performance
        resultado = [{
            'id': a.id,
            'tipo_atividade': a.tipo_atividade,
            'quantidade_pallets': a.quantidade_pallets,
            'caixas': a.caixas,
            'created_at': a.created_at.astimezone(timezone('America/Sao_Paulo')).strftime('%d/%m/%Y %H:%M'),
            'fazenda': fazenda_nome,
            'variedade': variedade_nome,
            'classificacao': classificacao_nome
        } for a, fazenda_nome, variedade_nome, classificacao_nome in atividades]
        
        return jsonify(resultado)
    except Exception as e:
        print(f"Erro ao buscar histórico: {str(e)}")
        return jsonify({"error": "Erro ao buscar histórico de atividades"}), 500
    
@api.route('/classificacoes', methods=['GET'])
def get_classificacoes():
    try:
        classificacoes = db.session.query(ClassificacaoUva).all()
        return jsonify([{
            'id': c.id,
            'classificacao': c.classificacao,
            'caixa': c.caixa,
            'cinta': c.cinta,
            'peso': c.peso,
            'cumbuca': c.cumbuca
        } for c in classificacoes])
    except Exception as e:
        print(f"Erro ao buscar classificações: {str(e)}")
        return jsonify({"error": "Erro ao buscar classificações"}), 500

@api.route('/gestor/resumo-geral', methods=['GET'])
def get_resumo_geral():
    """
    Retorna um resumo geral de todos os produtores para o dia atual.
    Inclui total de pallets e detalhamento por variedade e classificação.
    """
    try:
        hoje = datetime.utcnow().date()
        
        # Buscar todos os produtores ativos
        produtores = Produtor.query.all()
        resumo_geral = []
        
        for produtor in produtores:
            # Buscar atividades do dia para cada produtor
            atividades = db.session.query(
                Atividade,
                Variedade.nome.label('variedade_nome'),
                ClassificacaoUva.classificacao.label('classificacao_nome')
            ).join(
                Variedade, Atividade.variedade_id == Variedade.id
            ).outerjoin(
                ClassificacaoUva, Atividade.classificacao_id == ClassificacaoUva.id
            ).filter(
                Atividade.produtor_id == produtor.id,
                db.func.date(Atividade.created_at) == hoje
            ).all()
            
            # Processar atividades do produtor
            resumo_detalhado = {}
            total_pallets = 0
            
            for atividade, var_nome, class_nome in atividades:
                total_pallets += atividade.quantidade_pallets
                
                if var_nome not in resumo_detalhado:
                    resumo_detalhado[var_nome] = {
                        'total_pallets': 0,
                        'classificacoes': {}
                    }
                
                resumo_detalhado[var_nome]['total_pallets'] += atividade.quantidade_pallets
                
                if class_nome:
                    if class_nome not in resumo_detalhado[var_nome]['classificacoes']:
                        resumo_detalhado[var_nome]['classificacoes'][class_nome] = 0
                    resumo_detalhado[var_nome]['classificacoes'][class_nome] += atividade.quantidade_pallets
            
            # Adicionar resumo do produtor ao resumo geral
            resumo_geral.append({
                'produtor_id': produtor.id,
                'produtor_nome': produtor.nome,
                'produtor_sigla': produtor.sigla,
                'total_pallets': total_pallets,
                'detalhamento': resumo_detalhado
            })
        
        return jsonify(resumo_geral)
    
    except Exception as e:
        print(f"Erro ao gerar resumo geral: {str(e)}")
        return jsonify({"error": "Erro ao gerar resumo geral"}), 500
    
@api.route('/gestor/estatisticas', methods=['GET'])
def get_estatisticas():
    """
    Retorna estatísticas gerais do sistema
    """
    try:
        hoje = datetime.utcnow().date()
        
        # Total de pallets do dia
        total_pallets_dia = db.session.query(db.func.sum(Atividade.quantidade_pallets)).filter(
            db.func.date(Atividade.created_at) == hoje
        ).scalar() or 0
        
        # Total de produtores ativos (que registraram atividade hoje)
        produtores_ativos = db.session.query(db.func.count(db.distinct(Atividade.produtor_id))).filter(
            db.func.date(Atividade.created_at) == hoje
        ).scalar() or 0
        
        # Totais por tipo de atividade
        totais_por_tipo = db.session.query(
            Atividade.tipo_atividade,
            db.func.count(Atividade.id).label('quantidade')
        ).filter(
            db.func.date(Atividade.created_at) == hoje
        ).group_by(Atividade.tipo_atividade).all()
        
        return jsonify({
            'total_pallets_dia': total_pallets_dia,
            'produtores_ativos': produtores_ativos,
            'atividades_por_tipo': dict(totais_por_tipo)
        })
        
    except Exception as e:
        print(f"Erro ao buscar estatísticas: {str(e)}")
        return jsonify({"error": "Erro ao buscar estatísticas"}), 500
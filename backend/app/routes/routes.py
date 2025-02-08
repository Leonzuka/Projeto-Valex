from flask import Blueprint, request, jsonify
from ..models.models import db, Produtor, Fazenda, Variedade, Atividade
from datetime import datetime

# Criar Blueprint
api = Blueprint('api', __name__)

# Rotas para Produtor
@api.route('/produtores', methods=['GET'])
def get_produtores():
    produtores = Produtor.query.all()
    return jsonify([{
        'id': p.id,
        'nome': p.nome,
        'ggn': p.ggn,
        'sigla': p.sigla
    } for p in produtores])

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
        sigla=data['sigla']
    )
    db.session.add(novo_produtor)
    db.session.commit()
    return jsonify({
        'id': novo_produtor.id,
        'nome': novo_produtor.nome,
        'ggn': novo_produtor.ggn,
        'sigla': novo_produtor.sigla
    }), 201

@api.route('/produtores/<int:id>', methods=['PUT'])
def update_produtor(id):
    produtor = Produtor.query.get_or_404(id)
    data = request.get_json()
    
    produtor.nome = data.get('nome', produtor.nome)
    produtor.ggn = data.get('ggn', produtor.ggn)
    produtor.sigla = data.get('sigla', produtor.sigla)
    
    db.session.commit()
    return jsonify({
        'id': produtor.id,
        'nome': produtor.nome,
        'ggn': produtor.ggn,
        'sigla': produtor.sigla
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

@api.route('/atividades', methods=['POST'])
def create_atividade():
    data = request.get_json()
    nova_atividade = Atividade(
        produtor_id=data['produtor_id'],
        fazenda_id=data['fazenda_id'],
        variedade_id=data['variedade_id'],
        tipo_atividade=data['tipo_atividade'],
        quantidade_pallets=data['quantidade_pallets']
    )
    db.session.add(nova_atividade)
    db.session.commit()
    return jsonify({
        'id': nova_atividade.id,
        'message': 'Atividade registrada com sucesso'
    }), 201

@api.route('/atividades/resumo/<int:produtor_id>', methods=['GET'])
def get_resumo_dia(produtor_id):
    hoje = datetime.utcnow().date()
    
    # Buscar atividades do dia
    atividades = Atividade.query.filter(
        Atividade.produtor_id == produtor_id,
        db.func.date(Atividade.created_at) == hoje
    ).all()
    
    # Calcular totais
    total_atividades = len(atividades)
    total_pallets = sum(atividade.quantidade_pallets for atividade in atividades)
    
    return jsonify({
        'total_atividades': total_atividades,
        'total_pallets': total_pallets
    })

# routes.py

@api.route('/atividades/historico/<int:produtor_id>', methods=['GET'])
def get_historico_atividades(produtor_id):
    try:
        atividades = Atividade.query.filter_by(produtor_id=produtor_id)\
            .order_by(Atividade.created_at.desc())\
            .limit(50)\
            .all()
        
        resultado = []
        for a in atividades:
            fazenda = Fazenda.query.get(a.fazenda_id)
            variedade = Variedade.query.get(a.variedade_id)
            
            if fazenda and variedade:
                resultado.append({
                    'id': a.id,
                    'tipo_atividade': a.tipo_atividade,
                    'quantidade_pallets': a.quantidade_pallets,
                    'created_at': a.created_at.strftime('%d/%m/%Y %H:%M'),
                    'fazenda': fazenda.nome,
                    'area_parcela': fazenda.area_parcela,
                    'variedade': variedade.nome
                })
        
        return jsonify(resultado)
    except Exception as e:
        print(f"Erro ao buscar histórico: {str(e)}")
        return jsonify({"error": "Erro ao buscar histórico de atividades"}), 500
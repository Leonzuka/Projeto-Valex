from flask import Blueprint, request, jsonify, current_app
from models.models import db, Produtor, Fazenda, Variedade, Atividade, ClassificacaoUva
from models.financeiro_models import BalanceteItem, PlanoContas
from datetime import datetime, timedelta
from pytz import timezone
from io import StringIO
import csv
import pandas as pd
import re

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
def get_resumo_semana(produtor_id):
    try:
        # Calcula a data inicial (7 dias atrás) e final (hoje)
        hoje = datetime.utcnow().date()
        data_inicial = hoje - timedelta(days=7)
        
        # Buscar atividades da semana com informações relacionadas
        atividades = db.session.query(
            Atividade,
            Variedade.nome.label('variedade_nome'),
            ClassificacaoUva.classificacao.label('classificacao_nome')
        ).join(
            Variedade, Atividade.variedade_id == Variedade.id
        ).outerjoin(
            ClassificacaoUva, Atividade.classificacao_id == ClassificacaoUva.id
        ).filter(
            Atividade.produtor_id == produtor_id,
            db.func.date(Atividade.created_at) >= data_inicial,
            db.func.date(Atividade.created_at) <= hoje
        ).all()
        
        # Agrupar por variedade e classificação
        resumo_detalhado = {}
        resumo_diario = {}
        total_pallets = 0
        
        for atividade, var_nome, class_nome in atividades:
            data = atividade.created_at.date()
            total_pallets += atividade.quantidade_pallets
            
            # Inicializar estrutura para o dia se não existir
            if data not in resumo_diario:
                resumo_diario[data] = {
                    'total_pallets': 0,
                    'detalhamento': {}
                }
            
            # Atualizar totais diários
            resumo_diario[data]['total_pallets'] += atividade.quantidade_pallets
            
            # Agrupar por variedade no resumo geral
            if var_nome not in resumo_detalhado:
                resumo_detalhado[var_nome] = {
                    'total_pallets': 0,
                    'classificacoes': {}
                }
            
            resumo_detalhado[var_nome]['total_pallets'] += atividade.quantidade_pallets
            
            # Agrupar por classificação dentro da variedade
            if class_nome:
                if class_nome not in resumo_detalhado[var_nome]['classificacoes']:
                    resumo_detalhado[var_nome]['classificacoes'][class_nome] = 0
                resumo_detalhado[var_nome]['classificacoes'][class_nome] += atividade.quantidade_pallets
        
        # Converter datas para string no formato brasileiro
        resumo_diario_formatado = {
            data.strftime('%d/%m/%Y'): dados 
            for data, dados in resumo_diario.items()
        }
        
        return jsonify({
            'total_pallets': total_pallets,
            'detalhamento': resumo_detalhado,
            'resumo_diario': resumo_diario_formatado
        })
    except Exception as e:
        print(f"Erro ao buscar resumo da semana: {str(e)}")
        return jsonify({"error": "Erro ao buscar resumo da semana"}), 500

@api.route('/atividades/historico/<int:produtor_id>', methods=['GET'])
def get_historico_atividades(produtor_id):
    try:
        # Adiciona índices para melhorar performance
        atividades = db.session.query(
            Atividade,
            Fazenda.nome.label('fazenda_nome'),
            Variedade.nome.label('variedade_nome'),
            ClassificacaoUva.classificacao.label('classificacao_nome'),
            ClassificacaoUva.caixa.label('classificacao_caixa') 
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
            'classificacao': f"{classificacao_nome} - {classificacao_caixa}" if classificacao_nome else None
        } for a, fazenda_nome, variedade_nome, classificacao_nome, classificacao_caixa in atividades]
        
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
                ClassificacaoUva.classificacao.label('classificacao_nome'),
                ClassificacaoUva.peso.label('classificacao_peso'),  # Adicionando o peso
                ClassificacaoUva.caixa.label('classificacao_caixa')  # Adicionando a caixa
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
            
            for atividade, var_nome, class_nome, class_peso, class_caixa in atividades:
                total_pallets += atividade.quantidade_pallets
                
                if var_nome not in resumo_detalhado:
                    resumo_detalhado[var_nome] = {
                        'total_pallets': 0,
                        'classificacoes': {}
                    }
                
                resumo_detalhado[var_nome]['total_pallets'] += atividade.quantidade_pallets
                
                if class_nome:
                    # Criar uma chave composta para classificação incluindo peso e tipo de caixa
                    class_key = f"{class_nome} {class_peso} {class_caixa}"
                    
                    if class_key not in resumo_detalhado[var_nome]['classificacoes']:
                        resumo_detalhado[var_nome]['classificacoes'][class_key] = 0
                    resumo_detalhado[var_nome]['classificacoes'][class_key] += atividade.quantidade_pallets
            
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
    
@api.route('/contabilidade/importar-plano', methods=['POST'])
def importar_plano_contas():
    if 'arquivo' not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado"}), 400
        
    arquivo = request.files['arquivo']
    
    if arquivo.filename == '':
        return jsonify({"error": "Nome de arquivo vazio"}), 400
        
    # Verificar informações do arquivo para debug
    current_app.logger.info(f"Nome do arquivo: {arquivo.filename}")
    current_app.logger.info(f"Tipo MIME: {arquivo.content_type}")
    
    try:
        # Ler o conteúdo do arquivo
        arquivo.stream.seek(0)
        
        # Tentar diferentes codificações
        try:
            conteudo = arquivo.read().decode('utf-8')
        except UnicodeDecodeError:
            arquivo.stream.seek(0)
            try:
                conteudo = arquivo.read().decode('iso-8859-1')
            except UnicodeDecodeError:
                arquivo.stream.seek(0)
                conteudo = arquivo.read().decode('latin-1')
                
        # Detectar o delimitador
        sniffer = csv.Sniffer()
        dialect = sniffer.sniff(conteudo[:1024])
        delimiter = dialect.delimiter
        
        # Se não conseguir detectar, tentar delimitadores comuns
        if not delimiter or delimiter.isalnum():
            if ';' in conteudo[:1024]:
                delimiter = ';'
            elif ',' in conteudo[:1024]:
                delimiter = ','
            elif '\t' in conteudo[:1024]:
                delimiter = '\t'
            else:
                delimiter = ';'  # Padrão
                
        current_app.logger.info(f"Delimitador detectado: '{delimiter}'")
        
        # Ler CSV com pandas
        df = pd.read_csv(StringIO(conteudo), 
                         sep=delimiter, 
                         encoding='utf-8',
                         dtype=str,  # Trata todas as colunas como strings
                         on_bad_lines='skip',
                         engine='python',  # Motor mais flexível
                         skipinitialspace=True,  # Ignora espaços iniciais
                         keep_default_na=False)  # Evita que pandas converta valores vazios em NaN
        
        # Verificar e registrar estrutura do CSV
        current_app.logger.info(f"Colunas detectadas: {list(df.columns)}")
        current_app.logger.info(f"Primeiras linhas: {df.head(3).to_dict()}")

        # Identificar colunas
        colunas_esperadas = ['sequencial', 'codigo', 'tipo', 'descricao', 'referencia']
        mapeamento_colunas = {}
        
        # Verificar cada coluna esperada e encontrar correspondência
        for coluna in colunas_esperadas:
            # Verificar se existe exatamente
            if coluna in df.columns:
                mapeamento_colunas[coluna] = coluna
                continue
                
            # Tentar alternativas para cada coluna
            if coluna == 'sequencial' and any(c in df.columns for c in ['seq', 'id', 'num']):
                for alt in ['seq', 'id', 'num']:
                    if alt in df.columns:
                        mapeamento_colunas[coluna] = alt
                        break
            elif coluna == 'codigo' and any(c in df.columns for c in ['cod', 'código', 'conta']):
                for alt in ['cod', 'código', 'conta']:
                    if alt in df.columns:
                        mapeamento_colunas[coluna] = alt
                        break
            elif coluna == 'tipo' and any(c in df.columns for c in ['t', 'tp', 'sintética']):
                for alt in ['t', 'tp', 'sintética']:
                    if alt in df.columns:
                        mapeamento_colunas[coluna] = alt
                        break
            elif coluna == 'descricao' and any(c in df.columns for c in ['desc', 'descrição', 'nome']):
                for alt in ['desc', 'descrição', 'nome']:
                    if alt in df.columns:
                        mapeamento_colunas[coluna] = alt
                        break
            elif coluna == 'referencia' and any(c in df.columns for c in ['ref', 'referência', 'reduzido']):
                for alt in ['ref', 'referência', 'reduzido']:
                    if alt in df.columns:
                        mapeamento_colunas[coluna] = alt
                        break
            
            # Se ainda não encontrou, usar a posição (índice numérico das colunas)
            if coluna not in mapeamento_colunas and len(df.columns) >= colunas_esperadas.index(coluna) + 1:
                mapeamento_colunas[coluna] = df.columns[colunas_esperadas.index(coluna)]
        
        current_app.logger.info(f"Mapeamento de colunas: {mapeamento_colunas}")
        
        # Se não conseguiu mapear todas as colunas, tentar inferir pela posição
        if len(mapeamento_colunas) < len(colunas_esperadas):
            current_app.logger.warning("Algumas colunas não foram mapeadas. Usando posições.")
            
            if len(df.columns) >= 5:  # Assumimos que temos pelo menos 5 colunas
                df.columns = colunas_esperadas[:len(df.columns)]
                mapeamento_colunas = {col: col for col in colunas_esperadas if col in df.columns}
            else:
                return jsonify({"error": "Estrutura do CSV não reconhecida. O arquivo deve ter pelo menos 5 colunas."}), 400
        
        registros_importados = 0
        registros_atualizados = 0
        registros_ignorados = 0
        
        # Limpar todos os registros existentes antes da importação
        # db.session.query(PlanoContas).delete()
        # db.session.commit()
        
        # Processar linha a linha
        for index, row in df.iterrows():
            try:
                # Obter valores com tratamento de nulos
                sequencial = str(row.get(mapeamento_colunas.get('sequencial', ''), '')).strip() if 'sequencial' in mapeamento_colunas else ''
                codigo = str(row.get(mapeamento_colunas.get('codigo', ''), '')).strip() if 'codigo' in mapeamento_colunas else ''
                tipo = str(row.get(mapeamento_colunas.get('tipo', ''), '')).strip() if 'tipo' in mapeamento_colunas else ''
                descricao = str(row.get(mapeamento_colunas.get('descricao', ''), '')).strip() if 'descricao' in mapeamento_colunas else ''
                referencia = str(row.get(mapeamento_colunas.get('referencia', ''), '')).strip() if 'referencia' in mapeamento_colunas else ''
                
                # Pular linhas sem código ou descrição
                if not codigo or codigo.lower() == 'none' or not descricao or descricao.lower() == 'none':
                    registros_ignorados += 1
                    continue
                
                # Determinar o nível com base no número de pontos no código
                nivel = codigo.count('.') + 1
                
                # Determinar tipo da conta
                tipo_conta = 'PASSIVO'
                if codigo.startswith('1'):
                    tipo_conta = 'ATIVO'
                elif codigo.startswith('3'):
                    tipo_conta = 'DESPESA'
                elif codigo.startswith('4'):
                    tipo_conta = 'RECEITA'
                elif codigo.startswith('2.4'):
                    tipo_conta = 'PATRIMONIO_LIQUIDO'
                
                # Determinar natureza do saldo
                natureza_saldo = 'DEVEDOR' if codigo.startswith(('1', '3')) else 'CREDOR'
                
                # Determinar se permite lançamento
                permite_lancamento = tipo.upper() != 'S'
                
                # Verificar se a conta já existe
                conta_existente = PlanoContas.query.filter_by(codigo=codigo).first()
                
                if conta_existente:
                    # Atualizar conta existente
                    conta_existente.sequencial = sequencial
                    conta_existente.codigo_reduzido = referencia
                    conta_existente.descricao = descricao
                    conta_existente.nivel = nivel
                    conta_existente.tipo_conta = tipo_conta
                    conta_existente.natureza_saldo = natureza_saldo
                    conta_existente.permite_lancamento = permite_lancamento
                    conta_existente.tipo = tipo
                    conta_existente.referencia = referencia
                    conta_existente.updated_at = datetime.utcnow()
                    registros_atualizados += 1
                else:
                    # Criar nova conta
                    nova_conta = PlanoContas(
                        sequencial=sequencial,
                        codigo=codigo,
                        codigo_reduzido=referencia,
                        descricao=descricao,
                        nivel=nivel,
                        tipo_conta=tipo_conta,
                        natureza_saldo=natureza_saldo,
                        permite_lancamento=permite_lancamento,
                        tipo=tipo,
                        referencia=referencia
                    )
                    
                    # Identificar conta pai
                    if '.' in codigo:
                        codigo_pai = '.'.join(codigo.split('.')[:-1])
                        conta_pai = PlanoContas.query.filter_by(codigo=codigo_pai).first()
                        if conta_pai:
                            nova_conta.conta_pai_id = conta_pai.id
                    
                    db.session.add(nova_conta)
                    registros_importados += 1
                
                # Commit a cada 100 registros para evitar sobrecarga
                if (registros_importados + registros_atualizados) % 100 == 0:
                    db.session.commit()
                    
            except Exception as row_error:
                current_app.logger.warning(f"Erro ao processar linha {index+1}: {str(row_error)}")
                registros_ignorados += 1
                continue  # Continuar com a próxima linha
        
        # Commit final
        db.session.commit()
        
        return jsonify({
            "message": "Importação concluída com sucesso",
            "registros_importados": registros_importados,
            "registros_atualizados": registros_atualizados,
            "registros_ignorados": registros_ignorados
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro na importação: {str(e)}")
        return jsonify({"error": f"Erro ao processar arquivo: {str(e)}"}), 500
    
@api.route('/contabilidade/plano-contas', methods=['GET'])
def get_plano_contas():
    try:
        # Buscar todos os registros do plano de contas
        plano_contas = PlanoContas.query.all()
        
        # Transformar em dicionário para retorno
        resultado = [{
            'id': conta.id,
            'sequencial': conta.sequencial,
            'codigo': conta.codigo,
            'codigo_reduzido': conta.codigo_reduzido,
            'descricao': conta.descricao, 
            'nivel': conta.nivel,
            'conta_pai_id': conta.conta_pai_id,
            'tipo_conta': conta.tipo_conta,
            'natureza_saldo': conta.natureza_saldo,
            'permite_lancamento': conta.permite_lancamento,
            'tipo': 'S' if not conta.permite_lancamento else 'A',  # Convertendo para formato S/A
            'referencia': conta.referencia
        } for conta in plano_contas]
        
        return jsonify(resultado)
    except Exception as e:
        print(f"Erro ao buscar plano de contas: {str(e)}")
        return jsonify({"error": "Erro ao buscar plano de contas", "details": str(e)}), 500
    
@api.route('/contabilidade/importar-balancete-txt', methods=['POST'])
def importar_balancete_txt():
    if 'arquivo' not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado"}), 400
        
    arquivo = request.files['arquivo']
    
    if arquivo.filename == '':
        return jsonify({"error": "Nome de arquivo vazio"}), 400
        
    # Verificar informações do arquivo para debug
    current_app.logger.info(f"Nome do arquivo: {arquivo.filename}")
    current_app.logger.info(f"Tipo MIME: {arquivo.content_type}")

    try:
        # Extrair competência do nome do arquivo (BALANCETE 2024.1.TXT => 2024.1) ou do conteúdo do arquivo
        competencia = None
        nome_arquivo = arquivo.filename.upper()
        if 'BALANCETE' in nome_arquivo:
            match = re.search(r'(\d{4})\.(\d+)', nome_arquivo)
            if match:
                ano = match.group(1)
                mes = match.group(2).zfill(2)
                competencia = f"{ano}-{mes}"
                
        # Ler o conteúdo do arquivo
        arquivo.stream.seek(0)
        
        # Tentar diferentes codificações
        try:
            conteudo = arquivo.read().decode('utf-8')
        except UnicodeDecodeError:
            arquivo.stream.seek(0)
            try:
                conteudo = arquivo.read().decode('iso-8859-1')
            except UnicodeDecodeError:
                arquivo.stream.seek(0)
                conteudo = arquivo.read().decode('latin-1')
        
        # Dividir por linhas
        linhas = conteudo.split('\n')
        
        # Se não encontramos a competência no nome do arquivo, procurar no conteúdo
        if not competencia:
            # Procurar por padrões como "ACUMULADO DO MES 01 a 12"
            for linha in linhas[:10]:  # Apenas nas primeiras linhas
                acumulado_match = re.search(r'ACUMULADO DO MES (\d+) a (\d+)', linha)
                if acumulado_match:
                    # Vamos extrair o ano da data no topo do relatório
                    data_match = re.search(r'(\d{2})/(\d{2})/(\d{2})', linhas[0])
                    if data_match:
                        dia, mes, ano = data_match.groups()
                        ano_completo = f"20{ano}"  # Assumindo anos 2000+
                        mes_final = acumulado_match.group(2).zfill(2)
                        competencia = f"{ano_completo}-{mes_final}"
                        break
        
        # Encontrar onde começam os dados reais (após os cabeçalhos)
        cabecalho_linha = -1
        for i, linha in enumerate(linhas):
            linha_lower = linha.lower()
            # Verifica diferentes combinações de termos que podem estar no cabeçalho
            if (("conta" in linha_lower or "código" in linha_lower or "cod" in linha_lower) and 
                ("descr" in linha_lower) and 
                ("valor" in linha_lower or "saldo" in linha_lower)):
                cabecalho_linha = i
                current_app.logger.info(f"Possível cabeçalho encontrado na linha {i}: {linha}")
                break
        
        # Após encontrar o cabeçalho
        if cabecalho_linha != -1:
            current_app.logger.info(f"Cabeçalho encontrado na linha {cabecalho_linha}: {linhas[cabecalho_linha]}")
            # Verificar algumas linhas após o cabeçalho para debug
            for i in range(cabecalho_linha + 2, min(cabecalho_linha + 5, len(linhas))):
                current_app.logger.info(f"Linha {i}: {linhas[i]}")
        
        # Definir as posições das colunas com base no cabeçalho
        posicoes_colunas = [
            (0, 25),     # Conta
            (25, 32),    # Redução
            (32, 35),    # Tipo
            (35, 72),    # Descrição
            (72, 87),    # Valor Anterior
            (87, 103),   # Débito
            (103, 120),  # Crédito
            (120, 137)   # Valor Atual
        ]
        
        # Pular o cabeçalho e a linha de separação para começar a processar os dados
        linha_inicial = cabecalho_linha + 2
        
        # Limpar registros anteriores da mesma competência, se houver
        if competencia:
            current_app.logger.info(f"Competência detectada: {competencia}")
        
        registros_importados = 0
        registros_ignorados = 0
        
        # Processar linha a linha
        for i in range(linha_inicial, len(linhas)):
            linha = linhas[i]
            
            # Pular linhas vazias ou linhas de cabeçalho de página
            if not linha.strip() or "Pag.:" in linha:
                continue
                
            # Pular linhas de cabeçalho que possam aparecer em páginas subsequentes
            if "Conta" in linha and "Reduz" in linha and "Descricao" in linha:
                # Pular esta linha e a próxima (linha de separação)
                i += 2
                continue
                
            try:
                # Verificar se a linha tem comprimento suficiente
                if len(linha) < posicoes_colunas[-1][1]:
                    registros_ignorados += 1
                    continue
                    
                # Extrair valores com base nas posições fixas
                conta = linha[posicoes_colunas[0][0]:posicoes_colunas[0][1]].strip()
                reducao = linha[posicoes_colunas[1][0]:posicoes_colunas[1][1]].strip()
                tipo = linha[posicoes_colunas[2][0]:posicoes_colunas[2][1]].strip()
                descricao = linha[posicoes_colunas[3][0]:posicoes_colunas[3][1]].strip()
                valor_anterior_str = linha[posicoes_colunas[4][0]:posicoes_colunas[4][1]].strip()
                valor_periodo_debito_str = linha[posicoes_colunas[5][0]:posicoes_colunas[5][1]].strip()
                valor_periodo_credito_str = linha[posicoes_colunas[6][0]:posicoes_colunas[6][1]].strip()
                valor_atual_str = linha[posicoes_colunas[7][0]:posicoes_colunas[7][1]].strip()
                
                # Verificar se a linha contém dados válidos (tem número de conta)
                if not conta or not conta[0].isdigit():
                    registros_ignorados += 1
                    continue
                
                # Converter valores para float (trocar vírgula por ponto)
                try:
                    valor_anterior = float(valor_anterior_str.replace('.', '').replace(',', '.') or 0)
                    valor_periodo_debito = float(valor_periodo_debito_str.replace('.', '').replace(',', '.') or 0)
                    valor_periodo_credito = float(valor_periodo_credito_str.replace('.', '').replace(',', '.') or 0)
                    valor_atual = float(valor_atual_str.replace('.', '').replace(',', '.') or 0)
                except ValueError:
                    valor_anterior = 0.0
                    valor_periodo_debito = 0.0
                    valor_periodo_credito = 0.0
                    valor_atual = 0.0
                
                # Converter redução para inteiro se possível
                try:
                    reducao_int = int(reducao) if reducao and reducao.isdigit() else None
                except ValueError:
                    reducao_int = None
                
                # Criar novo item
                novo_item = BalanceteItem(
                    conta=conta,
                    reducao=reducao_int,
                    tipo=tipo[:1] if tipo else None,  # Pega só o primeiro caractere
                    descricao=descricao,
                    valor_anterior=valor_anterior,
                    valor_periodo_debito=valor_periodo_debito,
                    valor_periodo_credito=valor_periodo_credito,
                    valor_atual=valor_atual,
                    data_importacao=datetime.utcnow()
                )
                
                db.session.add(novo_item)
                registros_importados += 1
                
                # Commit a cada 100 registros para evitar sobrecarga
                if registros_importados % 100 == 0:
                    db.session.commit()
                    current_app.logger.info(f"Importados {registros_importados} registros até agora")
                    
            except Exception as row_error:
                current_app.logger.warning(f"Erro ao processar linha {i+1}: {str(row_error)}")
                registros_ignorados += 1
                continue  # Continuar com a próxima linha
        
        # Commit final
        db.session.commit()
        
        return jsonify({
            "message": "Importação concluída com sucesso",
            "registros_importados": registros_importados,
            "registros_ignorados": registros_ignorados,
            "competencia": competencia
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro na importação: {str(e)}")
        return jsonify({"error": f"Erro ao processar arquivo: {str(e)}"}), 500
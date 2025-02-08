import os
import psycopg2
import pymysql
from dotenv import load_dotenv

load_dotenv()

# Conexão MySQL (origem)
mysql_conn = pymysql.connect(
    host="127.0.0.1",
    user="root",
    password="1234",
    database="valex"
)

# Conexão PostgreSQL (destino)
DATABASE_URL = "postgresql://valex_3u5h_user:4nyZin0QCeeQCo88LuQhXjKClrS6Muus@dpg-cujrttlds78s739it6a0-a.oregon-postgres.render.com/valex_3u5h"
pg_conn = psycopg2.connect(DATABASE_URL)

try:
    with mysql_conn.cursor() as mysql_cursor:
        # Verificar dados antes da migração
        print("\nVerificando IDs de fazendas referenciados em atividades...")
        mysql_cursor.execute("""
            SELECT DISTINCT a.fazenda_id 
            FROM atividade a 
            LEFT JOIN fazenda f ON a.fazenda_id = f.id 
            WHERE f.id IS NULL
        """)
        missing_fazendas = mysql_cursor.fetchall()
        if missing_fazendas:
            print("⚠️ Encontradas atividades com fazendas inexistentes:")
            for mf in missing_fazendas:
                print(f"Fazenda ID: {mf[0]}")

        # Verificar fazendas
        print("\nVerificando fazendas no MySQL...")
        mysql_cursor.execute("SELECT id, nome FROM fazenda ORDER BY id")
        fazendas_check = mysql_cursor.fetchall()
        print("Fazendas disponíveis:")
        for f in fazendas_check:
            print(f"ID: {f[0]}, Nome: {f[1]}")

        # Verificar atividades
        print("\nVerificando atividades no MySQL...")
        mysql_cursor.execute("SELECT id, fazenda_id FROM atividade ORDER BY id")
        atividades_check = mysql_cursor.fetchall()
        print("Atividades e suas fazendas:")
        for a in atividades_check:
            print(f"Atividade ID: {a[0]}, Fazenda ID: {a[1]}")

        # Proceder com a migração normal...
        print("\nIniciando migração...")
        
        mysql_cursor.execute("SELECT * FROM variedade")
        variedades = mysql_cursor.fetchall()
        
        mysql_cursor.execute("SELECT * FROM produtor")
        produtores = mysql_cursor.fetchall()
        
        mysql_cursor.execute("SELECT * FROM fazenda")
        fazendas = mysql_cursor.fetchall()
        
        mysql_cursor.execute("SELECT * FROM atividade")
        atividades = mysql_cursor.fetchall()

    with pg_conn.cursor() as pg_cursor:
        # Limpar tabelas
        print("\nLimpando tabelas...")
        pg_cursor.execute("TRUNCATE TABLE atividade, fazenda, produtor, variedade CASCADE")
        
        # Inserir dados
        print("\nInserindo variedades...")
        for v in variedades:
            pg_cursor.execute(
                "INSERT INTO variedade (id, nome, created_at, updated_at) VALUES (%s, %s, %s, %s)",
                v
            )
        
        print("Inserindo produtores...")
        for p in produtores:
            pg_cursor.execute(
                "INSERT INTO produtor (id, nome, ggn, sigla, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s)",
                p
            )
        
        print("Inserindo fazendas...")
        inserted_fazendas = set()
        for f in fazendas:
            try:
                pg_cursor.execute(
                    "INSERT INTO fazenda (id, nome, area_parcela, produtor_id, variedade_id, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                    f
                )
                inserted_fazendas.add(f[0])  # Adiciona o ID da fazenda inserida ao conjunto
            except Exception as e:
                print(f"⚠️ Erro ao inserir fazenda {f[0]}: {e}")
        
        print("\nFazendas inseridas:", sorted(list(inserted_fazendas)))
        
        print("\nInserindo atividades...")
        for a in atividades:
            if a[2] not in inserted_fazendas:  # a[2] é o fazenda_id
                print(f"⚠️ Pulando atividade {a[0]} - Fazenda {a[2]} não existe")
                continue
            try:
                pg_cursor.execute(
                    "INSERT INTO atividade (id, produtor_id, fazenda_id, variedade_id, tipo_atividade, quantidade_pallets, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                    a
                )
            except Exception as e:
                print(f"⚠️ Erro ao inserir atividade {a[0]}: {e}")

    pg_conn.commit()
    print("\nMigração concluída com sucesso! 🎉")

except Exception as e:
    print(f"Erro durante a migração: {e}")
    print("Detalhes:", getattr(e, 'diag', ''))
    pg_conn.rollback()

finally:
    mysql_conn.close()
    pg_conn.close()
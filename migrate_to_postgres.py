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
pg_conn = psycopg2.connect(os.getenv('DATABASE_URL'))

try:
    # Exportar dados do MySQL
    with mysql_conn.cursor() as mysql_cursor:
        # Variedade
        mysql_cursor.execute("SELECT * FROM variedade")
        variedades = mysql_cursor.fetchall()
        
        # Produtor
        mysql_cursor.execute("SELECT * FROM produtor")
        produtores = mysql_cursor.fetchall()
        
        # Fazenda
        mysql_cursor.execute("SELECT * FROM fazenda")
        fazendas = mysql_cursor.fetchall()
        
        # Atividade
        mysql_cursor.execute("SELECT * FROM atividade")
        atividades = mysql_cursor.fetchall()

    # Importar dados no PostgreSQL
    with pg_conn.cursor() as pg_cursor:
        # Variedade
        for v in variedades:
            pg_cursor.execute(
                "INSERT INTO variedade (id, nome, created_at, updated_at) VALUES (%s, %s, %s, %s)",
                v
            )
        
        # Produtor
        for p in produtores:
            pg_cursor.execute(
                "INSERT INTO produtor (id, nome, ggn, sigla, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s)",
                p
            )
        
        # Fazenda
        for f in fazendas:
            pg_cursor.execute(
                "INSERT INTO fazenda (id, nome, area_parcela, produtor_id, variedade_id, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                f
            )
        
        # Atividade
        for a in atividades:
            pg_cursor.execute(
                "INSERT INTO atividade (id, produtor_id, fazenda_id, variedade_id, tipo_atividade, quantidade_pallets, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                a
            )

    pg_conn.commit()
    print("Migração concluída com sucesso!")

except Exception as e:
    print(f"Erro durante a migração: {e}")
    pg_conn.rollback()

finally:
    mysql_conn.close()
    pg_conn.close()
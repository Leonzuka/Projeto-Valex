# wsgi.py
from app import create_app
from flask_compress import Compress

app = create_app()
Compress(app)

if __name__ == '__main__':
    app.run()
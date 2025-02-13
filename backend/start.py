from wsgi import app
from flask_caching import Cache

cache = Cache(config={'CACHE_TYPE': 'simple'})
cache.init_app(app)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
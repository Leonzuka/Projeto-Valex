import os
from app import create_app
import gunicorn.app.base

class StandaloneApplication(gunicorn.app.base.BaseApplication):
    def __init__(self, app, options=None):
        self.options = options or {}
        self.application = app
        super().__init__()

    def load_config(self):
        for key, value in self.options.items():
            self.cfg.set(key, value)

    def load(self):
        return self.application

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8000))
    options = {
        'bind': f'0.0.0.0:{port}',
        'workers': 4,
        'worker_class': 'sync',
        'timeout': 120
    }
    
    app = create_app()
    StandaloneApplication(app, options).run()
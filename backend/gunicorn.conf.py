# gunicorn.conf.py
import multiprocessing

bind = "0.0.0.0:8000"
workers = 2
timeout = 120
keepalive = 5
max_requests = 1000
max_requests_jitter = 50
worker_class = "sync"
loglevel = "info"
accesslog = "-"
errorlog = "-"

# Adicione estas configurações
forwarded_allow_ips = '*'
proxy_allow_ips = '*'
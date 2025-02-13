# gunicorn.conf.py
import multiprocessing

bind = "0.0.0.0:8000"
workers = 1
timeout = 30
keepalive = 2
max_requests = 500
max_requests_jitter = 25
worker_class = "sync"
loglevel = "info"
accesslog = "-"
errorlog = "-"

# Adicione estas configurações
forwarded_allow_ips = '*'
proxy_allow_ips = '*'
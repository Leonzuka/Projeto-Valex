import multiprocessing

bind = "0.0.0.0:8000"
workers = 2  # Reduzido para 2
timeout = 60  # Reduzido para 60
keepalive = 5
max_requests = 1000
max_requests_jitter = 50
worker_class = "sync"
loglevel = "info"
accesslog = "-"
errorlog = "-"
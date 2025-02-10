#!/bin/bash
export PORT="${PORT:-8000}"
gunicorn --bind "0.0.0.0:$PORT" "app:create_app()"
#!/bin/bash
export PORT="${PORT:-3000}"
gunicorn --bind "0.0.0.0:$PORT" "app:create_app()"

# Alternative to install.sh: run the editor without installing anything but Docker.
#
# The whole point is the version chain -- bundled socket.io 1.3.5 -> Flask-SocketIO 4.x
# -> eventlet 0.30.2 -> Python <= 3.11 (eventlet imports `imp`, dropped in 3.12).
# Freezing it in an image removes it as a problem on every OS. See the README
# section "Why these versions are locked together".
#
# Note this base image is itself end-of-life: this gives reproducibility, not
# security updates. Acceptable for a tool that only ever listens on localhost.

FROM python:3.8-slim

WORKDIR /app

# Dependencies first: this layer is rebuilt only when requirements.txt changes.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Runtime state directories. docker-compose bind-mounts them so that scenes,
# reports and uploads survive the container.
RUN mkdir -p static/old static/scenes static/reports static/upload

ENV APP_HOST=0.0.0.0 \
    APP_OPEN_BROWSER=0

EXPOSE 5000
CMD ["python", "run.py"]

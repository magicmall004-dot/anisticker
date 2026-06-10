module.exports = {
  apps: [
    {
      name: "anisticker-api",
      script: "uvicorn",
      args: "main:app --host 0.0.0.0 --port 8000 --workers 2",
      cwd: "/home/ubuntu/anisticker/backend",
      interpreter: "/home/ubuntu/anisticker/venv/bin/python",
      interpreter_args: "-m",
      env: { NODE_ENV: "production" },
      watch: false,
      autorestart: true,
      max_restarts: 10,
    },
    {
      name: "anisticker-bot",
      script: "bot.py",
      cwd: "/home/ubuntu/anisticker/backend",
      interpreter: "/home/ubuntu/anisticker/venv/bin/python",
      watch: false,
      autorestart: true,
      max_restarts: 10,
    },
  ],
};

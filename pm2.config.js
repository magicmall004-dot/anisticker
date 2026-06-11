module.exports = {
  apps: [
{
  name: "anisticker-api",
  cwd: "/home/anisticker/backend",
  script: "/home/anisticker/venv/bin/python",
  args: "-m uvicorn main:app --host 127.0.0.1 --port 8000",
  watch: false,
  autorestart: true,
},
{
  name: "anisticker-bot",
  cwd: "/home/anisticker/backend",
  script: "/home/anisticker/venv/bin/python",
  args: "bot.py",
  watch: false,
  autorestart: true,
},
  ],
};

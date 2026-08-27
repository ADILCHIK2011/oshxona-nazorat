module.exports = {
  apps: [
    {
      name: 'oshxona-bot',
      script: 'bot/index.js',
      instances: 1,
      autorestart: true,
      max_restarts: 20,
      restart_delay: 3000,
    },
    {
      name: 'oshxona-api',
      script: 'api/app.js',
      instances: 1,
      autorestart: true,
      max_restarts: 20,
      restart_delay: 3000,
    },
  ],
};

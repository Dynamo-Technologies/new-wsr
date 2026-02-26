/**
 * PM2 Configuration for EC2 Deployment
 * Start with: pm2 start ecosystem.config.cjs
 */
module.exports = {
  apps: [
    {
      name: 'dynamo-wsr',
      script: 'build/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      log_file: 'logs/combined.log',
      time: true,
      merge_logs: true
    }
  ]
};

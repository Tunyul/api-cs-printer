module.exports = {
  apps: [
    {
      name: 'cukong-api',
      script: 'server.js',
      cwd: '/var/www/html/cukong/be',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'development'
      ,  NOTIFY_TO_CUSTOMER: 'false'
      },
      env_development: {
        NODE_ENV: 'development',
        NOTIFY_TO_CUSTOMER: 'false'
      },
      env_production: {
        NODE_ENV: 'production'
      ,  NOTIFY_TO_CUSTOMER: 'false'
      }
    }
  ]
};

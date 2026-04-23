#!/bin/bash

# EC2 instance setup script for DAO Service (Ubuntu)
# This script is used in the Launch Template UserData

set -e

echo "=== DAO Service Deployment Started ==="

# Update system packages (Ubuntu uses apt)
apt-get update -y

# Install required packages
apt-get install -y curl git build-essential

# Install Node.js 18.x (Ubuntu)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Create application directory
mkdir -p /opt/daoservice
cd /opt/daoservice

# Clone the repository
git clone https://github.com/DasSurajKr/node-web-app.git .

# Install npm dependencies
npm install

# Create environment file
cat > .env << 'EOF'
DAO_PORT=3001
DB_HOST=${DB_ENDPOINT}
DB_USER=admin
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=mydb
NODE_ENV=production
EOF

# Install PM2 globally
npm install -g pm2

# Start DAO service with PM2
pm2 start daoService.js --name dao-service
pm2 save

# Setup PM2 startup script for Ubuntu
PM2_HOME=/home/ubuntu/.pm2 pm2 startup || true

# Configure service to start on reboot
chmod +x /etc/init.d/pm2
ln -s /root/.pm2 /etc/pm2

# Log completion
echo "=== DAO Service Deployment Completed ===" > /var/log/dao-deployment.log
date >> /var/log/dao-deployment.log

# Log completion
echo "=== DAO Service Deployment Completed ===" > /var/log/dao-deployment.log
date >> /var/log/dao-deployment.log

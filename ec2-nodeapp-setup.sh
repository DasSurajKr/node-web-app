#!/bin/bash

# EC2 instance setup script for NodeApp (Ubuntu)
# This script is used in the Launch Template UserData

set -e

echo "=== NodeApp Deployment Started ==="

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
mkdir -p /opt/nodeapp
cd /opt/nodeapp

# Clone the repository
git clone https://github.com/DasSurajKr/node-web-app.git .

# Install npm dependencies
npm install

# Create environment file
cat > .env << 'EOF'
PORT=3000
DAO_SERVICE_URL=http://dao-service-private-ip:3001
DB_HOST=${DB_ENDPOINT}
DB_USER=admin
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=mydb
NODE_ENV=production
EOF

# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start app.js --name node-app
pm2 save

# Setup PM2 startup script for Ubuntu
PM2_HOME=/home/ubuntu/.pm2 pm2 startup || true

# Configure application to start on reboot
chmod +x /etc/init.d/pm2
ln -s /root/.pm2 /etc/pm2

# Log completion
echo "=== NodeApp Deployment Completed ===" > /var/log/nodeapp-deployment.log
date >> /var/log/nodeapp-deployment.log

# Log completion
echo "=== NodeApp Deployment Completed ===" > /var/log/nodeapp-deployment.log
date >> /var/log/nodeapp-deployment.log

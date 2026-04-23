#!/bin/bash

# EC2 instance setup script for DAO Service
# This script is used in the Launch Template UserData

set -e

echo "=== DAO Service Deployment Started ==="

# Update system packages
yum update -y

# Install Node.js (from NodeSource repository)
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs git

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
pm2 startup

# Set up CloudWatch logs (optional)
yum install -y awslogs

# Configure service to start on reboot
echo "@reboot pm2 start /opt/daoservice/daoService.js --name dao-service" | crontab -

# Log completion
echo "=== DAO Service Deployment Completed ===" > /var/log/dao-deployment.log
date >> /var/log/dao-deployment.log

#!/bin/bash

# EC2 instance setup script for NodeApp
# This script is used in the Launch Template UserData

set -e

echo "=== NodeApp Deployment Started ==="

# Update system packages
yum update -y

# Install Node.js (from NodeSource repository)
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs git

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
pm2 startup

# Set up CloudWatch logs (optional)
yum install -y awslogs

# Configure application to start on reboot
echo "@reboot pm2 start /opt/nodeapp/app.js --name node-app" | crontab -

# Log completion
echo "=== NodeApp Deployment Completed ===" > /var/log/nodeapp-deployment.log
date >> /var/log/nodeapp-deployment.log

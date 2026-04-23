# Node.js Microservices Architecture on AWS

A production-ready microservices architecture with DAO service separation, load balancing, and RDS integration.

## 📋 Project Structure

```
some-proj/
├── app.js                      # Main NodeApp service (Port 3000)
├── daoService.js               # Data Access Object service (Port 3001)
├── userDAO.js                  # DAO class (deprecated - for reference)
├── package.json                # Dependencies & scripts
├── .env.example                # Environment variables template
├── setup.sh                    # Local setup script (Linux/Mac)
├── setup.bat                   # Local setup script (Windows)
├── deploy-guide.md             # Comprehensive deployment guide
├── aws-infrastructure.yaml     # CloudFormation IaC template
├── ec2-nodeapp-setup.sh        # EC2 UserData script for NodeApp
├── ec2-dao-setup.sh            # EC2 UserData script for DAO
└── README.md                   # This file
```

## 🏗️ Architecture

### Data Flow
```
Client → ALB (Port 80) → NodeApp (Port 3000) → DAO Service (Port 3001) → RDS
```

### Network Layout
- **Public Subnet**: ALB (receives traffic from Internet)
- **Private Subnet**: NodeApp & DAO Service (no direct Internet access)
- **RDS**: Accessible only from DAO Service

### Security Groups
| Component | Port | Source | Notes |
|-----------|------|--------|-------|
| ALB | 80, 443 | 0.0.0.0/0 | Public access |
| NodeApp | 3000 | ALB SG | Private access only |
| DAO | 3001 | NodeApp SG | Private access only |
| RDS | 3306 | DAO SG | Database access only |

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 16+
- npm or yarn

### Setup

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

**Windows:**
```bash
setup.bat
```

### Run Services

**Option 1: Both services together (Recommended)**
```bash
npm run start:both
```

**Option 2: Separate terminals**
```bash
# Terminal 1
npm run start:dao

# Terminal 2  
npm start
```

**Option 3: Individual**
```bash
node daoService.js
node app.js
```

### Test Endpoints

```bash
# Health checks
curl http://localhost:3000/health
curl http://localhost:3001/health

# Fetch users
curl http://localhost:3000/users

# Create user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe"}'

# Test DB connection
curl http://localhost:3000/db-test
```

## 🌍 AWS Deployment

### Prerequisites
- AWS Account
- AWS CLI configured
- EC2 key pair in your region
- RDS-compatible security setup

### Step 1: Deploy Infrastructure

```bash
aws cloudformation create-stack \
  --stack-name node-app-stack \
  --template-body file://aws-infrastructure.yaml \
  --parameters \
    ParameterKey=EC2KeyPair,ParameterValue=your-key-pair \
    ParameterKey=DBPassword,ParameterValue=SecurePassword123! \
    ParameterKey=DBName,ParameterValue=mydb \
  --region us-east-1
```

### Step 2: Monitor Stack Creation

```bash
aws cloudformation describe-stacks \
  --stack-name node-app-stack \
  --query 'Stacks[0].StackStatus' \
  --region us-east-1
```

### Step 3: Get Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name node-app-stack \
  --query 'Stacks[0].Outputs' \
  --region us-east-1
```

### Step 4: Launch Instances

**For NodeApp:**
```bash
aws ec2 run-instances \
  --launch-template LaunchTemplateName=node-app-template \
  --instance-type t3.micro \
  --subnet-id subnet-xxxxx \
  --security-group-ids sg-xxxxx \
  --region us-east-1
```

**For DAO Service:**
```bash
aws ec2 run-instances \
  --launch-template LaunchTemplateName=dao-service-template \
  --instance-type t3.micro \
  --subnet-id subnet-yyyyy \
  --security-group-ids sg-yyyyy \
  --region us-east-1
```

## 📊 Services Overview

### NodeApp (app.js)
- **Port**: 3000
- **Environment**: Private Subnet
- **Responsibilities**:
  - Receive requests from ALB
  - Route requests to DAO Service
  - Return responses to client

#### Routes:
- `GET /health` - Health check
- `GET /` - Server info
- `GET /ping` - Ping test
- `GET /users` - Fetch users (via DAO)
- `POST /users` - Create user (via DAO)
- `GET /info` - System info
- `GET /db-test` - Test DB connection (via DAO)

### DAO Service (daoService.js)
- **Port**: 3001
- **Environment**: Private Subnet
- **Responsibilities**:
  - Handle all database operations
  - Isolate database logic from business logic
  - Provide REST API for data operations

#### Routes:
- `GET /health` - Service health & DB status
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user
- `DELETE /users/:id` - Delete user
- `GET /db-status` - Database connectivity test

## 🔐 Environment Variables

### NodeApp (.env)
```env
PORT=3000
DAO_SERVICE_URL=http://dao-service-ip:3001
DB_HOST=rds-endpoint.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=secure_password
DB_NAME=mydb
NODE_ENV=production
```

### DAO Service (.env)
```env
DAO_PORT=3001
DB_HOST=rds-endpoint.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=secure_password
DB_NAME=mydb
NODE_ENV=production
```

## 📈 Scaling & Auto-Recovery

### Auto Scaling Groups
The CloudFormation template creates launch templates for both services. Configure ASG:

```bash
# NodeApp ASG
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name node-app-asg \
  --launch-template LaunchTemplateName=node-app-template \
  --min-size 1 --max-size 3 --desired-capacity 2 \
  --target-group-arns arn:aws:elasticloadbalancing:region:account-id:targetgroup/node-app-tg/xxx \
  --vpc-zone-identifier subnet-xxxxx,subnet-yyyyy
```

### Health Checks
- **NodeApp**: GET /health (30s interval)
- **DAO**: GET /health (EC2 health check)
- **Unhealthy instances**: Automatically replaced

## 🐛 Troubleshooting

### Check NodeApp logs
```bash
# SSH into instance
ssh -i your-key.pem ec2-user@instance-ip

# View PM2 logs
pm2 logs node-app
tail -f /var/log/nodeapp-deployment.log
```

### Check DAO logs
```bash
pm2 logs dao-service
tail -f /var/log/dao-deployment.log
```

### Verify connectivity
```bash
# From NodeApp instance to DAO
curl http://dao-service-ip:3001/health

# From DAO instance to RDS
mysql -h rds-endpoint -u admin -p
```

### Check Security Groups
```bash
aws ec2 describe-security-groups --region us-east-1
```

## 📝 Database Setup

The RDS instance is automatically created by CloudFormation with:
- **Engine**: MySQL 8.0
- **Instance Class**: db.t3.micro
- **Allocated Storage**: 20GB
- **Database Name**: mydb

### Initialize Database (Run once)
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to AWS
        run: |
          aws s3 cp . s3://your-bucket --recursive
          aws cloudformation update-stack ...
```

## 💰 Cost Estimation

- **ALB**: ~$16/month
- **EC2 (t3.micro x2)**: ~$10/month
- **RDS (db.t3.micro)**: ~$20/month
- **Data Transfer**: Variable
- **Total**: ~$46/month (approximate)

*Note: EC2 and RDS may be covered by AWS Free Tier for first year*

## 🛠️ Maintenance

### Update Application
1. Update code in repository
2. Terminate old instances
3. New instances auto-launch from updated launch templates

### Database Backups
- Automated daily backups (7-day retention)
- Manual snapshots before major changes

### Monitoring
Set up CloudWatch alarms for:
- CPU utilization
- Memory usage
- HTTP 5xx errors
- Database connection errors

## 📚 Additional Resources

- [AWS VPC Documentation](https://docs.aws.amazon.com/vpc/)
- [CloudFormation User Guide](https://docs.aws.amazon.com/cloudformation/)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [Express.js Documentation](https://expressjs.com/)
- [MySQL Documentation](https://dev.mysql.com/doc/)

## 📄 License

MIT

## 👥 Support

For issues or questions, create a GitHub issue or contact the team.

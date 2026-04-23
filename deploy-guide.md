# AWS Deployment Guide: Microservices Architecture

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   AWS VPC (10.0.0.0/16)                     │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Public Subnet (10.0.1.0/24)                │   │
│  │                                                        │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │         Application Load Balancer              │  │   │
│  │  │        (Port 80/443 - Open to Internet)       │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                    │
│                          │ (Routes to Port 3000)             │
│                          ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Private Subnet (10.0.2.0/24)               │   │
│  │                                                        │   │
│  │  ┌──────────────────────┐  ┌──────────────────────┐  │   │
│  │  │   NodeApp Instance   │  │   DAO Service        │  │   │
│  │  │   (Port 3000)        │─→│   (Port 3001)        │  │   │
│  │  │                      │  │                      │  │   │
│  │  │  [ALB Security       │  │  [DAO Security       │  │   │
│  │  │   Group Access]      │  │   Group Access]      │  │   │
│  │  └──────────────────────┘  └──────────────────────┘  │   │
│  │                                       │               │   │
│  │                                       ▼               │   │
│  │                          ┌──────────────────────┐     │   │
│  │                          │  RDS MySQL Database  │     │   │
│  │                          │  (Port 3306)         │     │   │
│  │                          │ [RDS Security Group] │     │   │
│  │                          └──────────────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Security Groups

### ALB Security Group
- **Inbound**: Port 80/443 from 0.0.0.0/0 (Internet)
- **Outbound**: All traffic

### App Security Group
- **Inbound**: Port 3000 from ALB Security Group, Port 3000 from Private Subnet
- **Outbound**: All traffic

### DAO Security Group
- **Inbound**: Port 3001 from App Security Group, Port 3001 from Private Subnet
- **Outbound**: All traffic

### RDS Security Group
- **Inbound**: Port 3306 from DAO Security Group
- **Outbound**: Not required for RDS inbound rules

## Deployment Steps

### 1. Prerequisites
- AWS Account with appropriate permissions
- EC2 key pair created in your region
- AWS CLI configured

### 2. Deploy CloudFormation Stack

**For Ubuntu (Recommended):**
```bash
aws cloudformation create-stack \
  --stack-name node-app-stack \
  --template-body file://aws-infrastructure.yaml \
  --parameters \
    ParameterKey=EC2KeyPair,ParameterValue=your-keypair-name \
    ParameterKey=DBPassword,ParameterValue=YourSecurePassword123! \
    ParameterKey=InstanceOS,ParameterValue=ubuntu \
  --region us-east-1
```

**For Amazon Linux:**
```bash
aws cloudformation create-stack \
  --stack-name node-app-stack \
  --template-body file://aws-infrastructure.yaml \
  --parameters \
    ParameterKey=EC2KeyPair,ParameterValue=your-keypair-name \
    ParameterKey=DBPassword,ParameterValue=YourSecurePassword123! \
    ParameterKey=InstanceOS,ParameterValue=amazon \
  --region us-east-1
```

### 3. Verify Stack Creation

```bash
aws cloudformation describe-stacks \
  --stack-name node-app-stack \
  --region us-east-1
```

### 4. Get Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name node-app-stack \
  --query 'Stacks[0].Outputs' \
  --region us-east-1
```

## Launch Template Usage

### Create Auto Scaling Group for NodeApp

```bash
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name node-app-asg \
  --launch-template LaunchTemplateName=node-app-template,Version='$Latest' \
  --min-size 1 \
  --max-size 3 \
  --desired-capacity 2 \
  --target-group-arns arn:aws:elasticloadbalancing:region:account-id:targetgroup/node-app-tg/id \
  --vpc-zone-identifier subnet-xxxxx,subnet-yyyyy \
  --health-check-type ELB \
  --health-check-grace-period 300
```

### Create Auto Scaling Group for DAO Service

```bash
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name dao-service-asg \
  --launch-template LaunchTemplateName=dao-service-template,Version='$Latest' \
  --min-size 1 \
  --max-size 2 \
  --desired-capacity 1 \
  --vpc-zone-identifier subnet-xxxxx \
  --health-check-type EC2 \
  --health-check-grace-period 300
```

## Environment Variables in EC2 Instances

### NodeApp (.env)
```
PORT=3000
DAO_SERVICE_URL=http://internal-dao-service-ip:3001
DB_HOST=node-app-db.xxxxx.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=YourSecurePassword123!
DB_NAME=mydb
```

### DAO Service (.env)
```
DAO_PORT=3001
DB_HOST=node-app-db.xxxxx.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=YourSecurePassword123!
DB_NAME=mydb
```

## Testing the Architecture

### 1. Get ALB DNS Name
```bash
aws elbv2 describe-load-balancers \
  --query 'LoadBalancers[0].DNSName' \
  --region us-east-1
```

### 2. Test Health Check
```bash
curl http://{ALB_DNS_NAME}/health
```

### 3. Test API Endpoints
```bash
# Get users
curl http://{ALB_DNS_NAME}/users

# Create user
curl -X POST http://{ALB_DNS_NAME}/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe"}'

# Test DB connection
curl http://{ALB_DNS_NAME}/db-test
```

## Scaling & Auto-Recovery

- **Auto Scaling**: Automatically scales instances based on CPU/memory metrics
- **Health Checks**: ALB performs health checks every 30 seconds
- **Replacement**: Unhealthy instances are terminated and new ones launched
- **Load Balancing**: Traffic distributed across multiple NodeApp instances

## Cost Optimization Tips

1. Use `t3.micro` for low traffic (eligible for free tier if within 1-year free usage)
2. Set appropriate Auto Scaling policies based on demand
3. Use RDS read replicas for high-traffic scenarios
4. Implement CloudWatch alarms for cost monitoring

## Troubleshooting

### Check Instance Logs
```bash
aws ssm start-session --target i-xxxxxxxx

# Inside instance
cat /var/log/messages | grep nodeapp
pm2 logs node-app
pm2 logs dao-service
```

### Verify Security Groups
```bash
aws ec2 describe-security-groups --region us-east-1
```

### Check RDS Connectivity
```bash
mysql -h {RDS_ENDPOINT} -u admin -p
```

## Next Steps

1. Set up CI/CD pipeline (GitHub Actions, CodePipeline)
2. Implement monitoring with CloudWatch
3. Add SSL/TLS certificates via AWS Certificate Manager
4. Configure NAT Gateway for DAO service outbound traffic
5. Implement database backups and disaster recovery

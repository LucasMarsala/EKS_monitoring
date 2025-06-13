# EKS Monitoring

A monitoring solution for Amazon EKS (Elastic Kubernetes Service) clusters using AWS Lambda and the AWS SDK. This project provides automated monitoring and alerting capabilities for EKS clusters.

## 🛠️ Prerequisites

- AWS Account with appropriate permissions
- Node.js runtime
- AWS CLI configured
- Access to EKS clusters

## 📁 Project Structure

```
.
├── index.mjs                 # Main Lambda function code
├── aws-sdk-layer.zip         # AWS SDK Lambda layer
└── EKS_monitoring_policy.json # IAM policy for monitoring
```

## 🚀 Quick Start

1. Clone the repository:
```bash
git clone https://github.com/LucasMarsala/EKS_monitoring.git
cd EKS_monitoring
```

2. Configure AWS credentials:
```bash
aws configure
```

3. Deploy the Lambda function:
```bash
# Create the Lambda function
aws lambda create-function \
    --function-name eks-monitoring \
    --runtime nodejs18.x \
    --handler index.handler \
    --zip-file fileb://aws-sdk-layer.zip \
    --role arn:aws:iam::<your-account-id>:role/eks-monitoring-role
```

## 🔧 Features

- EKS cluster monitoring
- Automated metrics collection
- Custom alerting rules
- AWS Lambda integration
- IAM policy management

## ⚙️ Configuration

### IAM Policy
The `EKS_monitoring_policy.json` file contains the necessary permissions for the monitoring function:
- EKS cluster access
- CloudWatch metrics permissions
- Lambda execution permissions

### Lambda Function
The `index.mjs` file contains the main monitoring logic:
- Cluster health checks
- Metric collection
- Alert generation

## 🛠️ Technologies Used

- JavaScript (100%)
- AWS SDK
- AWS Lambda
- Amazon EKS
- CloudWatch

## 📊 Monitoring Metrics

The solution monitors various EKS metrics:
- Cluster health status
- Node group status
- Pod health
- Resource utilization
- Error rates

## 🔐 Security

- IAM role-based access control
- Secure AWS SDK integration
- Encrypted communication
- Least privilege principle

## 🚨 Alerts

The monitoring system can trigger alerts for:
- Cluster health issues
- Resource constraints
- Performance degradation
- Security events

## 📝 Usage

1. Deploy the Lambda function
2. Configure monitoring parameters
3. Set up CloudWatch alarms
4. Monitor the EKS clusters

## 🔄 Maintenance

Regular maintenance tasks:
- Update AWS SDK layer
- Review IAM permissions
- Monitor Lambda execution
- Check CloudWatch logs

---
⭐ Don't forget to star this repository if you found it useful!

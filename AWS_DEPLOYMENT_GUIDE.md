# AWS Deployment Guide for Mana Project

## Overview
This guide will help you deploy your entire Mana project (Backend API, Web App, and Mobile App) to AWS.

## Architecture
- **Backend API**: AWS Elastic Beanstalk
- **Web App**: AWS Amplify
- **Database**: AWS RDS (MongoDB/PostgreSQL)
- **File Storage**: AWS S3
- **CDN**: AWS CloudFront
- **Domain**: AWS Route 53

## Prerequisites
1. AWS Account
2. AWS CLI installed and configured
3. Node.js and npm installed
4. Git repository

## Step 1: Backend API Deployment (Elastic Beanstalk)

### 1.1 Install EB CLI
```bash
pip install awsebcli
```

### 1.2 Initialize EB Application
```bash
cd backend
eb init
```
- Choose your region
- Create new application: `mana-backend`
- Choose Node.js platform
- Choose Node.js 18.x

### 1.3 Create Environment
```bash
eb create mana-backend-prod
```

### 1.4 Set Environment Variables
```bash
eb setenv NODE_ENV=production
eb setenv MONGODB_URI=your_mongodb_connection_string
eb setenv JWT_SECRET=your_jwt_secret
eb setenv AWS_ACCESS_KEY_ID=your_aws_access_key
eb setenv AWS_SECRET_ACCESS_KEY=your_aws_secret_key
eb setenv AWS_REGION=your_aws_region
```

### 1.5 Deploy
```bash
eb deploy
```

## Step 2: Database Setup (AWS RDS)

### 2.1 Create RDS Instance
1. Go to AWS RDS Console
2. Create database
3. Choose MongoDB (if using MongoDB) or PostgreSQL
4. Choose t3.micro for development
5. Set up security groups to allow access from your EB environment

### 2.2 Update Backend Configuration
Update your backend's database connection to use the RDS endpoint.

## Step 3: S3 Setup for File Storage

### 3.1 Create S3 Bucket
```bash
aws s3 mb s3://mana-media-files
```

### 3.2 Configure CORS
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

### 3.3 Create IAM User for S3 Access
1. Create IAM user with S3 access
2. Generate access keys
3. Add to backend environment variables

## Step 4: Web App Deployment (AWS Amplify)

### 4.1 Connect Repository
1. Go to AWS Amplify Console
2. Connect your Git repository
3. Select the `packages/web` directory

### 4.2 Configure Build Settings
The `amplify.yml` file is already configured.

### 4.3 Set Environment Variables
- `NEXT_PUBLIC_API_URL`: Your backend API URL
- `NEXT_PUBLIC_S3_BUCKET`: Your S3 bucket name

### 4.4 Deploy
Amplify will automatically build and deploy your app.

## Step 5: Mobile App Configuration

### 5.1 Update API Configuration
Update `packages/mobile/src/config.js`:
```javascript
export const API_URL = 'https://your-backend-domain.com';
```

### 5.2 Update Web App Configuration
Update `packages/web/src/config.js`:
```javascript
export const API_URL = 'https://your-backend-domain.com';
```

## Step 6: Domain and SSL Setup

### 6.1 Custom Domain (Optional)
1. Purchase domain through Route 53 or external provider
2. Configure DNS settings
3. Set up SSL certificates through AWS Certificate Manager

### 6.2 Update CORS Settings
Update your backend CORS configuration to allow your domain.

## Step 7: Monitoring and Logging

### 7.1 CloudWatch
- Set up CloudWatch for monitoring
- Configure log groups for your applications

### 7.2 Health Checks
- Set up health check endpoints
- Configure monitoring alerts

## Cost Optimization

### Development Environment
- Use t3.micro instances
- Single instance deployment
- S3 Standard storage

### Production Environment
- Use t3.small or larger instances
- Multi-AZ deployment
- S3 Intelligent Tiering

## Security Best Practices

1. **Environment Variables**: Never commit secrets to Git
2. **IAM Roles**: Use least privilege principle
3. **Security Groups**: Restrict access to necessary ports only
4. **SSL/TLS**: Always use HTTPS in production
5. **Database**: Use private subnets for RDS

## Troubleshooting

### Common Issues
1. **CORS Errors**: Check CORS configuration in backend
2. **Database Connection**: Verify security group settings
3. **File Upload Issues**: Check S3 permissions
4. **Build Failures**: Check Amplify build logs

### Useful Commands
```bash
# Check EB status
eb status

# View EB logs
eb logs

# SSH into EB instance
eb ssh

# Check Amplify build status
aws amplify get-job --app-id your-app-id --branch-name main --job-id your-job-id
```

## Next Steps

1. Set up CI/CD pipelines
2. Configure monitoring and alerting
3. Set up backup strategies
4. Implement auto-scaling
5. Set up CDN for better performance

## Estimated Monthly Costs (Development)

- Elastic Beanstalk (t3.micro): ~$15-20
- RDS (t3.micro): ~$15-20
- S3 (1GB): ~$0.02
- Amplify: Free tier available
- CloudFront: Free tier available
- **Total**: ~$30-40/month

## Production Considerations

1. **Auto-scaling**: Configure based on traffic patterns
2. **Backup**: Set up automated backups
3. **Monitoring**: Implement comprehensive monitoring
4. **Security**: Regular security audits
5. **Performance**: Use CDN and caching strategies 
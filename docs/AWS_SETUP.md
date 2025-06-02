# AWS Integration Setup

This file contains instructions for setting up AWS integration with your infrastructure visualizer.

## Prerequisites

1. AWS Account with EC2 instances
2. AWS CLI installed and configured
3. Appropriate IAM permissions

## Setup Steps

### 1. Install AWS CLI (if not already installed)
```bash
# Download from: https://aws.amazon.com/cli/
# Or install via PowerShell:
winget install Amazon.AWSCLI
```

### 2. Configure AWS Credentials
```bash
aws configure
```
Enter your:
- AWS Access Key ID
- AWS Secret Access Key  
- Default region (e.g., us-east-1)
- Default output format (json)

### 3. Required IAM Permissions
Your AWS user/role needs the following permissions:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:DescribeInstances",
                "ec2:DescribeInstanceStatus",
                "ec2:DescribeTags"
            ],
            "Resource": "*"
        }
    ]
}
```

## Current Implementation

The current implementation uses **mock data** that simulates real EC2 instances. This is perfect for:
- Development and testing
- Demonstrations
- Environments without AWS access

### Mock Data Features
- Realistic EC2 instance information
- Different instance states (running, stopped)
- Instance types, IPs, and metadata
- Environment tags (Production, Development)

## Switching to Real AWS Data

To connect to real EC2 instances, you'll need to:

1. **Create a backend API** (Node.js/Express, Python/Flask, etc.) that:
   - Uses AWS SDK server-side
   - Fetches EC2 data via AWS APIs
   - Serves data to your frontend

2. **Update the frontend** to call your backend API instead of using mock data

3. **Handle authentication** securely (never put AWS credentials in frontend code)

### Example Backend Implementation (Node.js)
```javascript
const AWS = require('aws-sdk');
const express = require('express');

const ec2 = new AWS.EC2({ region: 'us-east-1' });
const app = express();

app.get('/api/ec2-instances', async (req, res) => {
    try {
        const params = { MaxResults: 100 };
        const data = await ec2.describeInstances(params).promise();
        
        const instances = [];
        data.Reservations.forEach(reservation => {
            instances.push(...reservation.Instances);
        });
        
        res.json(instances);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Backend API running on port 3000');
});
```

## Security Best Practices

1. **Never commit AWS credentials** to version control
2. **Use IAM roles** when running on EC2
3. **Implement least privilege access**
4. **Use temporary credentials** when possible
5. **Enable AWS CloudTrail** for audit logging

## Regions and Availability Zones

The visualizer automatically displays:
- Instance region information
- Availability zone placement
- VPC and subnet details

## Status Mapping

EC2 Instance States → Visualizer Status:
- `running` → 🟢 online
- `pending`, `stopping`, `rebooting` → 🟡 warning  
- `stopped`, `terminated` → 🔴 offline

## Troubleshooting

### Common Issues:
1. **No instances showing**: Check AWS credentials and permissions
2. **Connection timeout**: Verify region settings
3. **Access denied**: Review IAM permissions

### Debug Mode:
Open browser console (F12) to see detailed logs of:
- AWS service initialization
- Instance data fetching
- Error messages

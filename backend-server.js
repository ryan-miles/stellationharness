const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');
const { GCPService } = require('./gcp-integration');

const app = express();
const port = 3001;

// Enable CORS for frontend communication
app.use(cors());
app.use(express.json());

// Configure AWS SDK (uses default credential chain)
AWS.config.update({ region: 'us-east-1' });
const ec2 = new AWS.EC2();

// Initialize GCP service
const gcpService = new GCPService();

// Your specific instance details
const TARGET_INSTANCE_DNS = 'ec2-184-72-110-200.compute-1.amazonaws.com';
const TARGET_INSTANCE_ID = 'i-005557a2ed89a5759'; // From the AWS CLI output

// API endpoint to fetch your specific EC2 instance
app.get('/api/ec2-instance', async (req, res) => {
    try {
        console.log('Fetching EC2 instance data...');
        
        // Get instance details
        const params = {
            InstanceIds: [TARGET_INSTANCE_ID]
        };
        
        const data = await ec2.describeInstances(params).promise();
        
        if (data.Reservations.length === 0 || data.Reservations[0].Instances.length === 0) {
            return res.status(404).json({ error: 'Instance not found' });
        }
        
        const instance = data.Reservations[0].Instances[0];
        
        // Convert to our node format
        const nodeData = convertInstanceToNode(instance);
        
        console.log('Successfully fetched instance data:', nodeData.title);
        res.json(nodeData);
        
    } catch (error) {
        console.error('Error fetching EC2 instance:', error);
        res.status(500).json({ 
            error: 'Failed to fetch instance data',
            message: error.message 
        });
    }
});

// API endpoint to get instance status
app.get('/api/ec2-instance/status', async (req, res) => {
    try {
        const params = {
            InstanceIds: [TARGET_INSTANCE_ID]
        };
        
        const statusData = await ec2.describeInstanceStatus(params).promise();
        const instanceData = await ec2.describeInstances(params).promise();
        
        const instance = instanceData.Reservations[0].Instances[0];
        const status = statusData.InstanceStatuses[0] || {};
        
        res.json({
            instanceState: instance.State.Name,
            systemStatus: status.SystemStatus?.Status || 'unknown',
            instanceStatus: status.InstanceStatus?.Status || 'unknown',
            lastUpdated: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error fetching instance status:', error);
        res.status(500).json({ 
            error: 'Failed to fetch instance status',
            message: error.message 
        });
    }
});

// GCP API endpoint to fetch specific instance - now using real gcpapp01
app.get('/api/gcp-instance/:instanceName', async (req, res) => {
    try {
        console.log(`📡 Fetching real GCP instance...`);
        
        const { instanceName } = req.params;
        const { zone = 'us-east4-b', project = 'operating-pod-461417-t6' } = req.query;
        
        // Get instance details from GCP (with real data fallback)
        const instanceData = await gcpService.getInstanceDetails(instanceName, zone, project);
        
        console.log('✅ Successfully fetched GCP instance data');
        res.json(instanceData);
        
    } catch (error) {
        console.error('Error fetching GCP instance:', error);
        res.status(500).json({ 
            error: 'Failed to fetch GCP instance',
            message: error.message,
            hint: 'Using cached real instance data. Check GCP authentication if you need live data.'
        });
    }
});

// GCP API endpoint with default instance name
app.get('/api/gcp-instance', async (req, res) => {
    try {
        console.log(`📡 Fetching default GCP instance (finance-is)...`);
        
        const { zone = 'us-east4-b', project = 'operating-pod-461417-t6' } = req.query;
        
        // Get instance details from GCP (with real data fallback)
        const instanceData = await gcpService.getInstanceDetails('finance-is', zone, project);
        
        console.log('✅ Successfully fetched GCP instance data');
        res.json(instanceData);
        
    } catch (error) {
        console.error('Error fetching GCP instance:', error);
        res.status(500).json({ 
            error: 'Failed to fetch GCP instance',
            message: error.message,
            hint: 'Using cached real instance data. Check GCP authentication if you need live data.'
        });
    }
});

// Combined endpoint for all cloud instances
app.get('/api/all-instances', async (req, res) => {
    try {
        const instances = [];
        
        // Fetch AWS instance
        try {
            const awsParams = { InstanceIds: [TARGET_INSTANCE_ID] };
            const awsData = await ec2.describeInstances(awsParams).promise();
            const awsInstance = awsData.Reservations[0]?.Instances[0];
            if (awsInstance) {
                instances.push({
                    ...convertInstanceToNode(awsInstance),
                    cloudProvider: 'AWS',
                    dataSource: 'AWS API'
                });
            }
        } catch (awsError) {
            console.error('AWS fetch failed:', awsError.message);
        }          // Fetch real GCP instance: finance-is
        try {
            const gcpData = await gcpService.getInstanceDetails('finance-is', 'us-east4-b', 'operating-pod-461417-t6');
            instances.push({
                ...gcpService.convertToNodeFormat(gcpData),
                cloudProvider: 'GCP',
                dataSource: 'GCP API/Cache'
            });
        } catch (gcpError) {
            console.error('GCP fetch failed:', gcpError.message);
        }
        
        res.json(instances);
        
    } catch (error) {
        console.error('Error fetching instances:', error);
        res.status(500).json({ 
            error: 'Failed to fetch instances',
            message: error.message 
        });
    }
});

// Convert EC2 instance to our node format
function convertInstanceToNode(ec2Instance) {
    const nameTag = ec2Instance.Tags?.find(tag => tag.Key === 'Name');
    const environmentTag = ec2Instance.Tags?.find(tag => tag.Key === 'Environment');
    const applicationTag = ec2Instance.Tags?.find(tag => tag.Key === 'Application');
    
    // Determine status based on instance state
    let status = 'offline';
    switch (ec2Instance.State.Name) {
        case 'running':
            status = 'online';
            break;
        case 'pending':
        case 'stopping':
        case 'rebooting':
            status = 'warning';
            break;
        case 'stopped':
        case 'terminated':
        default:
            status = 'offline';
            break;
    }

    // Use a more descriptive title
    const title = nameTag?.Value || `EC2-${ec2Instance.InstanceId.slice(-8)}`;
    
    return {
        id: ec2Instance.InstanceId,
        type: 'EC2',
        title: title,
        hostname: ec2Instance.PublicDnsName || ec2Instance.PrivateDnsName || title.toLowerCase(),
        ip: ec2Instance.PublicIpAddress || ec2Instance.PrivateIpAddress || 'No IP assigned',
        status: status,
        position: { x: 300, y: 200 }, // Center position for the real instance
        metadata: {
            instanceType: ec2Instance.InstanceType,
            availabilityZone: ec2Instance.Placement?.AvailabilityZone,
            environment: environmentTag?.Value || 'Production',
            application: applicationTag?.Value || 'Unknown',
            launchTime: ec2Instance.LaunchTime,
            state: ec2Instance.State.Name,
            privateIp: ec2Instance.PrivateIpAddress,
            publicIp: ec2Instance.PublicIpAddress,
            publicDns: ec2Instance.PublicDnsName,
            privateDns: ec2Instance.PrivateDnsName,
            vpcId: ec2Instance.VpcId,
            subnetId: ec2Instance.SubnetId,
            securityGroups: ec2Instance.SecurityGroups?.map(sg => sg.GroupName).join(', '),
            architecture: ec2Instance.Architecture,
            platform: ec2Instance.Platform || 'Linux',
            monitoring: ec2Instance.Monitoring?.State || 'disabled',
            isRealInstance: true // Flag to indicate this is real data
        }
    };
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        targetInstance: TARGET_INSTANCE_DNS
    });
});

app.listen(port, () => {
    console.log(`🚀 AWS EC2 Backend API running on http://localhost:${port}`);
    console.log(`📡 Monitoring instance: ${TARGET_INSTANCE_DNS} (${TARGET_INSTANCE_ID})`);
    console.log(`🔍 API endpoints:`);
    console.log(`   GET /api/ec2-instance - Fetch instance data`);
    console.log(`   GET /api/ec2-instance/status - Get current status`);
    console.log(`   GET /api/health - Health check`);
});

module.exports = app;

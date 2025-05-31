const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');
const fs = require('fs').promises;
const path = require('path');
const { GCPService } = require('./gcp-integration');
const { AzureService } = require('./azure-integration');

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

// Initialize Azure service
const azureService = new AzureService();

// Configuration management
const CONFIG_FILE = path.join(__dirname, 'instances-config.json');
let instancesConfig = {};

// Load configuration on startup
async function loadConfig() {
    try {
        const configData = await fs.readFile(CONFIG_FILE, 'utf8');
        instancesConfig = JSON.parse(configData);
        console.log('✅ Loaded instances configuration');
    } catch (error) {
        console.error('⚠️ Could not load config file, using defaults:', error.message);
        instancesConfig = getDefaultConfig();
    }
}

function getDefaultConfig() {
    return {
        aws: {
            region: 'us-east-1',
            instances: [
                {
                    id: 'i-005557a2ed89a5759',
                    alias: 'AmLinApp-01',
                    description: 'Production web application server',
                    monitoringEnabled: true
                }
            ],
            autoDiscovery: { enabled: false }
        },
        gcp: {
            project: 'operating-pod-461417-t6',
            instances: [
                {
                    name: 'finance-is',
                    zone: 'us-east4-b',
                    alias: 'Finance System',
                    description: 'GCP production finance application',
                    monitoringEnabled: true
                }
            ]
        }
    };
}

// API endpoint to fetch ALL configured EC2 instances
app.get('/api/ec2-instances', async (req, res) => {
    try {
        console.log('Fetching all configured EC2 instances...');
        
        const instances = [];
        const awsConfig = instancesConfig.aws || {};
        
        // Process configured instances
        for (const instanceConfig of awsConfig.instances || []) {
            if (!instanceConfig.monitoringEnabled) continue;
            
            try {
                const params = { InstanceIds: [instanceConfig.id] };
                const data = await ec2.describeInstances(params).promise();
                
                if (data.Reservations.length > 0 && data.Reservations[0].Instances.length > 0) {
                    const instance = data.Reservations[0].Instances[0];
                    const nodeData = convertInstanceToNode(instance, instanceConfig);
                    instances.push(nodeData);
                    console.log(`✅ Fetched: ${nodeData.title} (${instanceConfig.id})`);
                }
            } catch (error) {
                console.error(`❌ Failed to fetch ${instanceConfig.id}:`, error.message);
            }
        }
        
        // Auto-discovery if enabled
        if (awsConfig.autoDiscovery?.enabled) {
            try {
                const discoveredInstances = await discoverEC2Instances(awsConfig.autoDiscovery.filters);
                instances.push(...discoveredInstances);
                console.log(`🔍 Auto-discovered ${discoveredInstances.length} additional instances`);
            } catch (error) {
                console.error('Auto-discovery failed:', error.message);
            }
        }
        
        console.log(`📊 Returning ${instances.length} EC2 instances`);
        res.json(instances);
        
    } catch (error) {
        console.error('Error fetching EC2 instances:', error);
        res.status(500).json({ 
            error: 'Failed to fetch instances',
            message: error.message 
        });
    }
});

// API endpoint to fetch a single EC2 instance (backward compatibility)
app.get('/api/ec2-instance', async (req, res) => {
    try {
        console.log('Fetching primary EC2 instance...');
        
        const awsConfig = instancesConfig.aws || {};
        const primaryInstance = awsConfig.instances?.[0];
        
        if (!primaryInstance) {
            return res.status(404).json({ error: 'No primary instance configured' });
        }
        
        const params = { InstanceIds: [primaryInstance.id] };
        const data = await ec2.describeInstances(params).promise();
        
        if (data.Reservations.length === 0 || data.Reservations[0].Instances.length === 0) {
            return res.status(404).json({ error: 'Instance not found' });
        }
        
        const instance = data.Reservations[0].Instances[0];
        const nodeData = convertInstanceToNode(instance, primaryInstance);
        
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

// Auto-discovery function
async function discoverEC2Instances(filters = []) {
    const params = {
        Filters: filters.length > 0 ? filters : [
            { Name: 'instance-state-name', Values: ['running', 'stopped'] }
        ]
    };
    
    const data = await ec2.describeInstances(params).promise();
    const instances = [];
    
    for (const reservation of data.Reservations) {
        for (const instance of reservation.Instances) {
            // Skip if already in configured instances
            const isConfigured = instancesConfig.aws?.instances?.some(cfg => cfg.id === instance.InstanceId);
            if (!isConfigured) {
                const nodeData = convertInstanceToNode(instance, {
                    id: instance.InstanceId,
                    alias: `Auto-${instance.InstanceId.slice(-8)}`,
                    description: 'Auto-discovered instance',
                    monitoringEnabled: true
                });
                nodeData.metadata.autoDiscovered = true;
                instances.push(nodeData);
            }
        }
    }
      return instances;
}

// Azure discovery function
async function discoverAzureVMs(filters = {}) {
    const azureConfig = instancesConfig.azure || {};
    
    if (!azureService.initialized) {
        await azureService.initialize();
    }
    
    const discoveredVMs = await azureService.discoverVirtualMachines(
        azureConfig.subscriptionId || 'demo-subscription',
        azureConfig.resourceGroup || 'demo-resource-group',
        filters
    );
    
    const instances = [];
    
    for (const vm of discoveredVMs) {
        // Skip if already in configured instances
        const isConfigured = azureConfig.instances?.some(cfg => cfg.name === vm.name);
        if (!isConfigured) {
            const nodeData = azureService.convertVMToNodeData(vm, {
                alias: `Auto-${vm.name}`,
                description: 'Auto-discovered Azure VM'
            });
            nodeData.metadata.autoDiscovered = true;
            instances.push(nodeData);
        }
    }
    
    return instances;
}

// API endpoint to get instance status
app.get('/api/ec2-instance/status', async (req, res) => {
    try {
        const awsConfig = instancesConfig.aws || {};
        const primaryInstance = awsConfig.instances?.[0];
        
        if (!primaryInstance) {
            return res.status(404).json({ error: 'No primary instance configured' });
        }
        
        const params = { InstanceIds: [primaryInstance.id] };
        
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

// Configuration management endpoints
app.get('/api/config', (req, res) => {
    res.json(instancesConfig);
});

app.post('/api/config/aws/add-instance', async (req, res) => {
    try {
        const { instanceId, alias, description } = req.body;
        
        if (!instanceId) {
            return res.status(400).json({ error: 'Instance ID is required' });
        }
        
        // Verify the instance exists
        const params = { InstanceIds: [instanceId] };
        const data = await ec2.describeInstances(params).promise();
        
        if (data.Reservations.length === 0 || data.Reservations[0].Instances.length === 0) {
            return res.status(404).json({ error: 'Instance not found in AWS' });
        }
        
        const instance = data.Reservations[0].Instances[0];
        const nameTag = instance.Tags?.find(tag => tag.Key === 'Name');
        
        // Add to configuration
        if (!instancesConfig.aws) instancesConfig.aws = { instances: [] };
        if (!instancesConfig.aws.instances) instancesConfig.aws.instances = [];
        
        const newInstanceConfig = {
            id: instanceId,
            alias: alias || nameTag?.Value || `Instance-${instanceId.slice(-8)}`,
            description: description || 'Added via API',
            monitoringEnabled: true,
            addedAt: new Date().toISOString()
        };
        
        // Check if already exists
        const exists = instancesConfig.aws.instances.find(inst => inst.id === instanceId);
        if (exists) {
            return res.status(409).json({ error: 'Instance already configured' });
        }
        
        instancesConfig.aws.instances.push(newInstanceConfig);
        
        // Save configuration
        await fs.writeFile(CONFIG_FILE, JSON.stringify(instancesConfig, null, 2));
        
        console.log(`✅ Added new instance: ${newInstanceConfig.alias} (${instanceId})`);
        res.json({ 
            message: 'Instance added successfully',
            instance: newInstanceConfig
        });
        
    } catch (error) {
        console.error('Error adding instance:', error);
        res.status(500).json({ 
            error: 'Failed to add instance',
            message: error.message 
        });
    }
});

app.delete('/api/config/aws/remove-instance/:instanceId', async (req, res) => {
    try {
        const { instanceId } = req.params;
        
        if (!instancesConfig.aws?.instances) {
            return res.status(404).json({ error: 'No instances configured' });
        }
        
        const initialLength = instancesConfig.aws.instances.length;
        instancesConfig.aws.instances = instancesConfig.aws.instances.filter(inst => inst.id !== instanceId);
        
        if (instancesConfig.aws.instances.length === initialLength) {
            return res.status(404).json({ error: 'Instance not found in configuration' });
        }
        
        // Save configuration
        await fs.writeFile(CONFIG_FILE, JSON.stringify(instancesConfig, null, 2));
        
        console.log(`🗑️ Removed instance: ${instanceId}`);
        res.json({ message: 'Instance removed successfully' });
        
    } catch (error) {
        console.error('Error removing instance:', error);
        res.status(500).json({ 
            error: 'Failed to remove instance',
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
          // Fetch AWS instances
        try {
            const awsInstances = await fetchAWSInstances();
            instances.push(...awsInstances);
        } catch (awsError) {
            console.error('AWS fetch failed:', awsError.message);
        }
        
        // Fetch GCP instances
        try {
            const gcpInstances = await fetchGCPInstances();
            instances.push(...gcpInstances);
        } catch (gcpError) {
            console.error('GCP fetch failed:', gcpError.message);
        }
          // Fetch Azure instances (disabled - no live Azure resources currently)
        // try {
        //     const azureInstances = await fetchAzureInstances();
        //     instances.push(...azureInstances);
        // } catch (azureError) {
        //     console.error('Azure fetch failed:', azureError.message);
        // }
        
        res.json(instances);
        
    } catch (error) {
        console.error('Error fetching instances:', error);
        res.status(500).json({ 
            error: 'Failed to fetch instances',
            message: error.message 
        });
    }
});

async function fetchAWSInstances() {
    const instances = [];
    const awsConfig = instancesConfig.aws || {};
    
    for (const instanceConfig of awsConfig.instances || []) {
        // Skip if monitoring or visualization is disabled
        if (!instanceConfig.monitoringEnabled) continue;
        if (instanceConfig.visualizationEnabled === false) continue;
        
        try {
            const params = { InstanceIds: [instanceConfig.id] };
            const data = await ec2.describeInstances(params).promise();
            const awsInstance = data.Reservations[0]?.Instances[0];
            
            if (awsInstance) {
                instances.push({
                    ...convertInstanceToNode(awsInstance, instanceConfig),
                    cloudProvider: 'AWS',
                    dataSource: 'AWS API'
                });
            }
        } catch (error) {
            console.error(`Failed to fetch AWS instance ${instanceConfig.id}:`, error.message);
        }
    }
    
    return instances;
}

async function fetchGCPInstances() {
    const instances = [];
    const gcpConfig = instancesConfig.gcp || {};
    
    for (const instanceConfig of gcpConfig.instances || []) {
        if (!instanceConfig.monitoringEnabled) continue;
        
        try {
            const gcpData = await gcpService.getInstanceDetails(
                instanceConfig.name, 
                instanceConfig.zone, 
                gcpConfig.project
            );
            
            instances.push({
                ...gcpService.convertToNodeFormat(gcpData),
                cloudProvider: 'GCP',
                dataSource: 'GCP API/Cache'
            });
        } catch (error) {
            console.error(`Failed to fetch GCP instance ${instanceConfig.name}:`, error.message);
        }
    }
      return instances;
}

async function fetchAzureInstances() {
    const instances = [];
    const azureConfig = instancesConfig.azure || {};
    
    console.log('🔍 fetchAzureInstances: Starting Azure fetch...');
    console.log('🔍 Azure config:', JSON.stringify(azureConfig, null, 2));
    
    // Initialize Azure service if needed
    if (!azureService.initialized) {
        console.log('🔧 Initializing Azure service...');
        await azureService.initialize();
    }
    
    for (const instanceConfig of azureConfig.instances || []) {
        console.log('🔍 Processing Azure instance config:', instanceConfig);
        if (!instanceConfig.monitoringEnabled) {
            console.log('⚠️ Skipping disabled instance:', instanceConfig.name);
            continue;
        }
        
        try {
            console.log('🔍 Fetching Azure VM:', instanceConfig.name);
            const azureVM = await azureService.getVirtualMachine(
                azureConfig.subscriptionId || 'demo-subscription',
                azureConfig.resourceGroup || 'demo-resource-group', 
                instanceConfig.name
            );
            
            console.log('✅ Got Azure VM data:', azureVM.name);
            const nodeData = azureService.convertVMToNodeData(azureVM, instanceConfig);
            instances.push({
                ...nodeData,
                cloudProvider: 'Azure',
                dataSource: 'Azure Demo'
            });
            console.log('✅ Added Azure instance to results:', nodeData.title);
        } catch (error) {
            console.error(`❌ Failed to fetch Azure instance ${instanceConfig.name}:`, error.message);
        }
    }
    
    console.log(`🔍 fetchAzureInstances: Returning ${instances.length} Azure instances`);
    return instances;
}

// Convert EC2 instance to our node format
function convertInstanceToNode(ec2Instance, config = {}) {
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

    // Use configured alias or name tag or fallback
    const title = config.alias || nameTag?.Value || `EC2-${ec2Instance.InstanceId.slice(-8)}`;

    return {
        id: ec2Instance.InstanceId,
        type: 'EC2',
        title: title,
        hostname: ec2Instance.PublicDnsName || ec2Instance.PrivateDnsName || title.toLowerCase(),
        ip: ec2Instance.PublicIpAddress || ec2Instance.PrivateIpAddress || 'No IP assigned',
        status: status,
        position: { x: 300, y: 200 }, // Default position, frontend will adjust
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
            isRealInstance: true,
            configAlias: config.alias,
            configDescription: config.description
        }
    };
}

// Manual auto-discovery trigger endpoint
app.post('/api/discover-instances', async (req, res) => {
    try {
        console.log('🔍 Manual instance discovery triggered');
        
        const { enableAutoDiscovery, filters } = req.body;
        
        // Temporarily enable auto-discovery for this request if needed
        if (enableAutoDiscovery) {
            if (!instancesConfig.aws) {
                instancesConfig.aws = { instances: [] };
            }
            instancesConfig.aws.autoDiscovery = { 
                enabled: true, 
                filters: filters || [
                    { Name: 'instance-state-name', Values: ['running'] }
                ]
            };
        }
          const discoveredInstances = await discoverEC2Instances(
            instancesConfig.aws?.autoDiscovery?.filters
        );
        
        // Also discover Azure VMs if configured
        const azureDiscovered = await discoverAzureVMs({
            powerState: ['PowerState/running', 'PowerState/stopped']
        });
        
        console.log(`🔍 Discovered ${discoveredInstances.length} AWS instances and ${azureDiscovered.length} Azure VMs`);
        
        const allDiscovered = [...discoveredInstances, ...azureDiscovered];
        
        // Save newly discovered instances to config if requested
        if (enableAutoDiscovery && allDiscovered.length > 0) {
            // Process AWS instances
            for (const instance of discoveredInstances) {
                const newConfig = {
                    id: instance.id,
                    alias: instance.title,
                    description: instance.metadata.configDescription || 'Auto-discovered instance',
                    monitoringEnabled: true,
                    autoDiscovered: true
                };
                
                // Add to config if not already present
                const exists = instancesConfig.aws.instances.some(cfg => cfg.id === instance.id);
                if (!exists) {
                    instancesConfig.aws.instances.push(newConfig);
                }
            }
            
            // Process Azure VMs
            if (azureDiscovered.length > 0) {
                if (!instancesConfig.azure) {
                    instancesConfig.azure = { instances: [] };
                }
                
                for (const vm of azureDiscovered) {
                    const newConfig = {
                        name: vm.hostname || vm.title,
                        alias: vm.title,
                        description: vm.metadata.configDescription || 'Auto-discovered Azure VM',
                        monitoringEnabled: true,
                        autoDiscovered: true
                    };
                    
                    // Add to config if not already present
                    const exists = instancesConfig.azure.instances.some(cfg => cfg.name === newConfig.name);
                    if (!exists) {
                        instancesConfig.azure.instances.push(newConfig);
                    }
                }
            }
            
            // Save updated config
            await saveConfig();
            console.log('✅ Updated configuration with discovered instances');
        }
        
        res.json({
            success: true,
            discoveredInstances: allDiscovered,
            totalCount: allDiscovered.length,
            awsCount: discoveredInstances.length,
            azureCount: azureDiscovered.length,
            message: `Discovered ${allDiscovered.length} instances (${discoveredInstances.length} AWS, ${azureDiscovered.length} Azure)`
        });
        
    } catch (error) {
        console.error('Auto-discovery failed:', error);
        res.status(500).json({
            success: false,
            error: 'Auto-discovery failed',
            message: error.message
        });
    }
});

// Auto-discovery configuration endpoints
app.get('/api/auto-discovery/status', (req, res) => {
    const awsConfig = instancesConfig.aws || {};
    const autoDiscovery = awsConfig.autoDiscovery || { enabled: false };
    
    res.json({
        enabled: autoDiscovery.enabled,
        filters: autoDiscovery.filters || [],
        configuredInstances: awsConfig.instances?.length || 0,
        autoDiscoveredCount: awsConfig.instances?.filter(i => i.autoDiscovered).length || 0
    });
});

app.post('/api/auto-discovery/toggle', async (req, res) => {
    try {
        const { enabled, filters } = req.body;
        
        if (!instancesConfig.aws) {
            instancesConfig.aws = { instances: [] };
        }
        
        instancesConfig.aws.autoDiscovery = {
            enabled: Boolean(enabled),
            filters: filters || [
                { Name: 'instance-state-name', Values: ['running'] }
            ]
        };
        
        await saveConfig();
        
        res.json({
            success: true,
            autoDiscovery: instancesConfig.aws.autoDiscovery,
            message: `Auto-discovery ${enabled ? 'enabled' : 'disabled'}`
        });
        
    } catch (error) {
        console.error('Failed to toggle auto-discovery:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update auto-discovery settings',
            message: error.message
        });
    }
});

// Node visibility management endpoints
app.get('/api/instance-library', async (req, res) => {
    try {
        console.log('🔍 Fetching complete instance library...');
        
        const library = {
            aws: [],
            gcp: [],
            azure: [],
            summary: { total: 0, visible: 0, hidden: 0 }
        };
        
        // Fetch AWS instances with visibility status
        const awsConfig = instancesConfig.aws || {};
        for (const instanceConfig of awsConfig.instances || []) {
            try {
                const params = { InstanceIds: [instanceConfig.id] };
                const data = await ec2.describeInstances(params).promise();
                const awsInstance = data.Reservations[0]?.Instances[0];
                
                if (awsInstance) {
                    const nodeData = convertInstanceToNode(awsInstance, instanceConfig);
                    library.aws.push({
                        ...nodeData,
                        cloudProvider: 'AWS',
                        dataSource: 'AWS API',
                        isVisible: instanceConfig.visualizationEnabled !== false,
                        configId: instanceConfig.id
                    });
                }
            } catch (error) {
                console.error(`Failed to fetch AWS instance ${instanceConfig.id}:`, error.message);
                // Add as unavailable
                library.aws.push({
                    id: instanceConfig.id,
                    title: instanceConfig.alias || instanceConfig.id,
                    status: 'unavailable',
                    cloudProvider: 'AWS',
                    dataSource: 'Configuration',
                    isVisible: instanceConfig.visualizationEnabled !== false,
                    configId: instanceConfig.id,
                    error: 'Instance not accessible'
                });
            }
        }
        
        // Fetch GCP instances with visibility status
        const gcpConfig = instancesConfig.gcp || {};
        for (const instanceConfig of gcpConfig.instances || []) {
            try {
                const gcpData = await gcpService.getInstanceDetails(
                    instanceConfig.name,
                    instanceConfig.zone,
                    gcpConfig.project
                );
                
                library.gcp.push({
                    ...gcpService.convertToNodeFormat(gcpData),
                    cloudProvider: 'GCP',
                    dataSource: 'GCP API/Cache',
                    isVisible: instanceConfig.visualizationEnabled !== false,
                    configId: instanceConfig.name
                });
            } catch (error) {
                console.error(`Failed to fetch GCP instance ${instanceConfig.name}:`, error.message);
                library.gcp.push({
                    id: instanceConfig.name,
                    title: instanceConfig.alias || instanceConfig.name,
                    status: 'unavailable',
                    cloudProvider: 'GCP',
                    dataSource: 'Configuration',
                    isVisible: instanceConfig.visualizationEnabled !== false,
                    configId: instanceConfig.name,
                    error: 'Instance not accessible'
                });
            }
        }
        
        // Calculate summary
        const allInstances = [...library.aws, ...library.gcp, ...library.azure];
        library.summary = {
            total: allInstances.length,
            visible: allInstances.filter(i => i.isVisible).length,
            hidden: allInstances.filter(i => !i.isVisible).length
        };
        
        console.log(`📊 Instance library: ${library.summary.total} total, ${library.summary.visible} visible`);
        res.json(library);
        
    } catch (error) {
        console.error('Error fetching instance library:', error);
        res.status(500).json({
            error: 'Failed to fetch instance library',
            message: error.message
        });
    }
});

app.post('/api/instance-library/toggle-visibility', async (req, res) => {
    try {
        const { provider, instanceId, visible } = req.body;
        
        if (!provider || !instanceId || typeof visible !== 'boolean') {
            return res.status(400).json({
                error: 'Missing required parameters: provider, instanceId, visible'
            });
        }
        
        console.log(`🔧 Toggling visibility for ${provider}:${instanceId} to ${visible}`);
        
        let updated = false;
        
        // Update AWS instance visibility
        if (provider === 'aws' && instancesConfig.aws?.instances) {
            const instance = instancesConfig.aws.instances.find(i => i.id === instanceId);
            if (instance) {
                instance.visualizationEnabled = visible;
                updated = true;
            }
        }
        
        // Update GCP instance visibility  
        if (provider === 'gcp' && instancesConfig.gcp?.instances) {
            const instance = instancesConfig.gcp.instances.find(i => i.name === instanceId);
            if (instance) {
                instance.visualizationEnabled = visible;
                updated = true;
            }
        }
        
        // Update Azure instance visibility
        if (provider === 'azure' && instancesConfig.azure?.instances) {
            const instance = instancesConfig.azure.instances.find(i => i.name === instanceId);
            if (instance) {
                instance.visualizationEnabled = visible;
                updated = true;
            }
        }
        
        if (!updated) {
            return res.status(404).json({
                error: 'Instance not found in configuration'
            });
        }
        
        // Save configuration
        await saveConfig();
        
        res.json({
            success: true,
            message: `Instance ${instanceId} visibility updated to ${visible}`,
            provider,
            instanceId,
            visible
        });
        
    } catch (error) {
        console.error('Error toggling instance visibility:', error);
        res.status(500).json({
            error: 'Failed to toggle instance visibility',
            message: error.message
        });
    }
});

app.post('/api/instance-library/bulk-toggle', async (req, res) => {
    try {
        const { instances, visible } = req.body;
        
        if (!Array.isArray(instances) || typeof visible !== 'boolean') {
            return res.status(400).json({
                error: 'Invalid parameters: instances must be array, visible must be boolean'
            });
        }
        
        console.log(`🔧 Bulk toggling ${instances.length} instances to ${visible}`);
        
        let updatedCount = 0;
        
        for (const { provider, instanceId } of instances) {
            // Update AWS instances
            if (provider === 'aws' && instancesConfig.aws?.instances) {
                const instance = instancesConfig.aws.instances.find(i => i.id === instanceId);
                if (instance) {
                    instance.visualizationEnabled = visible;
                    updatedCount++;
                }
            }
            
            // Update GCP instances
            if (provider === 'gcp' && instancesConfig.gcp?.instances) {
                const instance = instancesConfig.gcp.instances.find(i => i.name === instanceId);
                if (instance) {
                    instance.visualizationEnabled = visible;
                    updatedCount++;
                }
            }
            
            // Update Azure instances
            if (provider === 'azure' && instancesConfig.azure?.instances) {
                const instance = instancesConfig.azure.instances.find(i => i.name === instanceId);
                if (instance) {
                    instance.visualizationEnabled = visible;
                    updatedCount++;
                }
            }
        }
        
        // Save configuration
        await saveConfig();
        
        res.json({
            success: true,
            message: `Updated visibility for ${updatedCount} instances`,
            updatedCount,
            totalRequested: instances.length
        });
        
    } catch (error) {
        console.error('Error bulk toggling instance visibility:', error);
        res.status(500).json({
            error: 'Failed to bulk toggle instance visibility',
            message: error.message
        });
    }
});

// Update existing all-instances endpoint to respect visibility settings
app.get('/api/all-instances', async (req, res) => {
    try {
        const instances = [];
        
        // Fetch AWS instances
        try {
            const awsInstances = await fetchAWSInstances();
            instances.push(...awsInstances);
        } catch (awsError) {
            console.error('AWS fetch failed:', awsError.message);
        }
        
        // Fetch GCP instances
        try {
            const gcpInstances = await fetchGCPInstances();
            instances.push(...gcpInstances);
        } catch (gcpError) {
            console.error('GCP fetch failed:', gcpError.message);
        }
          // Fetch Azure instances (disabled - no live Azure resources currently)
        // try {
        //     const azureInstances = await fetchAzureInstances();
        //     instances.push(...azureInstances);
        // } catch (azureError) {
        //     console.error('Azure fetch failed:', azureError.message);
        // }
        
        // Filter instances based on visibility
        const visibleInstances = instances.filter(i => i.isVisible !== false);
        
        res.json(visibleInstances);
        
    } catch (error) {
        console.error('Error fetching instances:', error);
        res.status(500).json({ 
            error: 'Failed to fetch instances',
            message: error.message 
        });
    }
});

async function fetchAWSInstances() {
    const instances = [];
    const awsConfig = instancesConfig.aws || {};
    
    for (const instanceConfig of awsConfig.instances || []) {
        if (!instanceConfig.monitoringEnabled) continue;
        
        try {
            const params = { InstanceIds: [instanceConfig.id] };
            const data = await ec2.describeInstances(params).promise();
            const awsInstance = data.Reservations[0]?.Instances[0];
            
            if (awsInstance) {
                instances.push({
                    ...convertInstanceToNode(awsInstance, instanceConfig),
                    cloudProvider: 'AWS',
                    dataSource: 'AWS API'
                });
            }
        } catch (error) {
            console.error(`Failed to fetch AWS instance ${instanceConfig.id}:`, error.message);
        }
    }
    
    return instances;
}

async function fetchGCPInstances() {
    const instances = [];
    const gcpConfig = instancesConfig.gcp || {};
    
    for (const instanceConfig of gcpConfig.instances || []) {
        if (!instanceConfig.monitoringEnabled) continue;
        
        try {
            const gcpData = await gcpService.getInstanceDetails(
                instanceConfig.name, 
                instanceConfig.zone, 
                gcpConfig.project
            );
            
            instances.push({
                ...gcpService.convertToNodeFormat(gcpData),
                cloudProvider: 'GCP',
                dataSource: 'GCP API/Cache'
            });
        } catch (error) {
            console.error(`Failed to fetch GCP instance ${instanceConfig.name}:`, error.message);
        }
    }
      return instances;
}

async function fetchAzureInstances() {
    const instances = [];
    const azureConfig = instancesConfig.azure || {};
    
    console.log('🔍 fetchAzureInstances: Starting Azure fetch...');
    console.log('🔍 Azure config:', JSON.stringify(azureConfig, null, 2));
    
    // Initialize Azure service if needed
    if (!azureService.initialized) {
        console.log('🔧 Initializing Azure service...');
        await azureService.initialize();
    }
    
    for (const instanceConfig of azureConfig.instances || []) {
        console.log('🔍 Processing Azure instance config:', instanceConfig);
        if (!instanceConfig.monitoringEnabled) {
            console.log('⚠️ Skipping disabled instance:', instanceConfig.name);
            continue;
        }
        
        try {
            console.log('🔍 Fetching Azure VM:', instanceConfig.name);
            const azureVM = await azureService.getVirtualMachine(
                azureConfig.subscriptionId || 'demo-subscription',
                azureConfig.resourceGroup || 'demo-resource-group', 
                instanceConfig.name
            );
            
            console.log('✅ Got Azure VM data:', azureVM.name);
            const nodeData = azureService.convertVMToNodeData(azureVM, instanceConfig);
            instances.push({
                ...nodeData,
                cloudProvider: 'Azure',
                dataSource: 'Azure Demo'
            });
            console.log('✅ Added Azure instance to results:', nodeData.title);
        } catch (error) {
            console.error(`❌ Failed to fetch Azure instance ${instanceConfig.name}:`, error.message);
        }
    }
    
    console.log(`🔍 fetchAzureInstances: Returning ${instances.length} Azure instances`);
    return instances;
}

// Save configuration to file
async function saveConfig() {
    try {
        await fs.writeFile(CONFIG_FILE, JSON.stringify(instancesConfig, null, 2));
        console.log('✅ Configuration saved');
    } catch (error) {
        console.error('❌ Failed to save configuration:', error);
        throw error;
    }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    const awsConfig = instancesConfig.aws || {};
    const primaryInstance = awsConfig.instances?.[0];
    
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        configuredInstances: {
            aws: awsConfig.instances?.length || 0,
            gcp: instancesConfig.gcp?.instances?.length || 0
        },
        primaryInstance: primaryInstance?.alias || 'None configured'
    });
});

// Initialize configuration and start server
async function initializeServer() {
    await loadConfig();
    
    app.listen(port, () => {
        const awsConfig = instancesConfig.aws || {};
        const primaryInstance = awsConfig.instances?.[0];
        
        console.log(`🚀 Enhanced Multi-Cloud Backend API running on http://localhost:${port}`);
        console.log(`📡 AWS Instances Configured: ${awsConfig.instances?.length || 0}`);
        console.log(`📡 GCP Instances Configured: ${instancesConfig.gcp?.instances?.length || 0}`);
        if (primaryInstance) {
            console.log(`🎯 Primary Instance: ${primaryInstance.alias} (${primaryInstance.id})`);
        }        console.log(`🔍 Enhanced API endpoints:`);
        console.log(`   GET /api/ec2-instances - Fetch all configured EC2 instances`);
        console.log(`   GET /api/ec2-instance - Fetch primary instance (backward compatibility)`);
        console.log(`   GET /api/all-instances - Fetch all cloud instances`);
        console.log(`   POST /api/config/aws/add-instance - Add new AWS instance`);
        console.log(`   DELETE /api/config/aws/remove-instance/:id - Remove instance`);
        console.log(`   POST /api/discover-instances - Manual auto-discovery trigger`);
        console.log(`   GET /api/config - View current configuration`);
        console.log(`   GET /api/health - Health check`);
    });
}

// Start the server
initializeServer().catch(console.error);

module.exports = app;

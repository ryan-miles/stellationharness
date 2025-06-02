const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');
const fs = require('fs').promises;
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import services
const { GCPService } = require('./gcp-integration.js');
const { AzureService } = require('./azure-integration.js');

// Import security modules
const inputValidator = require('./security/input-validation.js');
const authManager = require('./security/auth-manager.js');
const configManager = require('./security/config-manager.js');

// **STANDARDIZED ERROR HANDLING UTILITIES**
const ErrorHandler = {
    // Standard error response format
    createErrorResponse(operation, error, statusCode = 500) {
        return {
            success: false,
            operation,
            error: error.message || 'Unknown error occurred',
            details: error.code || error.name || 'ErrorWithoutCode',
            timestamp: new Date().toISOString()
        };
    },

    // Standard success response format
    createSuccessResponse(operation, data, message = null) {
        return {
            success: true,
            operation,
            data,
            message: message || `${operation} completed successfully`,
            timestamp: new Date().toISOString()
        };
    },

    // Standard error logging
    logError(operation, error, context = {}) {
        console.error(`❌ [${operation}] Error:`, {
            message: error.message,
            code: error.code || 'NO_CODE',
            context,
            timestamp: new Date().toISOString()
        });
    },

    // Handle API endpoint errors consistently
    handleEndpointError(res, operation, error, statusCode = 500) {
        this.logError(operation, error);
        const errorResponse = this.createErrorResponse(operation, error, statusCode);
        return res.status(statusCode).json(errorResponse);    }
};

// **SECURITY INITIALIZATION**
// Security instances are already imported and ready to use

// Security middleware
const authenticateRequest = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-api-key'];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                message: 'API key or token must be provided'
            });
        }        const authResult = await authManager.validateApiKey(token);
        if (!authResult) {
            return res.status(401).json({
                success: false,
                error: 'Invalid authentication',
                message: 'Invalid API key or token'
            });
        }

        req.user = authResult;
        req.permissions = authResult.permissions;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication service error'
        });
    }
};

// Authorization middleware
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.permissions || !req.permissions.includes(permission)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                message: `Required permission: ${permission}`
            });
        }
        next();
    };
};

// Rate limiting
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            error: 'Rate limit exceeded',
            message
        },
        standardHeaders: true,
        legacyHeaders: false
    });
};

const app = express();
const port = 3001;

// CORS configuration
app.use(cors());

// **SECURITY MIDDLEWARE CONFIGURATION**
// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// Rate limiting for different endpoint types (TEMPORARILY INCREASED FOR TROUBLESHOOTING)
const generalRateLimit = createRateLimit(15 * 60 * 1000, 10000, 'Too many requests, please try again later');
const apiRateLimit = createRateLimit(15 * 60 * 1000, 20000, 'Too many API requests, please try again later');
const authRateLimit = createRateLimit(15 * 60 * 1000, 2000, 'Too many authentication attempts, please try again later');

// Apply rate limiting
app.use('/api/auth', authRateLimit);
app.use('/api', apiRateLimit);
app.use(generalRateLimit);

// Enable CORS for frontend communication
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:8080'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// Configure AWS SDK (uses default credential chain)
AWS.config.update({ region: 'us-east-1' });
const ec2 = new AWS.EC2();

// Initialize GCP service
const gcpService = new GCPService();

// Initialize Azure service
const azureService = new AzureService();

// **SECURITY INITIALIZATION**
// Security instances are already declared above

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
        }    };
}

// **AUTHENTICATION AND SECURITY ENDPOINTS**

// Health check endpoint (public, no auth required)
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Authentication endpoint
app.post('/api/auth/login', authRateLimit, async (req, res) => {
    try {
        const { apiKey } = req.body;
        
        // Validate input
        const validation = inputValidator.validateApiKey(apiKey);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: 'Invalid API key format',
                details: validation.errors
            });
        }        const authResult = await authManager.validateApiKey(apiKey);
        if (!authResult) {
            return res.status(401).json({
                success: false,
                error: 'Authentication failed',
                message: 'Invalid API key'
            });
        }

        // Generate JWT token
        const token = await authManager.generateJWT(authResult);
        
        res.json({
            success: true,
            token,
            user: {
                id: authResult.user.id,
                role: authResult.user.role,
                permissions: authResult.permissions
            },
            expiresIn: '24h'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication service error'
        });
    }
});

// Token validation endpoint
app.post('/api/auth/validate', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token required'
            });
        }

        const isValid = await authManager.validateJWT(token);
        res.json({
            success: true,
            valid: isValid
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Token validation error'
        });
    }
});

// Get API key information (admin only)
app.get('/api/auth/api-keys', authenticateRequest, requirePermission('manage:config'), async (req, res) => {
    try {
        const apiKeys = authManager.listApiKeys();
        res.json({
            success: true,
            apiKeys
        });
    } catch (error) {
        console.error('Error fetching API keys:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch API keys'
        });
    }
});

// Get current API key for configuration
app.get('/api/auth/current-key', authenticateRequest, requirePermission('read:config'), async (req, res) => {
    try {
        // Find the current user's API key from the request
        const currentApiKey = req.headers['x-api-key'] || req.headers.authorization?.replace('Bearer ', '');
        
        if (!currentApiKey) {
            return res.status(400).json({
                success: false,
                error: 'No API key in request'
            });
        }

        res.json({
            success: true,
            apiKey: currentApiKey,
            user: req.user
        });
    } catch (error) {
        console.error('Error getting current API key:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get current API key'
        });
    }
});

// **PROTECTED API ENDPOINTS** (All endpoints below require authentication)

// API endpoint to fetch ALL configured EC2 instances
app.get('/api/ec2-instances', authenticateRequest, requirePermission('read:instances'), async (req, res) => {
    const operation = 'fetch-ec2-instances';
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
            } catch (instanceError) {
                ErrorHandler.logError('fetch-single-ec2-instance', instanceError, { 
                    instanceId: instanceConfig.id,
                    alias: instanceConfig.alias 
                });
            }
        }
        
        // Auto-discovery if enabled
        if (awsConfig.autoDiscovery?.enabled) {
            try {
                const discoveredInstances = await discoverEC2Instances(awsConfig.autoDiscovery.filters);
                instances.push(...discoveredInstances);
                console.log(`🔍 Auto-discovered ${discoveredInstances.length} additional instances`);
            } catch (discoveryError) {
                ErrorHandler.logError('auto-discovery', discoveryError);
            }
        }
        
        console.log(`📊 Returning ${instances.length} EC2 instances`);
        const response = ErrorHandler.createSuccessResponse(operation, instances);
        res.json(response);
        
    } catch (error) {
        return ErrorHandler.handleEndpointError(res, operation, error);
    }
});

// API endpoint to fetch a single EC2 instance (backward compatibility)
app.get('/api/ec2-instance', authenticateRequest, requirePermission('read:instances'), async (req, res) => {
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
app.get('/api/ec2-instance/status', authenticateRequest, requirePermission('read:instances'), async (req, res) => {
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
app.get('/api/config', authenticateRequest, requirePermission('read:config'), (req, res) => {
    res.json(instancesConfig);
});

app.post('/api/config/aws/add-instance', authenticateRequest, requirePermission('write:config'), async (req, res) => {
    try {
        const { instanceId, alias, description } = req.body;
        
        // Validate input using our security module
        const validation = inputValidator.validateAWSInstanceId(instanceId);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: 'Invalid instance ID format',
                details: validation.errors
            });
        }

        if (alias && !inputValidator.validateString(alias, 1, 50)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid alias - must be 1-50 characters'
            });
        }

        if (description && !inputValidator.validateString(description, 0, 200)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid description - must be 0-200 characters'
            });
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

app.delete('/api/config/aws/remove-instance/:instanceId', authenticateRequest, requirePermission('write:config'), async (req, res) => {
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
app.get('/api/gcp-instance/:instanceName', authenticateRequest, requirePermission('read:instances'), async (req, res) => {
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
app.get('/api/gcp-instance', authenticateRequest, requirePermission('read:instances'), async (req, res) => {
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
app.get('/api/all-instances', authenticateRequest, requirePermission('read:instances'), async (req, res) => {
    const operation = 'fetch-all-instances';
    try {
        const instances = [];
        const errors = [];
        
        // Fetch AWS instances
        try {
            const awsInstances = await fetchAWSInstances();
            instances.push(...awsInstances);
            console.log(`✅ AWS: Fetched ${awsInstances.length} instances`);
        } catch (awsError) {
            ErrorHandler.logError('fetch-aws-instances', awsError, { provider: 'AWS' });
            errors.push({ provider: 'AWS', error: awsError.message });
        }
        
        // Fetch GCP instances
        try {
            const gcpInstances = await fetchGCPInstances();
            instances.push(...gcpInstances);
            console.log(`✅ GCP: Fetched ${gcpInstances.length} instances`);
        } catch (gcpError) {
            ErrorHandler.logError('fetch-gcp-instances', gcpError, { provider: 'GCP' });
            errors.push({ provider: 'GCP', error: gcpError.message });
        }
        
        // Fetch Azure instances
        try {
            const azureInstances = await fetchAzureInstances();
            instances.push(...azureInstances);
            console.log(`✅ Azure: Fetched ${azureInstances.length} instances`);
        } catch (azureError) {
            ErrorHandler.logError('fetch-azure-instances', azureError, { provider: 'Azure' });
            errors.push({ provider: 'Azure', error: azureError.message });
        }
        
        // Return response with instances and any partial errors
        const response = ErrorHandler.createSuccessResponse(operation, {
            instances,
            partialErrors: errors,
            summary: {
                total: instances.length,
                providers: {
                    aws: instances.filter(i => i.cloudProvider === 'AWS').length,
                    gcp: instances.filter(i => i.cloudProvider === 'GCP').length,
                    azure: instances.filter(i => i.cloudProvider === 'Azure').length
                }
            }
        });
        
        res.json(response);
        
    } catch (error) {
        return ErrorHandler.handleEndpointError(res, operation, error);
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
            
            // gcpData is already formatted by getInstanceDetails(), don't re-process
            instances.push({
                ...gcpData,
                cloudProvider: 'GCP',
                dataSource: 'GCP API/Cache',
                position: { x: 750, y: 300 } // Add default position
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
app.post('/api/discover-instances', authenticateRequest, requirePermission('write:config'), async (req, res) => {
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
app.get('/api/auto-discovery/status', authenticateRequest, requirePermission('read:config'), (req, res) => {
    const awsConfig = instancesConfig.aws || {};
    const autoDiscovery = awsConfig.autoDiscovery || { enabled: false };
    
    res.json({
        enabled: autoDiscovery.enabled,
        filters: autoDiscovery.filters || [],
        configuredInstances: awsConfig.instances?.length || 0,
        autoDiscoveredCount: awsConfig.instances?.filter(i => i.autoDiscovered).length || 0
    });
});

app.post('/api/auto-discovery/toggle', authenticateRequest, requirePermission('write:config'), async (req, res) => {
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
app.get('/api/instance-library', authenticateRequest, requirePermission('read:instances'), async (req, res) => {
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
                    ...gcpData,
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

app.post('/api/instance-library/toggle-visibility', authenticateRequest, requirePermission('write:config'), async (req, res) => {
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

app.post('/api/instance-library/bulk-toggle', authenticateRequest, requirePermission('write:config'), async (req, res) => {
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
app.get('/api/all-instances', authenticateRequest, requirePermission('read:instances'), async (req, res) => {
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
            console.error('GCP fetch failed:', gcpError.message);        }
          // Fetch Azure instances
        try {
            const azureInstances = await fetchAzureInstances();
            instances.push(...azureInstances);
        } catch (azureError) {
            console.error('Azure fetch failed:', azureError.message);
        }
        
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
    // Initialize security system
    try {
        console.log('🔐 Initializing security system...');
        await authManager.initializeDefaultCredentials();
        console.log('✅ Security system initialized');
    } catch (error) {
        console.error('❌ Failed to initialize security system:', error);
        // Don't exit, continue with limited security
        console.log('⚠️ Continuing with basic security...');
    }

    // Load application configuration
    await loadConfig();
    
    app.listen(port, () => {
        const awsConfig = instancesConfig.aws || {};
        const primaryInstance = awsConfig.instances?.[0];
          console.log(`🚀 Enhanced Multi-Cloud Backend API running on http://localhost:${port}`);
        console.log(`🔐 Security: Enabled with JWT authentication and RBAC`);
        console.log(`📡 AWS Instances Configured: ${awsConfig.instances?.length || 0}`);
        console.log(`📡 GCP Instances Configured: ${instancesConfig.gcp?.instances?.length || 0}`);
        if (primaryInstance) {
            console.log(`🎯 Primary Instance: ${primaryInstance.alias} (${primaryInstance.id})`);
        }
        console.log(`🔍 Secured API endpoints (Authentication Required):`);
        console.log(`   POST /api/auth/login - Authenticate with API key`);
        console.log(`   POST /api/auth/validate - Validate JWT token`);
        console.log(`   GET /api/health - Health check (public)`);
        console.log(`   GET /api/ec2-instances - Fetch all configured EC2 instances`);
        console.log(`   GET /api/ec2-instance - Fetch primary instance (backward compatibility)`);
        console.log(`   GET /api/all-instances - Fetch all cloud instances`);
        console.log(`   POST /api/config/aws/add-instance - Add new AWS instance`);
        console.log(`   DELETE /api/config/aws/remove-instance/:id - Remove instance`);
        console.log(`   POST /api/discover-instances - Manual auto-discovery trigger`);
        console.log(`   GET /api/config - View current configuration`);
        console.log(`🛡️ Security Features: Rate limiting, input validation, permission-based access`);
    });
}

// Start the server
initializeServer().catch(console.error);

module.exports = app;

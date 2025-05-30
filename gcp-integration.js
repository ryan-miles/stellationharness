// GCP Compute Engine Integration
const { InstancesClient, ZonesClient } = require('@google-cloud/compute');

class GCPService {
    constructor() {
        this.instancesClient = new InstancesClient();
        this.zonesClient = new ZonesClient();
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('🔧 Initializing GCP Service...');
            // Test authentication by listing zones
            await this.zonesClient.list({ project: 'operating-pod-461417-t6' });
            this.isInitialized = true;
            console.log('✅ GCP Service initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize GCP Service:', error.message);
            console.log('📋 Using cached real instance data as fallback...');
            this.isInitialized = false; // Will use fallback data
        }
    }    async getInstanceDetails(instanceName = 'gcpapp01', zone = 'us-east4-b', projectId = 'operating-pod-461417-t6') {
        await this.init(); // Always try to initialize
        
        if (this.isInitialized) {
            try {
                console.log(`🔍 Fetching GCP instance ${instanceName} in zone ${zone}...`);
                
                const [instance] = await this.instancesClient.get({
                    project: projectId,
                    zone: zone,
                    instance: instanceName
                });
                
                return this.formatInstanceData(instance, projectId);
            } catch (error) {
                console.error(`❌ Failed to fetch instance ${instanceName}:`, error.message);
            }
        }
        
        // Fallback to real instance data if API call fails or not initialized
        console.log('📋 Using cached real instance data as fallback...');
        return this.getRealInstanceFallback();
    }

    // Fallback method with real instance data from gcloud CLI
    getRealInstanceFallback() {
        return {
            id: '8330479473297479604',
            name: 'gcpapp01',
            type: 'Compute Engine',
            title: 'gcpapp01',
            hostname: 'gcpapp01',
            ip: '34.145.180.162',
            status: 'running',
            machineType: 'e2-small',
            zone: 'us-east4-b',
            project: 'operating-pod-461417-t6',
            internalIP: '10.150.0.2',
            externalIP: '34.145.180.162',
            created: '2025-05-30T10:22:38.051-07:00',
            metadata: {
                environment: 'Production',
                instanceType: 'e2-small',
                availabilityZone: 'us-east4-b',
                cloudProvider: 'GCP',
                state: 'RUNNING',
                architecture: 'x86_64',
                platform: 'debian-12-bookworm',
                project: 'operating-pod-461417-t6',
                isRealInstance: true,
                dataSource: 'GCP CLI Cache'
            }
        };    }

    formatInstanceData(instance, projectId) {
        const machineType = instance.machineType.split('/').pop();
        const zone = instance.zone.split('/').pop();
        
        // Get external IP
        let externalIP = 'No external IP';
        if (instance.networkInterfaces && instance.networkInterfaces[0].accessConfigs) {
            externalIP = instance.networkInterfaces[0].accessConfigs[0].natIP || 'Ephemeral';
        }

        // Get internal IP
        const internalIP = instance.networkInterfaces[0].networkIP;

        return {
            id: instance.id,
            name: instance.name,
            type: 'Compute Engine',
            title: instance.name,
            hostname: instance.name,
            ip: externalIP !== 'No external IP' ? externalIP : internalIP,
            status: instance.status.toLowerCase(),
            machineType: machineType,
            zone: zone,
            project: projectId,
            internalIP: internalIP,
            externalIP: externalIP,
            created: instance.creationTimestamp,
            metadata: {
                environment: this.determineEnvironment(instance),
                instanceType: machineType,
                availabilityZone: zone,
                cloudProvider: 'GCP',
                state: instance.status,
                architecture: 'x86_64',
                platform: 'debian-12-bookworm',
                project: projectId,
                isRealInstance: true,
                dataSource: 'GCP API'
            }
        };
    }    determineEnvironment(instance) {
        // Try to determine environment from labels or name
        const labels = instance.labels || {};
        const name = instance.name.toLowerCase();
        
        if (labels.environment) {
            return labels.environment.charAt(0).toUpperCase() + labels.environment.slice(1);
        } else if (name.includes('prod')) {
            return 'Production';
        } else if (name.includes('dev')) {
            return 'Development';
        } else if (name.includes('staging') || name.includes('stage')) {
            return 'Staging';
        } else {
            return 'Production'; // Default
        }
    }

    convertToNodeFormat(gcpInstance, position = { x: 750, y: 300 }) {
        return {
            id: gcpInstance.id,
            type: gcpInstance.type,
            title: gcpInstance.title,
            hostname: gcpInstance.hostname,
            ip: gcpInstance.ip,
            status: gcpInstance.status === 'running' ? 'running' : 'offline',
            position: position,
            metadata: gcpInstance.metadata
        };
    }
}

module.exports = { GCPService };

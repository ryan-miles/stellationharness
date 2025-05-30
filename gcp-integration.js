// GCP Compute Engine Integration
const { Compute } = require('@google-cloud/compute');

class GCPService {
    constructor() {
        this.compute = new Compute();
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('🔧 Initializing GCP Service...');
            // Test authentication by listing projects
            await this.compute.getZones();
            this.isInitialized = true;
            console.log('✅ GCP Service initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize GCP Service:', error.message);
            console.log('📋 To fix this, you need to:');
            console.log('   1. Install gcloud CLI: https://cloud.google.com/sdk/docs/install');
            console.log('   2. Run: gcloud auth application-default login');
            console.log('   3. Or set GOOGLE_APPLICATION_CREDENTIALS to a service account key');
            throw error;
        }
    }

    async getInstanceDetails(instanceId, zone = null, projectId = null) {
        if (!this.isInitialized) {
            await this.init();
        }

        try {
            console.log(`🔍 Fetching GCP instance ${instanceId}...`);
            
            // If no zone provided, we need to search across zones
            if (!zone) {
                const zones = await this.findInstanceZone(instanceId, projectId);
                if (zones.length === 0) {
                    throw new Error(`Instance ${instanceId} not found in any zone`);
                }
                zone = zones[0];
            }

            const [instance] = await this.compute.zone(zone).vm(instanceId).get();
            
            return this.formatInstanceData(instance);
        } catch (error) {
            console.error(`❌ Failed to fetch instance ${instanceId}:`, error.message);
            throw error;
        }
    }

    async findInstanceZone(instanceId, projectId = null) {
        try {
            const [zones] = await this.compute.getZones();
            const foundZones = [];

            for (const zone of zones) {
                try {
                    const [vms] = await zone.getVMs();
                    const found = vms.find(vm => vm.id === instanceId || vm.name === instanceId);
                    if (found) {
                        foundZones.push(zone.name);
                    }
                } catch (err) {
                    // Skip zones where we can't list VMs
                    continue;
                }
            }

            return foundZones;
        } catch (error) {
            console.error('❌ Error searching for instance:', error.message);
            return [];
        }
    }

    formatInstanceData(instance) {
        const metadata = instance.metadata;
        const machineType = metadata.machineType.split('/').pop();
        const zone = metadata.zone.split('/').pop();
        
        // Get external IP
        let externalIP = 'No external IP';
        if (metadata.networkInterfaces && metadata.networkInterfaces[0].accessConfigs) {
            externalIP = metadata.networkInterfaces[0].accessConfigs[0].natIP || 'Ephemeral';
        }

        // Get internal IP
        const internalIP = metadata.networkInterfaces[0].networkIP;

        return {
            id: instance.id,
            name: instance.name,
            type: 'Compute Engine',
            title: instance.name,
            hostname: instance.name,
            ip: externalIP !== 'No external IP' ? externalIP : internalIP,
            status: metadata.status.toLowerCase(),
            machineType: machineType,
            zone: zone,
            project: instance.parent.projectId,
            internalIP: internalIP,
            externalIP: externalIP,
            created: metadata.creationTimestamp,
            metadata: {
                environment: this.determineEnvironment(instance),
                instanceType: machineType,
                availabilityZone: zone,
                cloudProvider: 'GCP',
                state: metadata.status,
                architecture: 'x86_64', // Most GCP instances
                platform: 'linux',
                project: instance.parent.projectId,
                isRealInstance: true,
                dataSource: 'GCP API'
            }
        };
    }

    determineEnvironment(instance) {
        // Try to determine environment from labels or name
        const labels = instance.metadata.labels || {};
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

    convertToNodeFormat(gcpInstance, position = { x: 700, y: 300 }) {
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

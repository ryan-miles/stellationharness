// Azure Integration Service for Infrastructure Visualizer
// Provides Azure Virtual Machine data integration

class AzureService {
    constructor() {
        this.initialized = false;
        // Note: This is a demo implementation
        // For production, you would use @azure/identity and @azure/arm-compute
        console.log('🔧 Initializing Azure Service (Demo Mode)...');
    }

    async initialize() {
        try {
            // In production, this would initialize Azure SDK
            // const { DefaultAzureCredential } = require('@azure/identity');
            // const { ComputeManagementClient } = require('@azure/arm-compute');
            
            this.initialized = true;
            console.log('✅ Azure Service initialized successfully (Demo Mode)');
            return true;
        } catch (error) {
            console.error('❌ Azure Service initialization failed:', error.message);
            throw error;
        }
    }

    async getVirtualMachine(subscriptionId, resourceGroup, vmName) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            console.log(`🔍 Fetching Azure VM ${vmName} in resource group ${resourceGroup}...`);
            
            // Demo data - in production this would call Azure APIs
            const azureVMData = {
                id: `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/virtualMachines/${vmName}`,
                name: vmName,
                location: 'East US',
                properties: {
                    vmId: '12345678-1234-1234-1234-123456789abc',
                    hardwareProfile: {
                        vmSize: 'Standard_B2s'
                    },
                    osProfile: {
                        computerName: vmName,
                        adminUsername: 'azureuser'
                    },
                    storageProfile: {
                        osDisk: {
                            osType: 'Linux',
                            name: `${vmName}_OsDisk_1`
                        }
                    },
                    networkProfile: {
                        networkInterfaces: [{
                            primary: true,
                            privateIPAddress: '10.0.0.4',
                            publicIPAddress: '20.123.45.67'
                        }]
                    },
                    provisioningState: 'Succeeded',
                    instanceView: {
                        powerState: 'PowerState/running',
                        statuses: [{
                            code: 'ProvisioningState/succeeded',
                            level: 'Info',
                            displayStatus: 'Provisioning succeeded'
                        }]
                    }
                },
                tags: {
                    Environment: 'Development',
                    Application: 'API Service',
                    Owner: 'DevOps Team'
                }
            };

            console.log(`✅ Successfully fetched Azure VM: ${vmName}`);
            return azureVMData;

        } catch (error) {
            console.error(`❌ Failed to fetch Azure VM ${vmName}:`, error.message);
            throw error;
        }
    }

    async discoverVirtualMachines(subscriptionId, resourceGroup, filters = {}) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            console.log(`🔍 Discovering Azure VMs in resource group ${resourceGroup}...`);
            
            // Demo discovery - in production this would list all VMs
            const discoveredVMs = [
                {
                    id: `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/virtualMachines/web-server-01`,
                    name: 'web-server-01',
                    location: 'East US',
                    properties: {
                        vmId: '11111111-1111-1111-1111-111111111111',
                        hardwareProfile: { vmSize: 'Standard_B1s' },
                        instanceView: { powerState: 'PowerState/running' }
                    },
                    tags: { Environment: 'Production', Application: 'Web Server' }
                },
                {
                    id: `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/virtualMachines/database-01`,
                    name: 'database-01',
                    location: 'East US',
                    properties: {
                        vmId: '22222222-2222-2222-2222-222222222222',
                        hardwareProfile: { vmSize: 'Standard_D2s_v3' },
                        instanceView: { powerState: 'PowerState/stopped' }
                    },
                    tags: { Environment: 'Production', Application: 'Database' }
                }
            ];

            // Apply filters if provided
            let filteredVMs = discoveredVMs;
            if (filters.powerState) {
                filteredVMs = discoveredVMs.filter(vm => 
                    filters.powerState.includes(vm.properties.instanceView.powerState)
                );
            }

            console.log(`✅ Discovered ${filteredVMs.length} Azure VMs`);
            return filteredVMs;

        } catch (error) {
            console.error('❌ Azure VM discovery failed:', error.message);
            throw error;
        }
    }

    convertVMToNodeData(azureVM, config = {}) {
        const powerState = azureVM.properties?.instanceView?.powerState || 'PowerState/unknown';
        let status = 'offline';
        
        switch (powerState) {
            case 'PowerState/running':
                status = 'online';
                break;
            case 'PowerState/starting':
            case 'PowerState/stopping':
                status = 'warning';
                break;
            case 'PowerState/stopped':
            case 'PowerState/deallocated':
            default:
                status = 'offline';
                break;
        }

        const vmSize = azureVM.properties?.hardwareProfile?.vmSize || 'Unknown';
        const privateIP = azureVM.properties?.networkProfile?.networkInterfaces?.[0]?.privateIPAddress || 'No private IP';
        const publicIP = azureVM.properties?.networkProfile?.networkInterfaces?.[0]?.publicIPAddress || 'No public IP';

        return {
            id: azureVM.id,
            type: 'Azure VM',
            title: config.alias || azureVM.name,
            hostname: azureVM.properties?.osProfile?.computerName || azureVM.name,
            ip: publicIP !== 'No public IP' ? publicIP : privateIP,
            status: status,
            position: { x: 300, y: 200 }, // Default position
            cloudProvider: 'Azure',
            metadata: {
                vmId: azureVM.properties?.vmId,
                vmSize: vmSize,
                location: azureVM.location,
                powerState: powerState,
                provisioningState: azureVM.properties?.provisioningState,
                osType: azureVM.properties?.storageProfile?.osDisk?.osType,
                privateIP: privateIP,
                publicIP: publicIP,
                resourceGroup: this.extractResourceGroup(azureVM.id),
                environment: azureVM.tags?.Environment || 'Unknown',
                application: azureVM.tags?.Application || 'Unknown',
                isRealInstance: false, // Demo mode
                dataSource: 'Azure Demo',
                cloudProvider: 'Azure',
                configAlias: config.alias,
                configDescription: config.description
            }
        };
    }

    extractResourceGroup(resourceId) {
        const parts = resourceId.split('/');
        const rgIndex = parts.indexOf('resourceGroups');
        return rgIndex >= 0 && rgIndex + 1 < parts.length ? parts[rgIndex + 1] : 'Unknown';
    }
}

module.exports = { AzureService };

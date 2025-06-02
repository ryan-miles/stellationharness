// AWS EC2 Integration Module
console.log('aws-integration.js loaded');

// Note: CONFIG is declared in main.js and available globally
// Note: CloudService is expected to be available on window (loaded from cloud-utils.js)

// Real AWS EC2 Service
class EC2Service extends window.CloudService {
    constructor() {
        super('AWS'); // Call parent constructor with provider name
        // this.isInitialized = false; // Handled by CloudService
        // this.backendAvailable = false; // Handled by CloudService
        this.mockData = null;
        this.realInstanceData = null;
        this.init();
    }

    async init() {
        try {
            console.log('🔧 Initializing EC2 Service...');
            // await super.init(); // Call CloudService init if it had any base logic - CloudService.init is abstract
            
            // First, try to connect to the backend
            await this.checkBackendHealth();
            
            if (this.backendAvailable) {
                console.log('✅ Backend API available - will fetch real EC2 data');
            } else {
                console.log('⚠️ Backend API not available - using mock data');
                this.mockData = await this.generateMockEC2Data();
            }
            
            this.isInitialized = true;
            console.log('🎉 EC2 Service initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize EC2 Service:', error);
            this.mockData = await this.generateMockEC2Data();
            this.isInitialized = true;
        }
    }

    async checkBackendHealth() {
        try {
            const response = await fetch(`${CONFIG.backend.url}${CONFIG.backend.endpoints.health}`, {
                method: 'GET',
                timeout: 5000
            });
            
            if (response.ok) {
                const health = await response.json();
                console.log('🏥 Backend health check:', health);
                this.backendAvailable = true;
                return true;
            }
        } catch (error) {
            console.log('🔌 Backend not available:', error.message);
            this.backendAvailable = false;
            return false;
        }
    }

    async fetchRealEC2Instance() {
        try {
            console.log('📡 Fetching real EC2 instance data...');
            
            const response = await fetch(`${CONFIG.backend.url}${CONFIG.backend.endpoints.instance}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const instanceData = await response.json();
            console.log('✅ Successfully fetched real EC2 data:', instanceData);
            
            this.realInstanceData = instanceData;
            return instanceData;
            
        } catch (error) {
            console.error('❌ Error fetching real EC2 instance:', error);
            throw error;
        }
    }

    async fetchInstanceStatus() {
        try {
            const response = await fetch(`${CONFIG.backend.url}${CONFIG.backend.endpoints.status}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error fetching instance status:', error);
        }
        return null;
    }    async generateMockEC2Data() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Include your real instance data as part of mock data for fallback
        return [
            {
                InstanceId: 'i-005557a2ed89a5759',
                InstanceType: 't2.micro',
                State: { Name: 'running' },
                PublicIpAddress: '184.72.110.200',
                PrivateIpAddress: '172.31.60.202',
                PublicDnsName: 'ec2-184-72-110-200.compute-1.amazonaws.com',
                Tags: [
                    { Key: 'Name', Value: 'My-Real-Instance' },
                    { Key: 'Environment', Value: 'Development' },
                    { Key: 'Application', Value: 'Testing' }
                ],
                LaunchTime: new Date('2024-12-01T10:30:00Z'),
                Placement: { AvailabilityZone: 'us-east-1a' },
                VpcId: 'vpc-12345678',
                SubnetId: 'subnet-12345678',
                SecurityGroups: [
                    { GroupName: 'default', GroupId: 'sg-12345678' }
                ]
            },
            {
                InstanceId: 'i-0987654321fedcba0',
                InstanceType: 't3.large',
                State: { Name: 'running' },
                PublicIpAddress: '52.87.234.56',
                PrivateIpAddress: '10.0.1.25',
                Tags: [
                    { Key: 'Name', Value: 'Database-Production' },
                    { Key: 'Environment', Value: 'Production' },
                    { Key: 'Application', Value: 'Database' }
                ],
                LaunchTime: new Date('2024-11-28T14:20:00Z'),
                Placement: { AvailabilityZone: 'us-east-1b' },
                VpcId: 'vpc-12345678',
                SubnetId: 'subnet-87654321',
                SecurityGroups: [
                    { GroupName: 'database-sg', GroupId: 'sg-87654321' }
                ]
            }
        ];
    }

    // Convert EC2 instance data to our node format
    convertToNodeFormat(ec2Instance) {
        const nameTag = ec2Instance.Tags?.find(tag => tag.Key === 'Name');
        const environmentTag = ec2Instance.Tags?.find(tag => tag.Key === 'Environment');
        
        // Use centralized status mapping
        const status = this.mapProviderStatusToStandard(ec2Instance.State?.Name);

        return {
            id: ec2Instance.InstanceId,
            type: 'EC2',
            title: nameTag?.Value || ec2Instance.InstanceId,
            hostname: nameTag?.Value || `instance-${ec2Instance.InstanceId.slice(-8)}`,
            ip: ec2Instance.PublicIpAddress || ec2Instance.PrivateIpAddress || 'No IP assigned',
            status: status, // Use mapped status
            position: { x: Math.random() * 600 + 100, y: Math.random() * 400 + 100 }, // Random initial position
            metadata: {
                instanceType: ec2Instance.InstanceType,
                availabilityZone: ec2Instance.Placement?.AvailabilityZone,
                environment: environmentTag?.Value,
                launchTime: ec2Instance.LaunchTime,
                state: ec2Instance.State.Name,
                privateIp: ec2Instance.PrivateIpAddress,
                publicIp: ec2Instance.PublicIpAddress,
                vpcId: ec2Instance.VpcId,
                subnetId: ec2Instance.SubnetId
            }
        };
    }    async getNodesFromEC2() {
        try {
            console.log('🔍 Fetching EC2 instances...');
            
            if (this.backendAvailable) {
                // Try to get real data from backend
                try {
                    const realInstance = await this.fetchRealEC2Instance();
                    console.log('🎯 Got real EC2 instance data:', realInstance.title);
                    
                    // Add a badge to indicate this is real data
                    realInstance.metadata.isRealInstance = true;
                    realInstance.metadata.dataSource = 'AWS API';
                    
                    // For demo, also include one mock instance for comparison
                    const mockData = await this.generateMockEC2Data();
                    const mockInstance = this.convertToNodeFormat(mockData[1]); // Get the database instance
                    mockInstance.metadata.dataSource = 'Mock Data';
                    mockInstance.position = { x: 650, y: 200 }; // Position it to the right, adjusted for wider blocks
                    
                    return [realInstance, mockInstance];
                    
                } catch (error) {
                    console.error('❌ Failed to fetch real data:', error);
                    if (CONFIG.fallbackToMock) {
                        console.log('🔄 Falling back to mock data...');
                        const instances = await this.getInstances();
                        return instances.map(instance => this.convertToNodeFormat(instance));
                    }
                    return [];
                }
            } else {
                // Use mock data
                const instances = await this.getInstances();
                const nodes = instances.map(instance => this.convertToNodeFormat(instance));
                nodes.forEach(node => {
                    node.metadata.dataSource = 'Mock Data';
                });
                return nodes;
            }
            
        } catch (error) {
            console.error('❌ Error fetching EC2 instances:', error);
            return [];
        }
    }

    // NEW: Fetch multiple EC2 instances using the new backend endpoint
    async getMultipleInstancesFromEC2() { // This seems to be the primary method for fetching instances now
        if (!this.isInitialized) await this.init();
        if (!this.backendAvailable) {
            console.log('⚠️ Backend not available, attempting to use fallback or mock data for AWS...');
            const mockNodes = (await this.generateMockEC2Data()).map(instance => this.convertToNodeFormat(instance));
            mockNodes.forEach(node => node.metadata.dataSource = 'Mock Data (Backend Unavailable)');
            return mockNodes;
        }
        try {
            console.log('🔍 Fetching multiple EC2 instances via backend...');
            
            const response = await fetch(`${CONFIG.backend.url}/api/ec2-instances`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const instances = await response.json(); 
            console.log(`✅ Successfully fetched ${instances.length} EC2 instances from backend.`);
            
            instances.forEach((instance, index) => {
                instance.position = instance.position || this.calculateNodePosition(index, instances.length);
                if (instance.rawState && !instance.status) {
                     instance.status = this.mapProviderStatusToStandard(instance.rawState);
                }
            });
            
            return instances;
            
        } catch (error) {
            console.error('❌ Error fetching multiple EC2 instances from backend:', error);
            console.log('🔄 Falling back to mock data for AWS...');
            const mockNodes = (await this.generateMockEC2Data()).map(instance => this.convertToNodeFormat(instance));
            mockNodes.forEach(node => node.metadata.dataSource = 'Mock Data (Fetch Error)');
            return mockNodes;
        }
    }

    // Overriding from CloudService
    async getInstances(filters = {}) {
        return this.getMultipleInstancesFromEC2(); 
    }

    async getInstanceDetails(instanceId, options = {}) {
        if (!this.isInitialized) await this.init();
        if (!this.backendAvailable) {
            console.warn(`Backend not available, cannot fetch details for AWS instance ${instanceId}`);
            const mockInstances = await this.generateMockEC2Data();
            const mockInstanceRaw = mockInstances.find(i => i.InstanceId === instanceId);
            return mockInstanceRaw ? this.convertToNodeFormat(mockInstanceRaw) : null;
        }
        try {
            console.log(`📡 Fetching details for AWS instance ${instanceId} via backend...`);
            // Assuming backend has an endpoint like /api/ec2-instance/:id 
            // For AWS, CONFIG.backend.endpoints.instance seems to be for the *primary* instance, not any specific ID.
            // This might need adjustment in backend or a new endpoint if not already present.
            // Let's assume for now the frontend filters from the main list or this is a specific primary instance call.
            let targetUrl = `${CONFIG.backend.url}${CONFIG.backend.endpoints.instance}`;
            // If instanceId is provided and different from a known primary, this logic might need to change.
            // For this example, we'll assume this endpoint can fetch by ID if one is appended, or it fetches the primary.
            // This is a simplification; a dedicated /api/ec2-instance/:id would be better.
            if (instanceId) { // Basic check, might need more robust handling
                 // If your backend supports /api/ec2-instance/:id then use it.
                 // targetUrl = `${CONFIG.backend.url}${CONFIG.backend.endpoints.instance}/${instanceId}`; 
                 // For now, we stick to the defined endpoint, implying it might be the primary one or the frontend filters.
                 console.warn('Fetching specific AWS instance by ID via frontend service; backend endpoint for specific ID is assumed or filtering is done client-side.');
            }

            const response = await fetch(targetUrl); 
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} fetching AWS instance ${instanceId || 'primary'}`);
            }
            const instanceData = await response.json(); 
            if (instanceData.rawState && !instanceData.status) {
                instanceData.status = this.mapProviderStatusToStandard(instanceData.rawState);
            }
            // If instanceId was provided, ensure the returned data matches
            if (instanceId && instanceData.id !== instanceId) {
                console.warn(`Fetched instance ID ${instanceData.id} does not match requested ID ${instanceId}. อาจเป็นข้อมูล instance หลัก`);
                const allInstances = await this.getInstances();
                const foundInstance = allInstances.find(inst => inst.id === instanceId);
                return foundInstance || null;
            }
            return instanceData;
        } catch (error) {
            console.error(`❌ Error fetching details for AWS instance ${instanceId || 'primary'}:`, error);
            const mockInstances = await this.generateMockEC2Data();
            const mockInstanceRaw = mockInstances.find(i => i.InstanceId === instanceId);
            if (mockInstanceRaw) {
                const mockNode = this.convertToNodeFormat(mockInstanceRaw);
                mockNode.metadata.dataSource = 'Mock Data (Detail Fetch Error)';
                return mockNode;
            }
            return null;
        }
    }

    // Overriding from CloudService
    formatDataToNode(ec2Instance, config = {}) {
        return this.convertToNodeFormat(ec2Instance);
    }

    // NEW: Add a new AWS instance to monitoring
    async addNewInstance(instanceId, alias, description) {
        try {
            console.log(`➕ Adding new instance: ${instanceId}`);
            
            const response = await fetch(`${CONFIG.backend.url}/api/config/aws/add-instance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    instanceId: instanceId,
                    alias: alias,
                    description: description
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `HTTP ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ Instance added successfully:', result.instance.alias);
            return result;
            
        } catch (error) {
            console.error('❌ Error adding instance:', error);
            throw error;
        }    }

    // NEW: Get current configuration
    async getConfiguration() {
        try {
            const response = await fetch(`${CONFIG.backend.url}/api/config`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('❌ Error fetching configuration:', error);
            throw error;
        }
    }

    // Method to refresh real instance data
    async refreshRealInstance() {
        if (this.backendAvailable) {
            try {
                console.log('🔄 Refreshing real instance data...');
                const realInstance = await this.fetchRealEC2Instance();
                const status = await this.fetchInstanceStatus();
                
                if (status) {
                    realInstance.metadata.systemStatus = status.systemStatus;
                    realInstance.metadata.instanceStatus = status.instanceStatus;
                    realInstance.metadata.lastUpdated = status.lastUpdated;
                }
                
                return realInstance;
            } catch (error) {
                console.error('Failed to refresh real instance data:', error);
                throw error;
            }
        }
        return null;
    }

    async getMultipleNodesFromEC2() {
        if (!this.isInitialized) {
            await this.init();
        }
        
        if (!this.backendAvailable) {
            console.log('⚠️ Backend unavailable, returning mock data');
            return this.mockData;
        }
        
        try {
            console.log('🔄 Fetching all configured EC2 instances...');
            const response = await fetch(`${CONFIG.backend.url}${CONFIG.backend.endpoints.instances}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const instances = await response.json();
            console.log(`✅ Successfully fetched ${instances.length} EC2 instances`);
            
            // Convert to node format with proper positioning
            const nodes = instances.map((instance, index) => ({
                ...instance,
                position: this.calculateNodePosition(index, instances.length)
            }));
            
            this.realInstanceData = nodes;
            return nodes;
            
        } catch (error) {
            console.error('❌ Failed to fetch EC2 instances:', error);
            
            if (CONFIG.fallbackToMock && this.mockData) {
                console.log('🔄 Falling back to mock data');
                return this.mockData;
            }
            
            throw error;
        }
    }

    async getAllCloudInstances() {
        if (!this.isInitialized) {
            await this.init();
        }
        
        try {
            console.log('🔄 Fetching all cloud instances (AWS + GCP + Azure)...');
            const response = await fetch(`${CONFIG.backend.url}${CONFIG.backend.endpoints.allInstances}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const instances = await response.json();
            console.log(`✅ Successfully fetched ${instances.length} cloud instances`);
            
            // Convert to node format with proper positioning
            const nodes = instances.map((instance, index) => ({
                ...instance,
                position: this.calculateNodePosition(index, instances.length)
            }));
            
            return nodes;
            
        } catch (error) {
            console.error('❌ Failed to fetch cloud instances:', error);
            throw error;
        }
    }

    calculateNodePosition(index, totalNodes) {
        // Calculate positions in a grid layout with proper spacing for 250px wide nodes
        const nodeWidth = 250;
        const nodeHeight = 150;
        const marginX = 50;
        const marginY = 50;
        const startX = 100;
        const startY = 150;
        
        const nodesPerRow = Math.max(1, Math.floor((window.innerWidth - startX * 2) / (nodeWidth + marginX)));
        const row = Math.floor(index / nodesPerRow);
        const col = index % nodesPerRow;
        
        return {
            x: startX + col * (nodeWidth + marginX),
            y: startY + row * (nodeHeight + marginY)
        };
    }

    async addInstance(instanceId, alias, description) {
        try {
            console.log(`🔄 Adding new instance: ${instanceId}`);
            
            const response = await fetch(`${CONFIG.backend.url}${CONFIG.backend.endpoints.addInstance}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    instanceId,
                    alias,
                    description
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `HTTP ${response.status}`);
            }
            
            const result = await response.json();
            console.log(`✅ Successfully added instance: ${result.instance.alias}`);
            return result;
            
        } catch (error) {
            console.error('❌ Failed to add instance:', error);
            throw error;
        }
    }

    async removeInstance(instanceId) {
        try {
            console.log(`🔄 Removing instance: ${instanceId}`);
            
            const response = await fetch(`${CONFIG.backend.url}${CONFIG.backend.endpoints.removeInstance}/${instanceId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `HTTP ${response.status}`);
            }
            
            const result = await response.json();
            console.log(`✅ Successfully removed instance: ${instanceId}`);
            return result;
            
        } catch (error) {
            console.error('❌ Failed to remove instance:', error);
            throw error;
        }
    }
}

// Create global instance
const ec2Service = new EC2Service();

// Export for use in other modules
window.EC2Service = EC2Service;
window.ec2Service = ec2Service;

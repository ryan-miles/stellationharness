// AWS EC2 Integration Module
console.log('aws-integration.js loaded');

// Configuration
const CONFIG = {
    backend: {
        url: 'http://localhost:3001',
        endpoints: {
            instances: '/api/ec2-instances',
            allInstances: '/api/all-instances',
            instance: '/api/ec2-instance',
            status: '/api/ec2-instance/status',
            health: '/api/health',
            addInstance: '/api/config/aws/add-instance',
            removeInstance: '/api/config/aws/remove-instance'
        }
    },
    fallbackToMock: true
};

// Real AWS EC2 Service
class EC2Service {
    constructor() {
        this.isInitialized = false;
        this.backendAvailable = false;
        this.mockData = null;
        this.realInstanceData = null;
        this.init();
    }

    async init() {
        try {
            console.log('🔧 Initializing EC2 Service...');
            
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

    async getInstances() {
        if (!this.isInitialized) {
            await this.init();
        }
        
        if (this.backendAvailable) {
            try {
                const realInstance = await this.fetchRealEC2Instance();
                // Return array with real instance plus mock data for comparison
                const mockData = await this.generateMockEC2Data();
                return [this.convertNodeToEC2Format(realInstance), ...mockData.slice(1)];
            } catch (error) {
                console.error('Failed to fetch real data, falling back to mock:', error);
                return this.mockData || [];
            }
        }
        
        return this.mockData || [];
    }

    // Convert our node format back to EC2 format for compatibility
    convertNodeToEC2Format(nodeData) {
        if (!nodeData.metadata) return null;
        
        return {
            InstanceId: nodeData.id,
            InstanceType: nodeData.metadata.instanceType,
            State: { Name: nodeData.metadata.state },
            PublicIpAddress: nodeData.metadata.publicIp,
            PrivateIpAddress: nodeData.metadata.privateIp,
            PublicDnsName: nodeData.metadata.publicDns,
            PrivateDnsName: nodeData.metadata.privateDns,
            Tags: [
                { Key: 'Name', Value: nodeData.title },
                { Key: 'Environment', Value: nodeData.metadata.environment },
                { Key: 'Application', Value: nodeData.metadata.application }
            ],
            LaunchTime: nodeData.metadata.launchTime,
            Placement: { AvailabilityZone: nodeData.metadata.availabilityZone },
            VpcId: nodeData.metadata.vpcId,
            SubnetId: nodeData.metadata.subnetId,
            SecurityGroups: nodeData.metadata.securityGroups ? 
                nodeData.metadata.securityGroups.split(', ').map(name => ({ GroupName: name })) : []
        };
    }

    // Convert EC2 instance data to our node format
    convertToNodeFormat(ec2Instance) {
        const nameTag = ec2Instance.Tags?.find(tag => tag.Key === 'Name');
        const environmentTag = ec2Instance.Tags?.find(tag => tag.Key === 'Environment');
        
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

        return {
            id: ec2Instance.InstanceId,
            type: 'EC2',
            title: nameTag?.Value || ec2Instance.InstanceId,
            hostname: nameTag?.Value || `instance-${ec2Instance.InstanceId.slice(-8)}`,
            ip: ec2Instance.PublicIpAddress || ec2Instance.PrivateIpAddress || 'No IP assigned',
            status: status,
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
    async getMultipleInstancesFromEC2() {
        try {
            console.log('🔍 Fetching multiple EC2 instances...');
            
            if (this.backendAvailable) {
                const response = await fetch(`${CONFIG.backend.url}/api/ec2-instances`);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const instances = await response.json();
                console.log(`✅ Successfully fetched ${instances.length} EC2 instances`);
                
                // Add positioning for multiple instances
                instances.forEach((instance, index) => {
                    instance.position = { 
                        x: 300 + (index * 300), // Space them out horizontally
                        y: 200 + (index % 2) * 200 // Alternate rows for more instances
                    };
                });
                
                return instances;
            } else {
                console.log('⚠️ Backend not available, using fallback...');
                return await this.getNodesFromEC2(); // Fallback to existing method
            }
            
        } catch (error) {
            console.error('❌ Error fetching multiple EC2 instances:', error);
            // Fallback to single instance method
            return await this.getNodesFromEC2();
        }
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
        }
    }

    // NEW: Remove an instance from monitoring
    async removeInstance(instanceId) {
        try {
            console.log(`🗑️ Removing instance: ${instanceId}`);
            
            const response = await fetch(`${CONFIG.backend.url}/api/config/aws/remove-instance/${instanceId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `HTTP ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ Instance removed successfully');
            return result;
            
        } catch (error) {
            console.error('❌ Error removing instance:', error);
            throw error;
        }
    }

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

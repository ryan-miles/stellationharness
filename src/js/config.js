// Global configuration for API endpoints and authentication
const CONFIG = {
    backend: {
        url: 'http://localhost:3001',
        endpoints: {
            instances: '/api/ec2-instances',
            allInstances: '/api/all-instances',
            instance: '/api/ec2-instance',
            gcpInstance: '/api/gcp-instance',
            status: '/api/ec2-instance/status',
            health: '/api/health',
            addInstance: '/api/config/aws/add-instance',
            removeInstance: '/api/config/aws/remove-instance',
            discoverInstances: '/api/discover-instances',
            autoDiscoveryStatus: '/api/auto-discovery/status',
            autoDiscoveryToggle: '/api/auto-discovery/toggle',
            instanceLibrary: '/api/instance-library',
            instanceLibraryToggleVisibility: '/api/instance-library/toggle-visibility',            instanceLibraryBulkToggle: '/api/instance-library/bulk-toggle'
        }
    },
    auth: {
        apiKey: 'sk_76b394af01c21295ddaf0672845f0aae07d8494caab49216d960045348e68388'
    }
};

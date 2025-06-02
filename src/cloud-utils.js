// cloud-utils.js
console.log('cloud-utils.js loaded');

class CloudService {
    constructor(providerName) {
        this.providerName = providerName;
        this.isInitialized = false;
        this.backendAvailable = false; // Relevant for client-side services
    }

    async init() {
        throw new Error('Method "init()" must be implemented by subclasses');
    }

    async getInstances(filters = {}) {
        throw new Error('Method "getInstances()" must be implemented by subclasses');
    }

    async getInstanceDetails(instanceId, options = {}) {
        throw new Error('Method "getInstanceDetails()" must be implemented by subclasses');
    }

    formatDataToNode(instanceData, config = {}) {
        throw new Error('Method "formatDataToNode()" must be implemented by subclasses');
    }

    /**
     * Centralized status mapping logic.
     * @param {string} providerStatus - The status string from the cloud provider.
     * @returns {string} - Standardized status ('online', 'offline', 'warning', 'unknown').
     */
    mapProviderStatusToStandard(providerStatus) {
        if (!providerStatus) return 'unknown';
        const status = String(providerStatus).toLowerCase();

        // AWS EC2 States: pending, running, shutting-down, terminated, stopping, stopped
        // Azure VM Power States: PowerState/starting, PowerState/running, PowerState/stopping, PowerState/stopped, PowerState/deallocating, PowerState/deallocated
        // GCP VM Statuses: PROVISIONING, STAGING, RUNNING, STOPPING, SUSPENDING, SUSPENDED, REPAIRING, TERMINATED

        if (status.includes('running')) {
            return 'online';
        }
        if (status.includes('pending') || status.includes('starting') || status.includes('staging') || status.includes('provisioning') || status.includes('rebooting') || status.includes('suspending') || status.includes('stopping') || status.includes('shutting-down') || status.includes('deallocating') || status.includes('repairing')) {
            return 'warning';
        }
        if (status.includes('stopped') || status.includes('terminated') || status.includes('deallocated')) {
            return 'offline';
        }
        return 'unknown';
    }

    // Helper to extract resource group for Azure
    extractResourceGroup(resourceId) {
        if (!resourceId || typeof resourceId !== 'string') return 'Unknown';
        const match = resourceId.match(/resourceGroups\/([^\/]+)/i);
        return match ? match[1] : 'Unknown';
    }
}

// Export for use in Node.js (backend) and browser (frontend)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CloudService };
} else {
    window.CloudService = CloudService;
}

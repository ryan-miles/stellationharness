console.log('main.js loaded');

// Authentication helper function
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'x-api-key': CONFIG.auth.apiKey
    };
}

// Enhanced fetch function with authentication
async function authenticatedFetch(url, options = {}) {
    const defaultOptions = {
        headers: getAuthHeaders(),
        ...options
    };
    
    // Merge headers if additional headers are provided
    if (options.headers) {
        defaultOptions.headers = {
            ...defaultOptions.headers,
            ...options.headers
        };
    }
    
    console.log(`🔐 Making authenticated request to: ${url}`);
    return fetch(url, defaultOptions);
}

// Global variables for nodes and connections
let currentNodes = [];
let currentConnections = [];

// Smart connections based on common patterns
function generateSmartConnections(nodes) {
    const connections = [];
    const webServers = nodes.filter(n => n.title.toLowerCase().includes('web') || n.title.toLowerCase().includes('frontend'));
    const databases = nodes.filter(n => n.title.toLowerCase().includes('database') || n.title.toLowerCase().includes('db'));
    const apis = nodes.filter(n => n.title.toLowerCase().includes('api') || n.metadata?.environment === 'Development');
    
    // Connect web servers to databases
    webServers.forEach(web => {
        databases.forEach(db => {
            if (web.id !== db.id) {
                connections.push({ 
                    from: web.id, 
                    to: db.id, 
                    label: 'Database Connection' 
                });
            }
        });
    });
    
    // Connect web servers to APIs
    webServers.forEach(web => {
        apis.forEach(api => {
            if (web.id !== api.id) {
                connections.push({ 
                    from: web.id, 
                    to: api.id, 
                    label: 'API Calls' 
                });
            }
        });
    });
    
    return connections;
}

// **STANDARDIZED FRONTEND ERROR HANDLING**
const FrontendErrorHandler = {
    // Standard error logging with context
    logError(operation, error, context = {}) {
        console.error(`❌ [Frontend-${operation}] Error:`, {
            message: error.message,
            context,
            timestamp: new Date().toISOString()
        });
    },

    // Handle fetch errors consistently
    async handleFetchError(operation, response, fallbackMessage = 'Operation failed') {
        let errorMessage = fallbackMessage;
        
        try {
            if (response.headers.get('content-type')?.includes('application/json')) {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || fallbackMessage;
            } else {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
        } catch (parseError) {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        this.logError(operation, new Error(errorMessage), { 
            status: response.status,
            statusText: response.statusText 
        });
        
        return errorMessage;
    },

    // Show consistent error messages to user
    showUserError(message, type = 'error') {
        showAdminStatus(message, type);
    }
};

async function initializeVisualization() {
    console.log('Initializing visualization...');
    showLoadingIndicator();
    try {
        let nodes = [];
        let dataSource = 'Unknown';

        // Only fetch real multi-cloud instances from backend
        const response = await authenticatedFetch(`${CONFIG.backend.url}${CONFIG.backend.endpoints.allInstances}`);
        if (response.ok) {
            const responseData = await response.json();
            const allInstances = responseData.data ? responseData.data.instances : responseData;
            const partialErrors = responseData.data?.partialErrors || [];
            console.log(`📊 Fetched ${allInstances.length} instances from enhanced backend`);
            if (partialErrors.length > 0) {
                console.warn('⚠️ Some providers had errors:', partialErrors);
            }
            // Position instances in a grid layout
            allInstances.forEach((instance, index) => {
                const row = Math.floor(index / 3);
                const col = index % 3;
                instance.position = {
                    x: 200 + (col * 320),
                    y: 150 + (row * 220)
                };
            });
            nodes = allInstances;
            // Analyze data sources
            const awsNodes = nodes.filter(n => n.cloudProvider === 'AWS');
            const gcpNodes = nodes.filter(n => n.cloudProvider === 'GCP');
            const sources = [];
            if (awsNodes.length > 0) sources.push(`${awsNodes.length} AWS`);
            if (gcpNodes.length > 0) sources.push(`${gcpNodes.length} GCP`);
            dataSource = `Enhanced Multi-Cloud (${sources.join(' + ')})`;
            showSuccessMessage(`✅ Enhanced multi-cloud: ${sources.join(' + ')}`);
        } else {
            throw new Error(`Enhanced backend responded with ${response.status}`);
        }

        if (nodes.length === 0) {
            const statusDiv = document.getElementById('visualization-status');
            if (statusDiv) {
                statusDiv.style.display = '';
                statusDiv.textContent = 'No infrastructure nodes found.';
            }
            updateDataSourceIndicator('No data');
            hideLoadingIndicator();
            return;
        }

        console.log(`📊 Using ${dataSource} - ${nodes.length} nodes loaded`);
        updateDataSourceIndicator(dataSource);
        
        // Clear existing nodes before adding new ones to prevent duplicates
        const container = document.getElementById('nodes-container');
        // Remove all existing nodes but keep other elements like SVG, legend, etc.
        const existingNodes = container.querySelectorAll('.node');
        existingNodes.forEach(node => node.remove());
        
        currentNodes = nodes;
        currentConnections = generateSmartConnections(nodes);
        createConnectionsSVG();
        currentNodes.forEach(nodeData => {
            console.log('Creating node:', nodeData.id);
            createInfraNode(nodeData);
        });
        currentConnections.forEach(connection => {
            console.log('Creating connection:', connection);
            createConnection(connection);
        });
        hideLoadingIndicator();

        // Hide the visualization status if nodes are loaded
        const statusDiv = document.getElementById('visualization-status');
        if (statusDiv) statusDiv.style.display = 'none';
    } catch (error) {
        FrontendErrorHandler.logError('initialize-visualization', error);
        hideLoadingIndicator();
        showErrorMessage('Failed to load data from backend.');
    }
}

function showLoadingIndicator() {
    const container = document.getElementById('nodes-container');
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-indicator';
    loadingDiv.innerHTML = `
        <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.9);
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            text-align: center;
            z-index: 1000;
        ">
            <div style="
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #007acc;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 10px;
            "></div>
            <p style="margin: 0; color: #333;">Loading AWS EC2 instances...</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    container.appendChild(loadingDiv);
}

function hideLoadingIndicator() {
    const loadingDiv = document.getElementById('loading-indicator');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

function showErrorMessage(message) {
    const container = document.getElementById('nodes-container');
    const errorDiv = document.createElement('div');
    errorDiv.id = 'error-message';
    errorDiv.innerHTML = `
        <div style="
            position: absolute;
            top: 20px;
            right: 20px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 12px 16px;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            max-width: 300px;
        ">
            <strong>⚠️ Notice:</strong> ${message}
        </div>
    `;
    container.appendChild(errorDiv);
    
    // Auto-remove after 5 seconds with tracked timeout
    addTrackedGlobalTimeout(() => {
        if (errorDiv) errorDiv.remove();
    }, 5000);
}

function showSuccessMessage(message) {
    const container = document.getElementById('nodes-container');
    const successDiv = document.createElement('div');
    successDiv.id = 'success-message';
    successDiv.innerHTML = `
        <div style="
            position: absolute;
            top: 20px;
            right: 20px;
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 12px 16px;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            max-width: 300px;
        ">
            ${message}
        </div>
    `;
    container.appendChild(successDiv);
    
    // Auto-remove after 3 seconds with tracked timeout
    addTrackedGlobalTimeout(() => {
        if (successDiv) successDiv.remove();
    }, 3000);
}

function updateDataSourceIndicator(dataSource) {
    // Remove existing indicator
    const existing = document.getElementById('data-source-indicator');
    if (existing) existing.remove();
    
    const app = document.getElementById('app');
    const indicator = document.createElement('div');
    indicator.id = 'data-source-indicator';
    indicator.innerHTML = `
        <div style="
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
        ">
            📊 Data Source: ${dataSource}
        </div>
    `;
    app.appendChild(indicator);
}

function createConnectionsSVG() {
    const container = document.getElementById('nodes-container');
    
    // Remove existing SVG to prevent duplicates
    const existingSvg = document.getElementById('connections-svg');
    if (existingSvg) {
        existingSvg.remove();
    }
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'connections-svg';
    
    // Add arrow marker definition
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon.setAttribute('fill', '#666');
    
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);
    
    container.appendChild(svg);
}

// Add refresh button functionality
function addRefreshButton() {
    const app = document.getElementById('app');
    const refreshButton = document.createElement('button');
    refreshButton.id = 'refresh-btn';
    refreshButton.innerHTML = '🔄 Refresh EC2 Data';
    refreshButton.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: #007acc;
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        z-index: 1000;
    `;
    
    refreshButton.addEventListener('click', async () => {
        console.log('Refreshing EC2 data...');
        
        // Clear current visualization (only nodes and connections, preserve other elements)
        const container = document.getElementById('nodes-container');
        const existingNodes = container.querySelectorAll('.node');
        const existingSvg = document.getElementById('connections-svg');
        
        existingNodes.forEach(node => node.remove());
        if (existingSvg) existingSvg.remove();
        
        // Re-initialize
        await initializeVisualization();
    });
    
    app.appendChild(refreshButton);
}

// Add admin controls for managing instances
function addAdminControls() {
    const app = document.getElementById('app');
    
    const adminPanel = document.createElement('div');
    adminPanel.id = 'admin-controls';
    adminPanel.innerHTML = `
        <div class="admin-panel">
            <h3>🛠️ Instance Management</h3>
            <div class="admin-form">
                <div class="form-group">
                    <label for="instance-id">AWS Instance ID:</label>
                    <input type="text" id="instance-id" placeholder="i-1234567890abcdef0" />
                </div>
                <div class="form-group">
                    <label for="instance-alias">Alias (Optional):</label>
                    <input type="text" id="instance-alias" placeholder="My Server" />
                </div>
                <div class="form-group">
                    <label for="instance-description">Description (Optional):</label>
                    <input type="text" id="instance-description" placeholder="Description of the server" />
                </div>
                <div class="form-buttons">
                    <button id="add-instance-btn" class="btn btn-primary">➕ Add Instance</button>
                    <button id="discover-instances-btn" class="btn btn-secondary">🔍 Auto-Discover</button>
                    <button id="discovery-config-btn" class="btn btn-info">⚙️ Discovery Settings</button>
                </div>
            </div>
            
            <!-- Auto-Discovery Configuration Panel -->
            <div id="discovery-config-panel" class="admin-section" style="display: none;">
                <h3>🔍 Auto-Discovery Configuration</h3>
                <div class="discovery-status">
                    <div class="status-row">
                        <span class="status-label">Status:</span>
                        <span id="discovery-status">Loading...</span>
                    </div>
                    <div class="status-row">
                        <span class="status-label">Auto-Discovered Instances:</span>
                        <span id="auto-discovered-count">-</span>
                    </div>
                    <div class="status-row">
                        <span class="status-label">Total Configured:</span>
                        <span id="total-configured-count">-</span>
                    </div>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="enable-auto-discovery" />
                        Enable automatic instance discovery
                    </label>
                </div>
                <div class="form-group">
                    <label for="discovery-filters">Instance State Filter:</label>
                    <select id="discovery-filters" multiple>
                        <option value="running" selected>Running</option>
                        <option value="stopped">Stopped</option>
                        <option value="pending">Pending</option>
                        <option value="stopping">Stopping</option>
                        <option value="rebooting">Rebooting</option>
                    </select>
                </div>
                <div class="form-buttons">
                    <button id="save-discovery-config-btn" class="btn btn-primary">💾 Save Settings</button>
                    <button id="refresh-discovery-status-btn" class="btn btn-secondary">🔄 Refresh Status</button>
                    <button id="close-discovery-config-btn" class="btn btn-outline">✖️ Close</button>
                </div>
            </div>
            
            <div id="admin-status" class="admin-status"></div>
        </div>
    `;
    
    // Insert after the title
    const title = app.querySelector('h1');
    title.insertAdjacentElement('afterend', adminPanel);
    
    // Add event listeners
    document.getElementById('add-instance-btn').addEventListener('click', addInstanceHandler);
    document.getElementById('discover-instances-btn').addEventListener('click', discoverInstancesHandler);
    document.getElementById('discovery-config-btn').addEventListener('click', showDiscoveryConfigPanel);
    document.getElementById('save-discovery-config-btn').addEventListener('click', saveDiscoveryConfig);
    document.getElementById('refresh-discovery-status-btn').addEventListener('click', refreshDiscoveryStatus);
    document.getElementById('close-discovery-config-btn').addEventListener('click', hideDiscoveryConfigPanel);
    
    // Load initial discovery status
    refreshDiscoveryStatus();
    
    // Add CSS if not already present
    if (!document.getElementById('admin-styles')) {
        const styles = document.createElement('style');
        styles.id = 'admin-styles';
        styles.textContent = `
            .admin-panel {
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                border: 2px solid #ddd;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .admin-panel h3 {
                margin: 0 0 15px 0;
                color: #333;
                font-size: 18px;
            }
            .admin-form {
                display: grid;
                gap: 10px;
                max-width: 500px;
            }
            .form-group {
                display: flex;
                flex-direction: column;
            }
            .form-group label {
                font-weight: bold;
                margin-bottom: 5px;
                color: #555;
            }
            .form-group input {
                padding: 8px;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-size: 14px;
            }
            .form-buttons {
                display: flex;
                gap: 10px;
                margin-top: 10px;
            }
            .btn {
                padding: 10px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: background-color 0.3s;
            }
            .btn-primary {
                background-color: #007bff;
                color: white;
            }
            .btn-primary:hover {
                background-color: #0056b3;
            }
            .btn-secondary {
                background-color: #6c757d;
                color: white;
            }
            .btn-secondary:hover {
                background-color: #5a6268;
            }
            .btn-info {
                background-color: #17a2b8;
                color: white;
            }
            .btn-info:hover {
                background-color: #138496;
            }
            .btn-outline {
                background-color: transparent;
                color: #6c757d;
                border: 1px solid #6c757d;
            }
            .btn-outline:hover {
                background-color: #6c757d;
                color: white;
            }
            .discovery-status {
                background-color: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                padding: 12px;
                margin-bottom: 15px;
            }
            .status-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
            }
            .status-row:last-child {
                margin-bottom: 0;
            }
            .status-label {
                font-weight: bold;
                color: #555;
            }
            .form-group select {
                padding: 8px;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-size: 14px;
                min-height: 80px;
            }
            .form-group input[type="checkbox"] {
                width: auto;
                margin-right: 8px;
            }
            .form-group label:has(input[type="checkbox"]) {
                flex-direction: row;
                align-items: center;
            }
            .admin-status {
                margin-top: 15px;
                padding: 10px;
                border-radius: 4px;
                min-height: 20px;
            }
            .status-success {
                background-color: #d4edda;
                border: 1px solid #c3e6cb;
                color: #155724;
            }
            .status-error {
                background-color: #f8d7da;
                border: 1px solid #f5c6cb;
                color: #721c24;
            }
            .status-info {
                background-color: #d1ecf1;
                border: 1px solid #bee5eb;
                color: #0c5460;
            }
        `;
        document.head.appendChild(styles);
    }
}

async function addInstanceHandler() {
    const instanceId = document.getElementById('instance-id').value.trim();
    const alias = document.getElementById('instance-alias').value.trim();
    const description = document.getElementById('instance-description').value.trim();
    const statusDiv = document.getElementById('admin-status');
    
    if (!instanceId) {
        showAdminStatus('⚠️ Please enter an Instance ID', 'error');
        return;
    }
    
    // Validate instance ID format
    if (!instanceId.match(/^i-[0-9a-f]{8,17}$/)) {
        showAdminStatus('⚠️ Invalid Instance ID format. Should be like: i-1234567890abcdef0', 'error');
        return;
    }
    
    try {
        showAdminStatus('🔄 Adding instance...', 'info');
        
        if (window.ec2Service) {
            const result = await window.ec2Service.addInstance(instanceId, alias, description);
            showAdminStatus(`✅ Successfully added: ${result.instance.alias}`, 'success');
            
            // Clear form
            document.getElementById('instance-id').value = '';
            document.getElementById('instance-alias').value = '';
            document.getElementById('instance-description').value = '';
            
            // Refresh the visualization
            addTrackedGlobalTimeout(() => {
                refreshVisualization();
            }, 1000);
        } else {
            showAdminStatus('❌ EC2 Service not available', 'error');
        }
    } catch (error) {
        showAdminStatus(`❌ Failed to add instance: ${error.message}`, 'error');
    }
}

async function discoverInstancesHandler() {
    showAdminStatus('🔍 Discovering AWS instances...', 'info');
    
    try {
        const response = await authenticatedFetch(`${CONFIG.backend.url}${CONFIG.backend.endpoints.discoverInstances}`, {
            method: 'POST',
            body: JSON.stringify({ enableAutoDiscovery: true })
        });
        
        if (!response.ok) {
            const errorMessage = await FrontendErrorHandler.handleFetchError('discover-instances', response);
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        if (result.discoveredInstances && result.discoveredInstances.length > 0) {
            showAdminStatus(
                `✅ Discovered ${result.discoveredInstances.length} new instances! Refreshing view...`, 
                'success'
            );
            
            // Refresh the visualization to show newly discovered instances
            addTrackedGlobalTimeout(() => {
                initializeVisualization();
            }, 1000);
        } else {
            showAdminStatus('🔍 No new instances found to discover', 'info');
        }
        
    } catch (error) {
        FrontendErrorHandler.logError('discover-instances', error);
        FrontendErrorHandler.showUserError(`❌ Discovery failed: ${error.message}`, 'error');
    }
}

// Global timeout tracking for cleanup
const globalTimeouts = [];

function addTrackedGlobalTimeout(callback, delay) {
    const timeoutId = setTimeout(callback, delay);
    globalTimeouts.push(timeoutId);
    return timeoutId;
}

function clearAllGlobalTimeouts() {
    globalTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    globalTimeouts.length = 0;
}

function showAdminStatus(message, type) {
    const statusDiv = document.getElementById('admin-status');
    statusDiv.textContent = message;
    statusDiv.className = `admin-status status-${type}`;
    
    // Auto-clear after 5 seconds for success messages
    if (type === 'success') {
        addTrackedGlobalTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = 'admin-status';
        }, 5000);
    }
}

// Removed refreshVisualization, autoLayoutNodes, and centerView functions as well as any related code

// Auto-discovery configuration functions
function showDiscoveryConfigPanel() {
    const panel = document.getElementById('discovery-config-panel');
    panel.style.display = 'block';
    refreshDiscoveryStatus();
}

function hideDiscoveryConfigPanel() {
    const panel = document.getElementById('discovery-config-panel');
    panel.style.display = 'none';
}

async function refreshDiscoveryStatus() {
    try {
        const response = await authenticatedFetch(`${CONFIG.backend.url}${CONFIG.backend.endpoints.autoDiscoveryStatus}`);
        if (!response.ok) {
            const errorMessage = await FrontendErrorHandler.handleFetchError('refresh-discovery-status', response);
            throw new Error(errorMessage);
        }
        
        const status = await response.json();
        
        // Update status display
        document.getElementById('discovery-status').textContent = 
            status.enabled ? '✅ Enabled' : '❌ Disabled';
        document.getElementById('auto-discovered-count').textContent = status.autoDiscoveredCount;
        document.getElementById('total-configured-count').textContent = status.configuredInstances;
        
        // Update form controls
        document.getElementById('enable-auto-discovery').checked = status.enabled;
        
        // Update filter selection
        const filterSelect = document.getElementById('discovery-filters');
        Array.from(filterSelect.options).forEach(option => {
            const hasFilter = status.filters.some(filter => 
                filter.Name === 'instance-state-name' && 
                filter.Values.includes(option.value)
            );
            option.selected = hasFilter;
        });
        
    } catch (error) {
        FrontendErrorHandler.logError('refresh-discovery-status', error);
        FrontendErrorHandler.showUserError(`❌ Failed to load discovery status: ${error.message}`, 'error');
    }
}

async function saveDiscoveryConfig() {
    try {
        const enabled = document.getElementById('enable-auto-discovery').checked;
        const filterSelect = document.getElementById('discovery-filters');
        const selectedStates = Array.from(filterSelect.selectedOptions).map(option => option.value);
        
        const filters = selectedStates.length > 0 ? [
            { Name: 'instance-state-name', Values: selectedStates }
        ] : [];
        
        showAdminStatus('💾 Saving discovery configuration...', 'info');
        
        const response = await authenticatedFetch(`${CONFIG.backend.url}${CONFIG.backend.endpoints.autoDiscoveryToggle}`, {
            method: 'POST',
            body: JSON.stringify({ enabled, filters })
        });
        
        if (!response.ok) {
            const errorMessage = await FrontendErrorHandler.handleFetchError('save-discovery-config', response);
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        showAdminStatus(`✅ ${result.message}`, 'success');
        
        // Refresh status display
        addTrackedGlobalTimeout(() => {
            refreshDiscoveryStatus();
        }, 500);
        
    } catch (error) {
        FrontendErrorHandler.logError('save-discovery-config', error);
        FrontendErrorHandler.showUserError(`❌ Failed to save configuration: ${error.message}`, 'error');
    }
}

// Node Selection and Visibility Management
class NodeSelectionManager {
    constructor() {
        this.instanceLibrary = [];
        this.selectedInstances = new Set();
        this.filterProvider = 'all';
        this.filterStatus = 'all';
        this.searchQuery = '';
        this.eventListeners = []; // Track event listeners for cleanup
        this.timeouts = []; // Track timeouts for cleanup
    }

    async loadInstanceLibrary() {
        try {
            const response = await authenticatedFetch(`${CONFIG.backend.url}${CONFIG.backend.endpoints.instanceLibrary}`);
            if (!response.ok) {
                const errorMessage = await FrontendErrorHandler.handleFetchError('load-instance-library', response);
                throw new Error(errorMessage);
            }
            
            const library = await response.json();
            this.instanceLibrary = library;
            console.log('📚 Loaded instance library:', library.summary);
            return library;
        } catch (error) {
            FrontendErrorHandler.logError('load-instance-library', error);
            throw error;
        }
    }

    async toggleInstanceVisibility(provider, instanceId, visible) {
        try {
            const response = await authenticatedFetch(`${CONFIG.backend.url}${CONFIG.backend.endpoints.instanceLibraryToggleVisibility}`, {
                method: 'POST',
                body: JSON.stringify({ provider, instanceId, visible })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`✅ Toggled ${instanceId} visibility to ${visible}`);
            
            // Update local library
            await this.loadInstanceLibrary();
            this.renderSelectionPanel();
            
            return result;
        } catch (error) {
            console.error('❌ Failed to toggle instance visibility:', error);
            throw error;
        }
    }

    async bulkToggleVisibility(instances, visible) {
        try {
            const response = await authenticatedFetch(`${CONFIG.backend.url}${CONFIG.backend.endpoints.instanceLibraryBulkToggle}`, {
                method: 'POST',
                body: JSON.stringify({ instances, visible })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`✅ Bulk toggled ${result.updatedCount} instances to ${visible}`);
            
            // Update local library and UI
            await this.loadInstanceLibrary();
            this.renderSelectionPanel();
            
            return result;
        } catch (error) {
            console.error('❌ Failed to bulk toggle visibility:', error);
            throw error;
        }
    }

    getFilteredInstances() {
        const allInstances = [
            ...(this.instanceLibrary.aws || []),
            ...(this.instanceLibrary.gcp || []),
            ...(this.instanceLibrary.azure || [])
        ];

        return allInstances.filter(instance => {
            // Provider filter
            if (this.filterProvider !== 'all' && instance.cloudProvider.toLowerCase() !== this.filterProvider) {
                return false;
            }

            // Status filter
            if (this.filterStatus !== 'all') {
                if (this.filterStatus === 'visible' && !instance.isVisible) return false;
                if (this.filterStatus === 'hidden' && instance.isVisible) return false;
                if (this.filterStatus === 'online' && instance.status !== 'online') return false;
                if (this.filterStatus === 'offline' && instance.status !== 'offline') return false;
            }

            // Search filter
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                const searchText = `${instance.title} ${instance.hostname || ''} ${instance.ip || ''} ${instance.cloudProvider}`.toLowerCase();
                if (!searchText.includes(query)) return false;
            }

            return true;
        });
    }

    renderSelectionPanel() {
        const panel = document.getElementById('node-selection-panel');
        if (!panel) return;

        const filteredInstances = this.getFilteredInstances();
        const summary = this.instanceLibrary.summary || { total: 0, visible: 0, hidden: 0 };

        panel.innerHTML = `
            <div class="selection-header">
                <h3>🔧 Node Selection Manager</h3>
                <div class="summary-stats">
                    <span class="stat">📊 Total: ${summary.total}</span>
                    <span class="stat visible">👁️ Visible: ${summary.visible}</span>
                    <span class="stat hidden">🙈 Hidden: ${summary.hidden}</span>
                </div>
            </div>

            <div class="selection-controls">
                <div class="filter-row">
                    <select id="provider-filter" class="filter-select">
                        <option value="all">All Providers</option>
                        <option value="aws">AWS</option>
                        <option value="gcp">GCP</option>
                        <option value="azure">Azure</option>
                    </select>
                    
                    <select id="status-filter" class="filter-select">
                        <option value="all">All Status</option>
                        <option value="visible">Visible</option>
                        <option value="hidden">Hidden</option>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                    </select>
                    
                    <input type="text" id="search-instances" placeholder="🔍 Search instances..." class="search-input">
                </div>
                
                <div class="bulk-actions">
                    <button id="select-all-btn" class="action-btn secondary">Select All</button>
                    <button id="select-none-btn" class="action-btn secondary">Select None</button>
                    <button id="show-selected-btn" class="action-btn primary">👁️ Show Selected</button>
                    <button id="hide-selected-btn" class="action-btn warning">🙈 Hide Selected</button>
                </div>
            </div>

            <div class="instance-list">
                ${filteredInstances.map(instance => this.renderInstanceItem(instance)).join('')}
            </div>
        `;

        this.attachEventListeners();
    }

    renderInstanceItem(instance) {
        const isSelected = this.selectedInstances.has(instance.configId);
        const statusIcon = this.getStatusIcon(instance.status);
        const providerBadge = this.getProviderBadge(instance.cloudProvider);
        
        return `
            <div class="instance-item ${instance.isVisible ? 'visible' : 'hidden'}" data-instance-id="${instance.configId}" data-provider="${instance.cloudProvider.toLowerCase()}">
                <div class="instance-checkbox">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} class="instance-select">
                </div>
                
                <div class="instance-info">
                    <div class="instance-title">
                        ${statusIcon} ${instance.title}
                        ${providerBadge}
                    </div>
                    <div class="instance-details">
                        <span class="instance-id">${instance.id || instance.configId}</span>
                        <span class="instance-ip">${instance.ip || 'No IP'}</span>
                    </div>
                </div>
                
                <div class="instance-actions">
                    <button class="visibility-toggle ${instance.isVisible ? 'visible' : 'hidden'}" 
                            onclick="nodeSelectionManager.toggleInstanceVisibility('${instance.cloudProvider.toLowerCase()}', '${instance.configId}', ${!instance.isVisible})">
                        ${instance.isVisible ? '👁️' : '🙈'}
                    </button>
                </div>
            </div>
        `;
    }

    getStatusIcon(status) {
        switch (status) {
            case 'online': return '🟢';
            case 'warning': return '🟡';
            case 'offline': return '🔴';
            case 'unavailable': return '❌';
            default: return '⚪';
        }
    }

    getProviderBadge(provider) {
        const badges = {
            'AWS': '<span class="provider-badge aws">AWS</span>',
            'GCP': '<span class="provider-badge gcp">GCP</span>',
            'Azure': '<span class="provider-badge azure">Azure</span>'
        };
        return badges[provider] || `<span class="provider-badge">${provider}</span>`;
    }

    // Clean up existing event listeners before adding new ones
    cleanupEventListeners() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];
        
        // Clear any pending timeouts
        this.timeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this.timeouts = [];
    }

    // Helper method to track event listeners
    addTrackedEventListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.eventListeners.push({ element, event, handler });
    }

    // Helper method to track timeouts
    addTrackedTimeout(callback, delay) {
        const timeoutId = setTimeout(callback, delay);
        this.timeouts.push(timeoutId);
        return timeoutId;
    }

    attachEventListeners() {
        // Clean up existing listeners first to prevent memory leaks
        this.cleanupEventListeners();

        // Filter listeners
        const providerFilter = document.getElementById('provider-filter');
        const statusFilter = document.getElementById('status-filter');
        const searchInput = document.getElementById('search-instances');
        
        if (providerFilter) {
            this.addTrackedEventListener(providerFilter, 'change', (e) => {
                this.filterProvider = e.target.value;
                this.renderSelectionPanel();
            });
        }

        if (statusFilter) {
            this.addTrackedEventListener(statusFilter, 'change', (e) => {
                this.filterStatus = e.target.value;
                this.renderSelectionPanel();
            });
        }

        if (searchInput) {
            this.addTrackedEventListener(searchInput, 'input', (e) => {
                this.searchQuery = e.target.value;
                this.renderSelectionPanel();
            });
        }

        // Bulk action listeners
        const selectAllBtn = document.getElementById('select-all-btn');
        const selectNoneBtn = document.getElementById('select-none-btn');
        const showSelectedBtn = document.getElementById('show-selected-btn');
        const hideSelectedBtn = document.getElementById('hide-selected-btn');

        if (selectAllBtn) {
            this.addTrackedEventListener(selectAllBtn, 'click', () => {
                const filteredInstances = this.getFilteredInstances();
                filteredInstances.forEach(instance => this.selectedInstances.add(instance.configId));
                this.renderSelectionPanel();
            });
        }

        if (selectNoneBtn) {
            this.addTrackedEventListener(selectNoneBtn, 'click', () => {
                this.selectedInstances.clear();
                this.renderSelectionPanel();
            });
        }

        if (showSelectedBtn) {
            this.addTrackedEventListener(showSelectedBtn, 'click', () => {
                this.bulkToggleSelected(true);
            });
        }

        if (hideSelectedBtn) {
            this.addTrackedEventListener(hideSelectedBtn, 'click', () => {
                this.bulkToggleSelected(false);
            });
        }

        // Individual checkbox listeners
        document.querySelectorAll('.instance-select').forEach(checkbox => {
            this.addTrackedEventListener(checkbox, 'change', (e) => {
                const instanceItem = e.target.closest('.instance-item');
                const instanceId = instanceItem.dataset.instanceId;
                
                if (e.target.checked) {
                    this.selectedInstances.add(instanceId);
                } else {
                    this.selectedInstances.delete(instanceId);
                }
            });
        });
    }

    async bulkToggleSelected(visible) {
        if (this.selectedInstances.size === 0) {
            showAdminStatus('⚠️ No instances selected', 'warning');
            return;
        }

        const instances = [];
        this.selectedInstances.forEach(instanceId => {
            const instance = this.getFilteredInstances().find(i => i.configId === instanceId);
            if (instance) {
                instances.push({
                    provider: instance.cloudProvider.toLowerCase(),
                    instanceId,
                    visible
                });
            }
        });

        try {
            showAdminStatus(`🔄 Updating visibility for ${instances.length} instances...`, 'info');
            await this.bulkToggleVisibility(instances, visible);
            
            showAdminStatus(`✅ Successfully updated visibility for ${instances.length} instances`, 'success');
        } catch (error) {
            FrontendErrorHandler.logError('bulk-toggle-visibility', error);
            FrontendErrorHandler.showUserError(`❌ Failed to update visibility: ${error.message}`, 'error');
        }
    }
}

// Global instance - only create on management page
let nodeSelectionManager = null;

// Initialize NodeSelectionManager only when needed
function initializeNodeSelectionManager() {
    if (!nodeSelectionManager) {
        nodeSelectionManager = new NodeSelectionManager();
    }
    return nodeSelectionManager;
}

// Function to show/hide the node selection panel
async function toggleNodeSelectionPanel() {
    const panel = document.getElementById('node-selection-panel');
    if (!panel) {
        await createNodeSelectionPanel();
    } else {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}

// Comprehensive application cleanup function
function cleanupApplication() {
    console.log('Cleaning up application resources...');
    
    try {
        // Clear all global timeouts
        clearAllGlobalTimeouts();
        
        // Cleanup NodeSelectionManager if it exists
        if (nodeSelectionManager) {
            nodeSelectionManager.cleanupEventListeners();
        }
        
        // Clear any intervals if they exist
        if (window.discoveryStatusInterval) {
            clearInterval(window.discoveryStatusInterval);
        }
        
        // Clear any other global resources
        // (Add more cleanup as needed)
        
        console.log('Application cleanup completed');
    } catch (error) {
        console.error('Error during application cleanup:', error);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    
    // Check if we're on the visualization page (index.html) or management page (management.html)
    const isManagementPage = window.location.pathname.includes('management.html') || 
                             document.querySelector('.management-header') !== null;
    
    if (isManagementPage) {
        console.log('Management page detected - loading management features');
        // Only initialize visualization without admin controls
        initializeVisualization();
        // Management-specific initialization will be handled by management.html script
    } else {
        console.log('Visualization page detected - loading visualization-only features');
        // Pure visualization mode - no admin controls
        initializeVisualization();
    }
});

// Add cleanup handlers for page unload
window.addEventListener('beforeunload', cleanupApplication);
window.addEventListener('unload', cleanupApplication);

// For additional safety, cleanup on page visibility change (when user switches tabs)
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
        // Optional: Clean up when page becomes hidden (user switches tabs)
        // This is more aggressive cleanup - uncomment if needed
        // cleanupApplication();
    }
});
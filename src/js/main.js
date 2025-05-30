console.log('main.js loaded');

// Global variables for nodes and connections
let currentNodes = [];
let currentConnections = [];

// Sample data for nodes (multi-cloud infrastructure examples)
// These will be combined with real AWS data when available
const sampleNodes = [
    {
        id: 'azure-container-dev',
        type: 'Container',
        title: 'API Service',
        hostname: 'localhost',
        ip: '127.0.0.1:8080',
        status: 'warning',
        position: { x: 350, y: 450 }, /* Adjusted for wider blocks and better spacing */
        metadata: {
            environment: 'Development',
            instanceType: 'Standard_B2s',
            availabilityZone: 'eastus-1a',
            cloudProvider: 'Azure'
        }
    },
    {
        id: '8330479473297479604',
        type: 'Compute Engine',
        title: 'gcpapp01',
        hostname: 'gcpapp01',
        ip: '34.145.180.162',
        status: 'running',
        position: { x: 750, y: 300 }, /* Moved further right to accommodate wider blocks */
        metadata: {
            environment: 'Production',
            instanceType: 'e2-small',
            availabilityZone: 'us-east4-b',
            cloudProvider: 'GCP',
            machineType: 'e2-small',
            zone: 'us-east4-b',
            project: 'operating-pod-461417-t6',
            isRealInstance: true,
            dataSource: 'GCP Cache'
        }
    }
];

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

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    initializeVisualization();
});

async function initializeVisualization() {
    console.log('Initializing visualization...');
    
    // Add refresh button if it doesn't exist
    if (!document.getElementById('refresh-btn')) {
        addRefreshButton();
    }
    
    // Show loading indicator
    showLoadingIndicator();
    
    try {
        // Try to get real EC2 data first
        let nodes = [];
        let dataSource = 'Unknown';
        
        if (window.ec2Service) {
            console.log('🔍 Fetching real EC2 instances...');
            const ec2Nodes = await window.ec2Service.getNodesFromEC2();
            
            // Try to fetch real GCP data too
            let gcpNodes = [];
            try {
                console.log('🔍 Fetching real GCP instance...');
                const response = await fetch('http://localhost:3001/api/gcp-instance');
                if (response.ok) {
                    const gcpData = await response.json();
                    // Convert to node format and update the sample data
                    const gcpNode = {
                        id: gcpData.id,
                        type: gcpData.type,
                        title: gcpData.name,
                        hostname: gcpData.hostname,
                        ip: gcpData.ip,
                        status: gcpData.status,
                        position: { x: 700, y: 300 },
                        metadata: gcpData.metadata
                    };
                    gcpNodes = [gcpNode];
                    console.log('✅ Successfully fetched real GCP data:', gcpData.name);
                }
            } catch (gcpError) {
                console.log('⚠️ Could not fetch live GCP data, using cached data:', gcpError.message);
            }
            
            // Combine real data with remaining sample nodes
            const azureSampleNode = sampleNodes.find(n => n.metadata?.cloudProvider === 'Azure');
            const gcpRealOrSample = gcpNodes.length > 0 ? gcpNodes : [sampleNodes.find(n => n.metadata?.cloudProvider === 'GCP')];
            
            nodes = [...ec2Nodes, ...gcpRealOrSample, azureSampleNode].filter(Boolean);
            
            // Determine data source from nodes
            const realAwsNodes = ec2Nodes.filter(n => n.metadata?.isRealInstance);
            const realGcpNodes = gcpNodes.filter(n => n.metadata?.isRealInstance);
            
            if (realAwsNodes.length > 0 || realGcpNodes.length > 0) {
                const realCount = realAwsNodes.length + realGcpNodes.length;
                const cloudSources = [];
                if (realAwsNodes.length > 0) cloudSources.push(`${realAwsNodes.length} AWS`);
                if (realGcpNodes.length > 0) cloudSources.push(`${realGcpNodes.length} GCP`);
                
                dataSource = `Multi-Cloud Live (${cloudSources.join(' + ')}, 1 Azure sample)`;
                showSuccessMessage(`✅ Live multi-cloud: ${cloudSources.join(' + ')} + Azure demo`);
            } else {
                dataSource = `Multi-Cloud Demo (${nodes.length} total nodes)`;
            }
        }
        
        // Fall back to sample data if no EC2 data available
        if (nodes.length === 0) {
            console.log('⚠️ No EC2 data available, using sample data...');
            nodes = sampleNodes;
            dataSource = 'Sample Data';
        }
        
        console.log(`📊 Using ${dataSource} - ${nodes.length} nodes loaded`);
        updateDataSourceIndicator(dataSource);
        
        currentNodes = nodes;
        currentConnections = generateSmartConnections(nodes);
        
        // Create SVG for connections
        createConnectionsSVG();
        
        // Create nodes
        currentNodes.forEach(nodeData => {
            console.log('Creating node:', nodeData.id);
            createInfraNode(nodeData);
        });
        
        // Create connections
        currentConnections.forEach(connection => {
            console.log('Creating connection:', connection);
            createConnection(connection);
        });
        
        hideLoadingIndicator();
        
    } catch (error) {
        console.error('Error initializing visualization:', error);
        hideLoadingIndicator();
        
        // Show error and fall back to sample data
        showErrorMessage('Failed to load AWS data. Using sample data instead.');
        currentNodes = sampleNodes;
        currentConnections = generateSmartConnections(sampleNodes);
        
        createConnectionsSVG();
        currentNodes.forEach(nodeData => createInfraNode(nodeData));
        currentConnections.forEach(connection => createConnection(connection));
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
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
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
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
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
        
        // Clear current visualization
        const container = document.getElementById('nodes-container');
        container.innerHTML = '';
        
        // Re-initialize
        await initializeVisualization();
    });
    
    app.appendChild(refreshButton);
}
console.log('node.js loaded');

function createInfraNode(nodeData) {
    const container = document.getElementById('nodes-container');
    
    // Create node element
    const node = document.createElement('div');
    node.className = 'node';
    node.id = nodeData.id;
    node.style.left = nodeData.position.x + 'px';
    node.style.top = nodeData.position.y + 'px';
    
    // Add data attributes for styling
    if (nodeData.metadata?.environment) {
        node.setAttribute('data-environment', nodeData.metadata.environment);
    }
    
    // Create node header
    const header = document.createElement('div');
    header.className = 'node-header';
    
    const title = document.createElement('div');
    title.className = 'node-title';
    title.textContent = nodeData.title;
    
    const statusIndicator = document.createElement('div');
    statusIndicator.className = `status-indicator status-${nodeData.status}`;
    
    header.appendChild(title);
    header.appendChild(statusIndicator);
    
    // Create node content
    const content = document.createElement('div');
    content.className = 'node-content';
    
    // Display multi-cloud infrastructure information
    const environmentInfo = document.createElement('div');
    environmentInfo.className = 'node-info';
    // Determine cloud provider with smart detection
    let cloudProvider = 'AWS'; // Default for current implementation
    if (nodeData.metadata?.cloudProvider) {
        cloudProvider = nodeData.metadata.cloudProvider;
    } else if (nodeData.id.startsWith('i-')) {
        cloudProvider = 'AWS'; // EC2 instance IDs start with i-
    } else if (nodeData.id.length >= 15 && /^\d+$/.test(nodeData.id)) {
        cloudProvider = 'GCP'; // GCP instance IDs are long numeric strings
    } else if (nodeData.hostname?.includes('azure')) {
        cloudProvider = 'Azure';
    } else if (nodeData.hostname?.includes('gcp') || nodeData.hostname?.includes('googleapis')) {
        cloudProvider = 'GCP';
    }
    
    const environment = nodeData.metadata?.environment || 'Production';
    environmentInfo.innerHTML = `<span class="node-label">Environment:</span>${cloudProvider}/${environment}`;
    
    const instanceTypeInfo = document.createElement('div');
    instanceTypeInfo.className = 'node-info';
    // Format: Service/InstanceType (e.g., EC2/t2.micro, RDS/db.t3.large, AKS/Standard_B2s)
    const serviceType = nodeData.type || 'EC2';
    const instanceType = nodeData.metadata?.instanceType || 'unknown';
    instanceTypeInfo.innerHTML = `<span class="node-label">Type:</span>${serviceType}/${instanceType}`;
    
    const ipInfo = document.createElement('div');
    ipInfo.className = 'node-info';
    ipInfo.innerHTML = `<span class="node-label">IP:</span>${nodeData.ip}`;
    
    content.appendChild(environmentInfo);
    content.appendChild(instanceTypeInfo);
    content.appendChild(ipInfo);
    
    // All other metadata is available in the comprehensive tooltip (see createTooltipText function)
    
    // Add tooltip with detailed information
    if (nodeData.metadata) {
        node.title = createTooltipText(nodeData);
    }
    
    // Assemble node
    node.appendChild(header);
    node.appendChild(content);
    
    // Make draggable
    makeDraggable(node);
    
    container.appendChild(node);
    
    return node;
}

function createTooltipText(nodeData) {
    let tooltip = `🏷️ ${nodeData.title}\n`;
    tooltip += `📋 ID: ${nodeData.id}\n`;
    tooltip += `⚡ Status: ${nodeData.status.toUpperCase()}\n`;
    tooltip += `🌐 IP Address: ${nodeData.ip}\n`;
    tooltip += `🖥️ Hostname: ${nodeData.hostname}\n\n`;
    
    if (nodeData.metadata) {
        const cloudProvider = nodeData.metadata.cloudProvider || 'AWS';
        
        if (cloudProvider === 'GCP') {
            tooltip += `═══ GCP COMPUTE ENGINE ═══\n`;
            if (nodeData.metadata.instanceType) tooltip += `🏗️ Machine Type: ${nodeData.metadata.instanceType}\n`;
            if (nodeData.metadata.zone) tooltip += `🌍 Zone: ${nodeData.metadata.zone}\n`;
            if (nodeData.metadata.project) tooltip += `📁 Project: ${nodeData.metadata.project}\n`;
            if (nodeData.metadata.environment) tooltip += `🏷️ Environment: ${nodeData.metadata.environment}\n\n`;
        } else if (cloudProvider === 'Azure') {
            tooltip += `═══ AZURE VM DETAILS ═══\n`;
            if (nodeData.metadata.instanceType) tooltip += `🏗️ VM Size: ${nodeData.metadata.instanceType}\n`;
            if (nodeData.metadata.availabilityZone) tooltip += `🌍 Region: ${nodeData.metadata.availabilityZone}\n`;
            if (nodeData.metadata.environment) tooltip += `🏷️ Environment: ${nodeData.metadata.environment}\n\n`;
        } else {
            tooltip += `═══ EC2 DETAILS ═══\n`;
            if (nodeData.metadata.state) tooltip += `🔄 State: ${nodeData.metadata.state}\n`;
            if (nodeData.metadata.instanceType) tooltip += `🏗️ Instance Type: ${nodeData.metadata.instanceType}\n`;
            if (nodeData.metadata.architecture) tooltip += `⚙️ Architecture: ${nodeData.metadata.architecture}\n`;
            if (nodeData.metadata.platform) tooltip += `💻 Platform: ${nodeData.metadata.platform}\n`;
            if (nodeData.metadata.monitoring) tooltip += `📊 Monitoring: ${nodeData.metadata.monitoring}\n\n`;
        }
        
        tooltip += `═══ NETWORK INFO ═══\n`;
        if (nodeData.metadata.availabilityZone) tooltip += `🌍 Availability Zone: ${nodeData.metadata.availabilityZone}\n`;
        if (nodeData.metadata.vpcId) tooltip += `🔗 VPC: ${nodeData.metadata.vpcId}\n`;
        if (nodeData.metadata.subnetId) tooltip += `🌐 Subnet: ${nodeData.metadata.subnetId}\n`;
        if (nodeData.metadata.privateIp) tooltip += `🔒 Private IP: ${nodeData.metadata.privateIp}\n`;
        if (nodeData.metadata.publicIp) tooltip += `🌍 Public IP: ${nodeData.metadata.publicIp}\n`;
        if (nodeData.metadata.publicDns) tooltip += `🌐 Public DNS: ${nodeData.metadata.publicDns}\n`;
        if (nodeData.metadata.privateDns) tooltip += `🔒 Private DNS: ${nodeData.metadata.privateDns}\n`;
        if (nodeData.metadata.securityGroups) tooltip += `🛡️ Security Groups: ${nodeData.metadata.securityGroups}\n\n`;
        
        tooltip += `═══ METADATA ═══\n`;
        if (nodeData.metadata.environment) tooltip += `🏷️ Environment: ${nodeData.metadata.environment}\n`;
        if (nodeData.metadata.application) tooltip += `📱 Application: ${nodeData.metadata.application}\n`;
        if (nodeData.metadata.launchTime) tooltip += `⏰ Launch Time: ${new Date(nodeData.metadata.launchTime).toLocaleString()}\n`;
        if (nodeData.metadata.isRealInstance) tooltip += `📡 Data Source: Real AWS Instance\n`;
        if (nodeData.metadata.dataSource) tooltip += `📊 Source: ${nodeData.metadata.dataSource}\n`;
    }
    
    tooltip += `\n💡 Tip: Drag to move, hover for details, click refresh for updates`;
    return tooltip.trim();
}

function getNodeCenter(nodeId) {
    const node = document.getElementById(nodeId);
    if (!node) return { x: 0, y: 0 };
    
    const rect = node.getBoundingClientRect();
    const containerRect = document.getElementById('nodes-container').getBoundingClientRect();
    
    return {
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top + rect.height / 2
    };
}
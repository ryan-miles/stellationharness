console.log('connection.js loaded');

function createConnection(connectionData) {
    const svg = document.getElementById('connections-svg');
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    
    line.className = 'connection-line';
    line.id = `connection-${connectionData.from}-${connectionData.to}`;
    line.setAttribute('data-from', connectionData.from);
    line.setAttribute('data-to', connectionData.to);
    line.setAttribute('data-label', connectionData.label);
    
    updateConnectionPosition(line);
    
    svg.appendChild(line);
    
    return line;
}

function updateConnectionPosition(line) {
    const fromId = line.getAttribute('data-from');
    const toId = line.getAttribute('data-to');
    
    const fromCenter = getNodeCenter(fromId);
    const toCenter = getNodeCenter(toId);
    
    line.setAttribute('x1', fromCenter.x);
    line.setAttribute('y1', fromCenter.y);
    line.setAttribute('x2', toCenter.x);
    line.setAttribute('y2', toCenter.y);
}

function updateAllConnections() {
    const connections = document.querySelectorAll('.connection-line');
    connections.forEach(connection => {
        updateConnectionPosition(connection);
    });
}
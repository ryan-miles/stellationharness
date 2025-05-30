console.log('dragdrop.js loaded');

let draggedElement = null;
let dragOffset = { x: 0, y: 0 };

function makeDraggable(element) {
    element.addEventListener('mousedown', startDrag);
}

function startDrag(e) {
    draggedElement = e.currentTarget;
    draggedElement.classList.add('dragging');
    
    const rect = draggedElement.getBoundingClientRect();
    const containerRect = document.getElementById('nodes-container').getBoundingClientRect();
    
    dragOffset.x = e.clientX - (rect.left - containerRect.left);
    dragOffset.y = e.clientY - (rect.top - containerRect.top);
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    
    e.preventDefault();
}

function drag(e) {
    if (!draggedElement) return;
    
    const containerRect = document.getElementById('nodes-container').getBoundingClientRect();
    
    const newX = e.clientX - containerRect.left - dragOffset.x;
    const newY = e.clientY - containerRect.top - dragOffset.y;
    
    // Keep within bounds
    const maxX = containerRect.width - draggedElement.offsetWidth;
    const maxY = containerRect.height - draggedElement.offsetHeight;
    
    const constrainedX = Math.max(0, Math.min(newX, maxX));
    const constrainedY = Math.max(0, Math.min(newY, maxY));
    
    draggedElement.style.left = constrainedX + 'px';
    draggedElement.style.top = constrainedY + 'px';
    
    // Update connections if function exists
    if (typeof updateAllConnections === 'function') {
        updateAllConnections();
    }
}

function stopDrag() {
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
        draggedElement = null;
    }
    
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
}

    function startDrag(e) {
        draggedNode = e.currentTarget;
        draggedNode.classList.add('dragging');

        const rect = draggedNode.getBoundingClientRect();
        const containerRect = document.getElementById('nodes-container').getBoundingClientRect();

        dragOffset.x = e.clientX - (rect.left - containerRect.left);
        dragOffset.y = e.clientY - (rect.top - containerRect.top);

        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);

        e.preventDefault();
    }

    function drag(e) {
        if (!draggedNode) return;

        const containerRect = document.getElementById('nodes-container').getBoundingClientRect();

        const newX = e.clientX - containerRect.left - dragOffset.x;
        const newY = e.clientY - containerRect.top - dragOffset.y;

        // Keep within bounds
        const maxX = containerRect.width - draggedNode.offsetWidth;
        const maxY = containerRect.height - draggedNode.offsetHeight;

        const constrainedX = Math.max(0, Math.min(newX, maxX));
        const constrainedY = Math.max(0, Math.min(newY, maxY));

        draggedNode.style.left = constrainedX + 'px';
        draggedNode.style.top = constrainedY + 'px';

        // Update connections
        updateAllConnections();
    }

    function stopDrag() {
        if (draggedNode) {
            draggedNode.classList.remove('dragging');
            draggedNode = null;
        }

        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
    }

    // Reset positions on page refresh
    window.addEventListener('beforeunload', function() {
        // Positions will naturally reset when page reloads
    });

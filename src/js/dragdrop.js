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
    
    // Calculate the offset from the mouse position to the element's top-left corner
    // relative to the container
    const elementLeft = rect.left - containerRect.left;
    const elementTop = rect.top - containerRect.top;
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    dragOffset.x = mouseX - elementLeft;
    dragOffset.y = mouseY - elementTop;
    
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

// Reset positions on page refresh
window.addEventListener('beforeunload', function() {
    // Clean up any active drag operations
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
        draggedElement = null;
    }
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
});

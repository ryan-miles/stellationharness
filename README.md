# Test Infrastructure Visualizer

This project is a web-based application designed to visually represent a test infrastructure. It displays infrastructure nodes (EC2 instances, containers, databases, etc.) as draggable blocks with status indicators and connection lines showing relationships between components.

## Features

- **🔥 LIVE AWS EC2 Integration**: Currently connected to real EC2 instance (ec2-184-72-110-200.compute-1.amazonaws.com)
- **🌐 Multi-Cloud Ready**: Professional formatting supporting AWS, Azure, GCP with smart provider detection
- **📊 Real Infrastructure Data**: Backend API server fetching live EC2 instance details, network info, and metadata
- **🎯 Enhanced Node Display**: Clean multi-cloud format showing Environment/Provider, Service Type/Size, and IP address
- **🖱️ Interactive Drag & Drop**: Click and drag nodes to reposition them anywhere on the canvas
- **🚥 Live Status Indicators**: Real-time EC2 state mapping (🟢 running, 🟡 pending, 🔴 stopped)
- **🔗 Smart Connection Lines**: SVG arrows automatically following nodes with intelligent relationship discovery
- **📝 Comprehensive Tooltips**: Organized hover details with emojis showing instance metadata, network info, and tags
- **🎨 Environment-based Styling**: Visual borders for Production (green), Development (blue), Staging (orange)
- **🔄 Real-time Refresh**: Live updates from AWS API with backend integration
- **🏗️ Professional Infrastructure Display**: Enterprise-ready visualization for hybrid cloud management
- **📱 Responsive Design**: Full viewport utilization with proper boundary constraints
- **⚡ Integration Testing**: Complete validation pipeline ensuring data flow integrity

## Project Structure

```
stellationharness/
├── backend-server.js       # Express API server for AWS integration
├── test-integration.js     # Integration testing and validation
├── verify-display.js       # Multi-cloud format verification
├── package.json           # npm configuration with AWS SDK dependencies
├── src/
│   ├── index.html          # Main HTML document for the visualizer
│   ├── test.html          # Debug/test version (single file)
│   ├── css/
│   │   ├── main.css       # Main layout and container styles
│   │   └── components.css  # Node and connection component styles (150px height)
│   ├── js/
│   │   ├── main.js        # Application initialization with multi-cloud sample data
│   │   ├── aws-integration.js # Real AWS EC2 API integration service
│   │   ├── node.js        # Multi-cloud node creation with enhanced formatting
│   │   ├── connection.js   # Connection line creation and updates
│   │   └── dragdrop.js     # Mouse-based drag and drop functionality
│   └── assets/
│       └── icons/
│           ├── status-online.svg   # Green status indicator
│           ├── status-offline.svg  # Red status indicator
│           └── status-warning.svg  # Orange status indicator
├── README.md             # This documentation file
└── AWS_SETUP.md          # AWS integration setup instructions
```

## Setup Instructions

### Quick Start (Backend + Frontend)
1. **Clone and Install Dependencies**:
   ```bash
   git clone <repository>
   cd stellationharness
   npm install
   ```

2. **Start Backend API Server**:
   ```bash
   node backend-server.js
   # Server runs on http://localhost:3001
   ```

3. **Start Frontend Development Server**:
   ```bash
   npm run start
   # Opens automatically in browser at http://127.0.0.1:63302
   ```

4. **Verify Integration** (Optional):
   ```bash
   node test-integration.js
   # Validates complete AWS data pipeline
   ```

### Alternative: Simple HTTP Server
1. Navigate to the `src/` directory
2. Start a local web server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js
   npx http-server -p 8000
   ```
3. Open `http://localhost:8000` in your browser

## Usage

### 🚀 Live AWS Integration
The visualizer is **currently connected** to real AWS infrastructure:
- **Target Instance**: `ec2-184-72-110-200.compute-1.amazonaws.com` (i-005557a2ed89a5759)
- **Instance Details**: AmLinApp-01, t2.micro, us-east-1b, Production environment
- **Real-time Data**: Backend API fetches live EC2 metadata, network info, and tags
- **Multi-Cloud Format**: Professional display showing "Environment: AWS/Production", "Type: EC2/t2.micro", "IP: 184.72.110.200"

### 🎯 Enhanced Node Display
Each node now shows:
- **Environment/Provider**: AWS/Production, Azure/Development, GCP/Staging
- **Service Type/Size**: EC2/t2.micro, VM/Standard_B2s, Compute/e2-medium  
- **Connection Info**: Public IP addresses for external access
- **Smart Tooltips**: Comprehensive hover details with organized sections and emojis

### 🖱️ Interactive Features
- **Drag Nodes**: Click and hold any node to reposition on the canvas
- **Live Status**: Real EC2 states mapped to visual indicators (🟢 running, 🟡 pending, 🔴 stopped)
- **Smart Connections**: Arrows automatically follow dragged nodes with intelligent relationships
- **Refresh Data**: Click "🔄 Refresh EC2 Data" for latest AWS information
- **Environment Borders**: Production (green), Development (blue), Staging (orange) visual cues
- **Reset Layout**: Browser refresh returns nodes to default positions

### 🔧 Integration Testing
Run validation scripts to ensure data pipeline integrity:
```bash
node test-integration.js    # Validates backend → frontend → display
node verify-display.js      # Confirms multi-cloud formatting
```

## AWS Integration

### ✅ Current Implementation - LIVE INTEGRATION
The visualizer is **actively connected** to real AWS infrastructure:
- **🔗 Backend API**: Express server on port 3001 with AWS SDK integration
- **🎯 Target Instance**: ec2-184-72-110-200.compute-1.amazonaws.com (i-005557a2ed89a5759)
- **📊 Real Data Flow**: AWS API → Backend Server → Frontend → Visualization
- **🔄 Live Updates**: Real-time EC2 state, metadata, and network information
- **🌐 Multi-Cloud Ready**: Smart provider detection for AWS, Azure, GCP expansion

### 🏗️ Architecture
```
AWS EC2 API ←→ backend-server.js (Port 3001) ←→ Frontend (Port 63302) ←→ User Interface
     ↓              ↓                           ↓                        ↓
Live Instance   Express + AWS SDK        React/JavaScript         Interactive Nodes
  Metadata      Authentication          Data Processing          Drag & Drop UI
```

### 🔧 Technical Implementation
- **Authentication**: AWS credentials configured (user: rlmiles77, account: 243728312407)
- **API Endpoints**: `/api/ec2-instances` with comprehensive instance data
- **Data Format**: Multi-cloud standardized with cloudProvider metadata
- **Error Handling**: Graceful fallback to sample data if AWS unavailable
- **Integration Testing**: Automated validation with test-integration.js

### 📈 Advanced Features
- **🎯 Smart Cloud Detection**: Automatic provider identification from instance IDs and hostnames
- **🏷️ Environment Mapping**: Production/Development/Staging classification with visual styling
- **📊 Status Intelligence**: EC2 states (running/stopped/pending) mapped to visual indicators
- **🔗 Connection Discovery**: Intelligent relationship mapping between infrastructure components
- **💡 Tooltip Enhancement**: Organized hover information with emojis and structured sections
- **🎨 Multi-Cloud Formatting**: Professional display ready for hybrid infrastructure management

### 🔧 Setup for Other AWS Accounts
To connect to your own AWS infrastructure, see `AWS_SETUP.md` for:
- AWS credentials configuration
- IAM permissions setup  
- Backend server deployment
- Security best practices

## Customization

### 🔧 Adding Multi-Cloud Infrastructure

To customize the visualizer with your infrastructure, edit `src/js/main.js`:

#### Multi-Cloud Node Format
```javascript
const sampleNodes = [
    {
        id: 'i-1234567890abcdef0',        // AWS instance ID format
        type: 'EC2',                     // Service type (EC2, VM, Compute, etc.)
        title: 'Web-Server-Prod',        // Display name
        hostname: 'web-prod.company.com', // FQDN or hostname
        ip: '52.87.123.45',             // Public IP address
        status: 'running',              // EC2 state (running, stopped, pending)
        cloudProvider: 'AWS',           // Cloud provider (AWS, Azure, GCP)
        environment: 'Production',      // Environment classification
        instanceType: 't3.medium',      // Instance size/SKU
        availabilityZone: 'us-east-1a', // Placement information
        position: { x: 150, y: 300 }    // Starting position
    },
    // Azure example
    {
        id: 'vm-azure-example',
        type: 'VM',
        cloudProvider: 'Azure',
        environment: 'Development',
        instanceType: 'Standard_B2s',
        // ... additional Azure-specific metadata
    }
];
```

#### Enhanced Connection Discovery
```javascript
const sampleConnections = [
    { 
        from: 'web-server-id', 
        to: 'database-id', 
        label: 'Database Connection',
        connectionType: 'TCP/3306'
    }
];
```

### 🎨 Styling Customization
- **Cloud Provider Colors**: Modify gradients in `src/css/components.css` for AWS (orange), Azure (blue), GCP (green)
- **Environment Borders**: Production (green), Development (blue), Staging (orange) in environment-based styling
- **Status Indicators**: Update colors for running (🟢), pending (🟡), stopped (🔴) states
- **Node Dimensions**: Current height 150px for multi-cloud text fitting
- **Connection Styles**: Customize SVG line thickness, colors, and arrow designs
- **Responsive Layout**: Adjust container sizes and viewport utilization

## 🧪 Development & Testing

### Integration Validation
```bash
# Complete pipeline testing
node test-integration.js     # Backend API → Frontend → Display validation

# Multi-cloud format verification  
node verify-display.js       # Confirms professional node formatting

# Backend testing
curl http://localhost:3001/api/ec2-instances  # Direct API validation
```

### Development Workflow
1. **Backend Development**: Modify `backend-server.js` for API changes
2. **Frontend Logic**: Update `src/js/aws-integration.js` for data processing
3. **UI Enhancement**: Edit `src/js/node.js` for display formatting
4. **Styling**: Customize `src/css/components.css` for visual appearance
5. **Testing**: Run integration tests to validate complete pipeline

### Debug Mode
- **test.html**: Single-file debug version with inline CSS/JavaScript
- **Browser DevTools**: Network tab to monitor API calls and data flow
- **Console Logging**: Comprehensive logging in aws-integration.js and node.js

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
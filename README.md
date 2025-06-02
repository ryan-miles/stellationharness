# Test Infrastructure Visualizer

This project is a web-based application designed to visually represent a test infrastructure. It displays infrastructure nodes (EC2 instances, containers, databases, etc.) as draggable blocks with status indicators and connection lines showing relationships between components.

## Features

- **🔥 LIVE Multi-Cloud Integration**: Currently connected to real AWS EC2 + GCP Compute Engine instances
- **🌐 Complete Multi-Cloud Support**: Live AWS + GCP integration with Azure demo, smart provider detection
- **📊 Real Infrastructure Data**: Backend API serving live AWS EC2 + GCP Compute Engine details with fallback caching
- **🎯 Enhanced Node Display**: Wider blocks (250px) with professional multi-cloud formatting and improved text readability
- **🖱️ Interactive Drag & Drop**: Click and drag nodes to reposition them anywhere on the canvas
- **🚥 Live Status Indicators**: Real-time multi-cloud state mapping (🟢 running, 🟡 pending, 🔴 stopped)
- **🔗 Smart Connection Lines**: SVG arrows automatically following nodes with intelligent relationship discovery
- **📝 Comprehensive Tooltips**: Organized hover details with emojis showing instance metadata, network info, and tags
- **🎨 Cloud Provider Styling**: Visual gradients for AWS (orange), GCP (blue-green), Azure (blue) with environment borders
- **🔄 Real-time Refresh**: Live updates from AWS + GCP APIs with authenticated backend integration
- **🏗️ Professional Infrastructure Display**: Enterprise-ready visualization for hybrid cloud management
- **📱 Responsive Design**: Wider blocks with optimized spacing and full viewport utilization
- **⚡ Integration Testing**: Complete validation pipeline ensuring multi-cloud data flow integrity

## Project Structure

```
stellationharness/
├── 🚀 Core Application
│   ├── backend-server.js       # Express API server for AWS + GCP integration
│   ├── gcp-integration.js      # GCP Compute Engine service integration
│   ├── azure-integration.js    # Azure service integration
│   ├── cloud-utils.js          # Cloud utilities and helpers
│   ├── instances-config.json   # Instance configuration
│   └── package.json           # npm configuration with cloud SDKs
├── 📱 Frontend (src/)
│   ├── index.html             # Main visualizer interface
│   ├── management.html        # Infrastructure management interface
│   ├── css/                   # Stylesheets
│   ├── js/                    # JavaScript modules
│   └── assets/icons/          # Status indicator SVGs
├── 📚 Documentation (docs/)
│   ├── AWS_SETUP.md           # AWS integration setup
│   ├── GCP_SETUP.md           # GCP integration setup
│   ├── STARTUP_GUIDE.md       # Complete setup instructions
│   ├── QUICK_START.md         # Quick start guide
│   └── SECURITY_IMPLEMENTATION_COMPLETE.md
├── 🧪 Tests (tests/)
│   ├── test-integration.js    # Integration testing
│   ├── test-multi-cloud.js    # Multi-cloud testing
│   ├── verify-display.js      # Display verification
│   └── debug-*.js             # Debug utilities
├── 🎯 Demos (demos/)
│   ├── demo-add-instance.js   # Instance addition demo
│   ├── demo-auto-discovery.js # Auto-discovery demo
│   └── demo-auto-discovery-guide.js
├── ⚙️ Scripts (scripts/)
│   ├── START_VISUALIZER.bat   # Windows startup script
│   ├── Start-Visualizer.ps1   # PowerShell startup
│   ├── Update-ApiKey.ps1      # API key management
│   └── *.bat, *.ps1           # Various utilities
├── 🔐 Security (security/)
│   ├── auth-manager.js        # Authentication
│   ├── config-manager.js      # Configuration security
│   └── input-validation.js    # Input validation
└── 📊 Data & Config
    ├── config/                # API keys and secrets
    ├── data/                  # CSV and archived data
    └── assets/                # Jupyter notebooks, presentations
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

### 🚀 Live Multi-Cloud Integration
The visualizer is **currently connected** to real multi-cloud infrastructure:

#### **AWS Integration** 🔶
- **Target Instance**: Live EC2 instances via secure API integration
- **Instance Details**: Production environment instances with real-time monitoring
- **Real-time Data**: Backend API fetches live EC2 metadata, network info, and tags

#### **GCP Integration** 🔵
- **Target Instance**: Live GCP Compute Engine instances
- **Instance Details**: Production environment with real-time monitoring
- **Authentication**: Google Cloud CLI with application default credentials
- **Real-time Data**: Live GCP Compute Engine API with intelligent fallback caching

#### **Azure Demo** 🔷
- **Sample Environment**: Development container service demonstration
- **Professional Formatting**: Ready for live Azure integration expansion

### 🎯 Enhanced Multi-Cloud Display
Each node now shows with **250px width** for optimal text readability:
- **Environment/Provider**: AWS/Production, GCP/Production, Azure/Development
- **Service Type/Size**: EC2/t2.micro, Compute Engine/e2-small, Container/Standard_B2s  
- **Connection Info**: Real public IP addresses (184.72.110.200, 34.145.180.162)
- **Smart Tooltips**: Comprehensive hover details with organized sections and emojis
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
Run validation scripts to ensure complete multi-cloud pipeline integrity:
```bash
node test-integration.js    # Validates AWS + GCP backend → frontend → display
node test-multi-cloud.js    # Complete multi-cloud end-to-end testing
node verify-display.js      # Confirms multi-cloud formatting with wider blocks
```

## Multi-Cloud Integration

### ✅ Current Implementation - LIVE MULTI-CLOUD
The visualizer is **actively connected** to real multi-cloud infrastructure:

#### **🔶 AWS Integration**
- **🔗 Backend API**: Express server on port 3001 with AWS SDK integration
- **🎯 Target Instance**: Live EC2 instances via secure API integration
- **📊 Real Data Flow**: AWS API → Backend Server → Frontend → Visualization
- **🔄 Live Updates**: Real-time EC2 state, metadata, and network information

#### **🔵 GCP Integration**
- **🔗 Backend API**: Express server with Google Cloud Compute Engine integration
- **🎯 Target Instance**: gcpapp01 (8330479473297479604) in us-east4-b
- **📊 Real Data Flow**: GCP API → gcp-integration.js → Backend Server → Frontend
- **🔄 Live Updates**: Real-time Compute Engine data with intelligent fallback caching
- **🔐 Authentication**: Google Cloud CLI application default credentials

#### **🔷 Azure Ready**
- **🏗️ Infrastructure**: Professional formatting structure in place
- **🎯 Sample Integration**: Development container service demonstration
- **📈 Expansion Ready**: Architecture designed for seamless Azure API integration

### 🏗️ Architecture
```
AWS EC2 API ←→ backend-server.js (Port 3001) ←→ Frontend (Port 63302) ←→ User Interface
     ↓              ↓                           ↓                        ↓
Live Instance   Express + AWS SDK        React/JavaScript         Interactive Nodes
  Metadata      Authentication          Data Processing          Drag & Drop UI
```

### 🔧 Technical Implementation
- **Authentication**: AWS credentials via secure credential chain (IAM roles recommended)
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

## 📁 Project Organization

This project has been organized into logical folders to improve maintainability and navigation:

### 📚 **[docs/](./docs/)** - Documentation Hub
All setup guides, feature documentation, and project information in one place.
- AWS/GCP setup instructions
- Security implementation details
- Startup and quick-start guides

### 🧪 **[tests/](./tests/)** - Testing Suite
Complete testing infrastructure for validation and debugging.
- Integration tests and multi-cloud validation
- Display verification and debug utilities
- Live data connection testing

### 🎯 **[demos/](./demos/)** - Example Scripts
Interactive demonstrations and learning materials.
- Instance addition examples
- Auto-discovery feature demos
- Step-by-step configuration guides

### ⚙️ **[scripts/](./scripts/)** - Automation Tools
Startup scripts and utility tools for easy project management.
- Windows batch and PowerShell startup scripts
- API key management utilities
- Desktop shortcut creation tools

**Benefits of Organization:**
- ✅ Reduced root directory clutter (40+ files → 8 core files)
- ✅ Logical grouping by function and purpose
- ✅ Easier navigation and project understanding
- ✅ Clear separation of concerns
- ✅ Better maintainability for team development

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
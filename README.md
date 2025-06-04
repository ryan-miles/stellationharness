# Multi-Cloud Infrastructure Visualizer

This project is a comprehensive web-based application designed to visualize and manage multi-cloud infrastructure in real-time. It provides an interactive interface for monitoring AWS EC2 instances, GCP Compute Engine instances, and Azure resources with live data integration, advanced security features, and professional enterprise-grade visualization capabilities.

## Features

- **🔥 LIVE Multi-Cloud Integration**: Real-time connectivity to AWS EC2 (i-005557a2ed89a5759) + GCP Compute Engine (gcpapp01/8330479473297479604)
- **🌐 Complete Multi-Cloud Support**: Live AWS + GCP integration with Azure demo framework, intelligent provider detection
- **📊 Real Infrastructure Data**: Express.js backend API serving live AWS EC2 + GCP Compute Engine details with fallback mechanisms
- **🛡️ Enterprise Security**: Comprehensive security layer with API key authentication, JWT tokens, RBAC permissions, and input validation
- **🎯 Professional Node Display**: 250px wide nodes with multi-cloud formatting, status indicators, and enhanced readability
- **🖱️ Interactive Drag & Drop**: Full canvas repositioning with SVG connection lines that automatically follow nodes
- **🚥 Real-time Status Monitoring**: Live multi-cloud state mapping (🟢 running, 🟡 pending, 🔴 stopped, ⚙️ transitioning)
- **🔗 Intelligent Connection System**: SVG arrows with automatic relationship discovery and dynamic repositioning
- **📝 Rich Metadata Display**: Comprehensive tooltips with instance details, network info, tags, and organized hover information
- **🎨 Cloud Provider Theming**: Visual gradients and styling for AWS (orange), GCP (blue-green), Azure (blue) with environment borders
- **🔄 Live Data Refresh**: Real-time updates from cloud APIs with authenticated backend integration and caching
- **🏗️ Management Interface**: Dedicated administrative interface for instance visibility control and configuration management
- **📱 Responsive Design**: Optimized viewport utilization with professional spacing and mobile-friendly layout
- **⚡ Professional Testing Suite**: Complete validation pipeline with integration tests, multi-cloud verification, and live data testing
- **🔍 Auto-Discovery**: Automatic detection of new cloud instances with intelligent categorization
- **📊 Fallback Data Handling**: Graceful degradation to mock data when cloud APIs are unavailable

## Project Structure

```
stellationharness/
├── 🚀 Core Application
│   ├── backend-server.js       # Express API server (1401 lines) - Main multi-cloud integration hub
│   ├── gcp-integration.js      # GCP Compute Engine service integration (180 lines)
│   ├── azure-integration.js    # Azure service integration and demo framework (233 lines)
│   ├── cloud-utils.js          # Base CloudService class and utilities
│   ├── instances-config.json   # Instance configuration with real cloud instance IDs
│   └── package.json           # Dependencies including AWS SDK, Google Cloud SDK, Azure SDK
├── 📱 Frontend (src/)
│   ├── index.html             # Main visualizer interface with drag-and-drop canvas
│   ├── management.html        # Infrastructure management interface (512 lines)
│   ├── css/                   # Professional styling with cloud provider themes
│   ├── js/
│   │   ├── main.js            # Core frontend logic (1261 lines) - visualization engine
│   │   ├── aws-integration.js # AWS EC2 service integration (566 lines)
│   │   ├── node.js            # Node creation and visualization management
│   │   ├── config.js          # API configuration and endpoint management
│   │   └── cloud-utils.js     # Frontend cloud utilities
│   └── assets/icons/          # Status indicator SVGs and visual assets
├── 🔐 Security (security/)
│   ├── auth-manager.js        # Authentication system (514 lines) - JWT tokens, API keys
│   ├── config-manager.js      # Secure configuration management (395 lines)
│   └── input-validation.js    # Input validation and sanitization
├── 📚 Documentation (docs/)
│   ├── AWS_SETUP.md           # Complete AWS integration setup guide
│   ├── GCP_SETUP.md           # GCP Compute Engine integration setup
│   ├── STARTUP_GUIDE.md       # Comprehensive project setup instructions
│   ├── QUICK_START.md         # Fast-track setup guide
│   └── SECURITY_IMPLEMENTATION_COMPLETE.md  # Security architecture documentation
├── 🧪 Tests (tests/)
│   ├── test-integration.js    # End-to-end integration testing
│   ├── test-multi-cloud.js    # Multi-cloud provider validation
│   ├── verify-live-data.js    # Live data connection verification
│   ├── verify-display.js      # Frontend display validation
│   └── debug-*.js             # Debug utilities and troubleshooting tools
├── 🎯 Demos (demos/)
│   ├── demo-add-instance.js   # Instance addition demonstration
│   ├── demo-auto-discovery.js # Auto-discovery feature demonstration
│   └── demo-auto-discovery-guide.js  # Step-by-step auto-discovery guide
├── ⚙️ Scripts (scripts/)
│   ├── START_VISUALIZER.bat   # Windows batch startup script
│   ├── Start-Visualizer.ps1   # PowerShell automated startup (comprehensive)
│   ├── Update-ApiKey.ps1      # API key management and rotation
│   └── *.bat, *.ps1           # Various automation utilities
├── 📊 Data & Config
│   ├── config/                # Secure API keys and configuration files
│   ├── data/                  # CSV exports and archived data
│   └── assets/                # Jupyter notebooks, presentations, documentation
└── 📁 Archive & Legacy
    └── Various backup and legacy files
```

## Setup Instructions

### 🚀 Quick Start (Recommended)

**Automated PowerShell Setup:**
```powershell
# Navigate to project directory
cd stellationharness
# Run automated startup script
.\scripts\Start-Visualizer.ps1
# This will install dependencies, start backend (port 3001), and frontend (port 63302)
```

### 🔧 Manual Setup

1. **Clone and Install Dependencies**:
   ```bash
   git clone <repository>
   cd stellationharness
   npm install
   ```

2. **Configure Cloud Authentication**:
   - **AWS**: Set up AWS credentials (see `docs/AWS_SETUP.md`)
   - **GCP**: Configure Google Cloud CLI authentication (see `docs/GCP_SETUP.md`)
   - **Azure**: Azure SDK configuration (framework ready)

3. **Start Backend API Server**:
   ```bash
   node backend-server.js
   # Express server starts on http://localhost:3001
   # Provides endpoints: /api/ec2-instances, /api/gcp-instances, /api/azure-instances
   ```

4. **Start Frontend Development Server**:
   ```bash
   npm run start
   # Opens browser automatically at http://127.0.0.1:63302
   # Alternative: Use npm run dev for development mode
   ```

5. **Verify Multi-Cloud Integration**:
   ```bash
   node tests/test-integration.js    # Complete pipeline validation
   node tests/test-multi-cloud.js   # Multi-provider testing
   node tests/verify-live-data.js   # Live data connection test
   ```

### 🌐 Alternative: Simple HTTP Server
For frontend-only development:
```bash
cd src/
# Using Python 3
python -m http.server 8000
# Using Node.js
npx http-server -p 8000
```
Open `http://localhost:8000` in your browser (limited to mock data without backend)

## Usage

### 🚀 Real-Time Multi-Cloud Infrastructure

The visualizer is **actively connected** to live multi-cloud infrastructure with real instance data:

#### **🔶 AWS Integration** 
- **Live Instance**: `i-005557a2ed89a5759` (Real EC2 instance)
- **Instance Details**: Production environment with real-time monitoring 
- **Public IP**: `184.72.110.200` (Live accessible endpoint)
- **Instance Type**: `t2.micro` running Amazon Linux
- **Real-time Data**: Backend API fetches live EC2 metadata, security groups, and tags

#### **🔵 GCP Integration**
- **Live Instance**: `gcpapp01` (Instance ID: `8330479473297479604`)
- **Zone**: `us-east4-b` in `finance-is` project
- **Instance Type**: `e2-small` running Ubuntu
- **Authentication**: Google Cloud CLI with application default credentials
- **Real-time Data**: Live GCP Compute Engine API with intelligent fallback caching

#### **🔷 Azure Demo Framework**
- **Sample Environment**: Container service demonstration ready for expansion
- **Professional Formatting**: Complete integration architecture in place
- **Expansion Ready**: `azure-integration.js` framework for live Azure API integration

### 🎯 Professional Enterprise Display

Each infrastructure node displays with **250px width** for optimal enterprise readability:
- **Multi-Cloud Headers**: AWS/Production, GCP/Production, Azure/Development with provider-specific styling
- **Service Information**: EC2/t2.micro, Compute Engine/e2-small, Container/Standard_B2s with instance type details
- **Network Details**: Real public IP addresses, availability zones, and connectivity information
- **Status Indicators**: Real-time state mapping (🟢 running, 🟡 pending, 🔴 stopped, ⚙️ transitioning)
- **Rich Tooltips**: Comprehensive hover details with organized metadata sections and emojis

### 🖱️ Interactive Visualization Features
- **Full Canvas Drag & Drop**: Click and hold any node to reposition anywhere on the visualization canvas
- **Live Status Updates**: Real cloud instance states mapped to visual indicators with automatic refresh
- **Dynamic SVG Connections**: Intelligent arrows that automatically follow dragged nodes and maintain relationships  
- **Data Refresh Controls**: Manual refresh buttons for latest cloud provider information
- **Environment Styling**: Production (green), Development (blue), Staging (orange) visual border cues
- **Layout Persistence**: Node positions maintained during data refreshes, reset with browser refresh

### 🏗️ Management Interface
Access the dedicated management interface at `/management.html`:
- **Instance Visibility Control**: Toggle display of individual cloud instances
- **Configuration Management**: Update instance metadata and display preferences
- **Multi-Cloud Overview**: Consolidated view of all connected cloud providers
- **Administrative Controls**: User management and system configuration options

### 🔧 Integration Testing & Validation
Comprehensive testing suite ensures multi-cloud pipeline integrity:
```bash
node tests/test-integration.js    # End-to-end AWS + GCP backend → frontend → display
node tests/test-multi-cloud.js    # Complete multi-provider validation and error handling  
node tests/verify-live-data.js    # Live cloud API connection testing
node tests/verify-display.js      # Frontend formatting and visualization validation
```

## Multi-Cloud Architecture & Implementation

### 🏗️ Enterprise Architecture Overview
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Multi-Cloud Infrastructure                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  AWS EC2 API        GCP Compute API        Azure Resource API                   │
│       ↓                    ↓                      ↓                             │
│  aws-integration.js   gcp-integration.js   azure-integration.js                 │
│       ↓                    ↓                      ↓                             │
│              backend-server.js (Express - Port 3001)                           │
│                           ↓                                                     │
│                   Security Layer                                                │
│              ┌─────────────────────────────┐                                   │
│              │  - JWT Authentication      │                                   │
│              │  - API Key Management      │                                   │
│              │  - RBAC Permissions        │                                   │
│              │  - Input Validation        │                                   │
│              └─────────────────────────────┘                                   │
│                           ↓                                                     │
│                Frontend (Port 63302)                                           │
│              ┌─────────────────────────────┐                                   │
│              │  - Interactive Canvas      │                                   │
│              │  - Drag & Drop Nodes       │                                   │
│              │  - Real-time Updates       │                                   │
│              │  - Management Interface    │                                   │
│              └─────────────────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### ✅ Current Implementation Status

#### **🔶 AWS Integration** - LIVE & PRODUCTION
- **🔗 Service**: Complete AWS EC2 integration with live instance monitoring
- **🎯 Current Instance**: `i-005557a2ed89a5759` (Production t2.micro instance)
- **📊 Data Pipeline**: AWS SDK → `backend-server.js` → Frontend → Interactive Visualization
- **🔄 Real-time Features**: Live EC2 state monitoring, metadata refresh, network information
- **🔐 Authentication**: AWS credential chain with IAM role support and security best practices
- **📍 Endpoint**: `/api/ec2-instances` with comprehensive instance metadata

#### **🔵 GCP Integration** - LIVE & PRODUCTION  
- **🔗 Service**: Google Cloud Compute Engine integration with live monitoring
- **🎯 Current Instance**: `gcpapp01` (ID: `8330479473297479604`) in `us-east4-b`
- **📊 Data Pipeline**: GCP Compute API → `gcp-integration.js` → Backend → Frontend
- **🔄 Real-time Features**: Live Compute Engine data with intelligent caching and fallback mechanisms
- **🔐 Authentication**: Google Cloud CLI application default credentials
- **📍 Endpoint**: `/api/gcp-instances` with Compute Engine metadata and zone information

#### **🔷 Azure Integration** - FRAMEWORK READY
- **🏗️ Architecture**: Complete integration framework with demo data structure
- **🎯 Demo Environment**: Professional container service demonstration (233 lines)
- **📊 Data Pipeline**: Azure SDK foundation → `azure-integration.js` → Backend integration ready
- **🔄 Expansion Ready**: Architecture designed for seamless Azure Resource Manager API integration
- **📍 Endpoint**: `/api/azure-instances` infrastructure prepared for live Azure connectivity

### 🔧 Technical Implementation Details

#### **Security & Authentication System**
- **🔐 Authentication Manager** (`auth-manager.js` - 514 lines):
  - JWT token generation and validation
  - API key management and rotation
  - Role-based access control (RBAC) with granular permissions
  - Session management and security headers

- **⚙️ Configuration Manager** (`config-manager.js` - 395 lines):
  - Secure credential storage and retrieval
  - Environment-specific configuration management
  - Encryption of sensitive configuration data
  - Dynamic configuration updates without restart

- **🛡️ Input Validation** (`input-validation.js`):
  - Comprehensive request sanitization
  - SQL injection and XSS prevention
  - API rate limiting and abuse protection
  - Schema validation for all endpoints

#### **Data Flow & Processing**
1. **Cloud Provider APIs**: Direct integration with AWS SDK, GCP Client Libraries, Azure SDK
2. **Backend Processing**: Express.js server with cloud-specific integration modules
3. **Security Layer**: Authentication, authorization, and input validation middleware
4. **Frontend Processing**: JavaScript modules for data transformation and visualization
5. **Interactive Display**: SVG-based canvas with drag-and-drop functionality and real-time updates

#### **Error Handling & Resilience**
- **Graceful Degradation**: Automatic fallback to cached/mock data when APIs unavailable
- **Retry Logic**: Intelligent retry mechanisms with exponential backoff
- **Circuit Breaker**: Protection against cascading failures across cloud providers
- **Monitoring**: Comprehensive logging and error tracking for production reliability

### 📈 Advanced Multi-Cloud Features

#### **🎯 Intelligent Cloud Detection**
- **Provider Identification**: Automatic detection from instance IDs, hostnames, and metadata patterns
- **Service Classification**: Smart categorization of EC2, Compute Engine, Virtual Machines, Containers
- **Environment Mapping**: Production/Development/Staging classification with visual styling
- **Resource Tagging**: Comprehensive tag management and display across all cloud providers

#### **🔗 Smart Relationship Discovery**
- **Network Topology**: Automatic discovery of network relationships and dependencies
- **Service Dependencies**: Intelligent mapping of application-level connections
- **Load Balancer Relationships**: Detection of load balancer to instance associations
- **Database Connections**: Identification of database and application server relationships

#### **💡 Enterprise Management Features**
- **Centralized Configuration**: Single configuration management across all cloud providers
- **Bulk Operations**: Multi-select operations for instance management and configuration
- **Export Capabilities**: CSV export functionality for reporting and analysis
- **Audit Logging**: Comprehensive audit trail for all administrative actions

### 🔧 Connecting to Your Own Cloud Infrastructure

To integrate with your own cloud infrastructure:

#### **AWS Setup** (See `docs/AWS_SETUP.md` for complete guide)
1. **AWS Credentials Configuration**:
   ```bash
   aws configure
   # Or use IAM roles, environment variables, or credential files
   ```

2. **Required IAM Permissions**:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "ec2:DescribeInstances",
           "ec2:DescribeInstanceStatus",
           "ec2:DescribeTags"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

3. **Backend Configuration**: Update `instances-config.json` with your instance IDs
4. **Security Best Practices**: Use IAM roles and least-privilege access

#### **GCP Setup** (See `docs/GCP_SETUP.md` for complete guide)
1. **Google Cloud CLI Authentication**:
   ```bash
   gcloud auth application-default login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Required APIs**: Enable Compute Engine API in your GCP project
3. **Service Account**: Configure service account with Compute Engine read permissions
4. **Configuration**: Update project ID and zone information in `gcp-integration.js`

## Customization

### 🔧 Adding New Cloud Infrastructure

#### **Multi-Cloud Node Configuration**
Edit `instances-config.json` to add your infrastructure:

```json
{
  "instances": [
    {
      "id": "i-your-instance-id",
      "title": "Your-Server-Name", 
      "cloudProvider": "AWS",
      "environment": "Production",
      "instanceType": "t3.medium",
      "availabilityZone": "us-east-1a",
      "position": { "x": 200, "y": 300 }
    },
    {
      "id": "your-gcp-instance",
      "title": "GCP-Server-Name",
      "cloudProvider": "GCP", 
      "environment": "Development",
      "instanceType": "e2-standard-4",
      "zone": "us-central1-b",
      "position": { "x": 400, "y": 300 }
    }
  ],
  "connections": [
    {
      "from": "i-your-instance-id",
      "to": "your-gcp-instance", 
      "label": "Cross-Cloud Connection",
      "connectionType": "HTTPS/443"
    }
  ]
}
```

#### **Advanced Node Properties**
For custom node types, extend the node structure in `src/js/main.js`:

```javascript
const customNodes = [
    {
        // Core identification
        id: 'unique-instance-id',
        type: 'EC2|VM|Compute|Container|Database',
        title: 'Display-Name',
        
        // Cloud provider details
        cloudProvider: 'AWS|GCP|Azure|Custom',
        environment: 'Production|Development|Staging',
        instanceType: 'instance-size-sku',
        
        // Network information
        hostname: 'server.domain.com',
        ip: 'public-ip-address',
        privateIp: 'private-ip-address',
        
        // Status and monitoring
        status: 'running|stopped|pending|terminated',
        healthStatus: 'healthy|unhealthy|unknown',
        
        // Location and placement
        region: 'cloud-region',
        availabilityZone: 'availability-zone',
        
        // Visualization properties
        position: { x: 150, y: 300 },
        
        // Additional metadata
        tags: {
            'Environment': 'Production',
            'Team': 'Infrastructure',
            'Project': 'WebApp'
        },
        
        // Custom properties for specific needs
        customMetadata: {
            // Add any additional properties needed
        }
    }
];
```

#### **Connection Relationship Types**
Define intelligent connections between infrastructure components:

```javascript
const infrastructureConnections = [
    {
        from: 'web-server-id',
        to: 'database-id',
        label: 'Database Connection',
        connectionType: 'TCP/3306',
        protocol: 'MySQL',
        ports: ['3306'],
        encrypted: true
    },
    {
        from: 'load-balancer-id', 
        to: 'web-server-id',
        label: 'Load Balanced Traffic',
        connectionType: 'HTTPS/443',
        protocol: 'HTTP/HTTPS',
        ports: ['80', '443'],
        healthCheck: true
    }
];
```

### 🎨 Visual Styling Customization

#### **Cloud Provider Themes** (`src/css/components.css`)
Customize visual gradients and colors for each cloud provider:

```css
/* AWS Styling - Orange Theme */
.node.aws {
    background: linear-gradient(135deg, #FF9900 0%, #FF7700 100%);
    border: 2px solid #FF7700;
}

/* GCP Styling - Blue-Green Theme */  
.node.gcp {
    background: linear-gradient(135deg, #4285F4 0%, #34A853 100%);
    border: 2px solid #4285F4;
}

/* Azure Styling - Blue Theme */
.node.azure {
    background: linear-gradient(135deg, #0078D4 0%, #106EBE 100%);
    border: 2px solid #0078D4;
}

/* Custom Provider Styling */
.node.custom {
    background: linear-gradient(135deg, #6C757D 0%, #495057 100%);
    border: 2px solid #6C757D;
}
```

#### **Environment Border Styling**
Visual indicators for different environments:

```css
/* Production Environment - Green Border */
.node.production {
    border-left: 5px solid #28A745;
}

/* Development Environment - Blue Border */
.node.development {
    border-left: 5px solid #007BFF;  
}

/* Staging Environment - Orange Border */
.node.staging {
    border-left: 5px solid #FD7E14;
}
```

#### **Status Indicator Customization**
Update status indicators and their colors:

```css
.status-indicator.running { color: #28A745; }    /* Green */
.status-indicator.stopped { color: #DC3545; }    /* Red */
.status-indicator.pending { color: #FFC107; }    /* Yellow */
.status-indicator.transitioning { color: #6F42C1; } /* Purple */
```

### 🔧 Advanced Configuration Options

#### **API Endpoint Customization** (`src/js/config.js`)
Configure API endpoints and polling intervals:

```javascript
const config = {
    apiEndpoints: {
        aws: '/api/ec2-instances',
        gcp: '/api/gcp-instances', 
        azure: '/api/azure-instances',
        custom: '/api/custom-instances'
    },
    
    refreshIntervals: {
        realTime: 30000,      // 30 seconds for real-time data
        standard: 300000,     // 5 minutes for standard refresh
        slow: 900000          // 15 minutes for slow refresh
    },
    
    visualization: {
        nodeWidth: 250,       // Node width in pixels
        nodeHeight: 150,      // Node height in pixels
        connectionThickness: 2, // SVG line thickness
        animationDuration: 300  // Animation duration in milliseconds
    }
};
```

#### **Auto-Discovery Configuration**
Configure automatic instance discovery:

```javascript
const autoDiscovery = {
    enabled: true,
    scanInterval: 600000,    // 10 minutes
    providers: ['AWS', 'GCP'], // Providers to scan
    filters: {
        tags: ['Environment=Production', 'Monitored=true'],
        states: ['running', 'pending']
    }
};
```

## 🧪 Development & Testing

### 🔬 Comprehensive Testing Suite

The project includes a professional testing infrastructure with multiple validation layers:

#### **Integration Testing**
```bash
# End-to-end pipeline validation
node tests/test-integration.js
# Tests: Backend API → Frontend Processing → Display Rendering
# Validates: Data flow, API connectivity, frontend integration
```

#### **Multi-Cloud Provider Testing**
```bash  
# Complete multi-provider validation
node tests/test-multi-cloud.js
# Tests: AWS + GCP + Azure integration, error handling, fallback mechanisms
# Validates: Cross-cloud compatibility, data normalization, provider-specific features
```

#### **Live Data Connection Testing**
```bash
# Real-time cloud API connectivity
node tests/verify-live-data.js
# Tests: AWS EC2 API, GCP Compute Engine API, authentication, rate limiting
# Validates: Live instance data retrieval, API health, credential validation
```

#### **Frontend Display Validation**
```bash
# User interface and visualization testing
node tests/verify-display.js  
# Tests: Node rendering, drag-and-drop, SVG connections, responsive design
# Validates: Visual formatting, interaction responsiveness, cross-browser compatibility
```

#### **Backend API Testing**
```bash
# Direct API endpoint validation
curl http://localhost:3001/api/ec2-instances    # AWS endpoint
curl http://localhost:3001/api/gcp-instances    # GCP endpoint  
curl http://localhost:3001/api/azure-instances  # Azure endpoint

# Authentication testing
curl -H "Authorization: Bearer your-jwt-token" http://localhost:3001/api/secured-endpoint
```

### 🔧 Development Workflow

#### **Development Environment Setup**
1. **Backend Development**: 
   - Modify `backend-server.js` for API changes and new endpoints
   - Update cloud integration modules (`gcp-integration.js`, `azure-integration.js`)
   - Enhance security layer (`security/auth-manager.js`, `security/config-manager.js`)

2. **Frontend Development**:
   - Update `src/js/main.js` for core visualization logic (1261 lines)
   - Modify `src/js/aws-integration.js` for AWS-specific data processing (566 lines)
   - Enhance `src/js/node.js` for display formatting and interaction

3. **Security Enhancements**:
   - Update authentication in `security/auth-manager.js` (514 lines)  
   - Modify configuration management in `security/config-manager.js` (395 lines)
   - Enhance input validation in `security/input-validation.js`

4. **UI/UX Improvements**:
   - Customize styling in `src/css/components.css` for visual appearance
   - Update `src/management.html` for administrative interface enhancements (512 lines)
   - Modify responsive design and mobile compatibility

#### **Testing During Development**
```bash
# Run all tests before committing changes
npm run test:all

# Individual test categories
npm run test:integration     # Integration tests
npm run test:multi-cloud     # Multi-cloud tests  
npm run test:frontend       # Frontend validation
npm run test:backend        # Backend API tests
```

#### **Debug Mode & Troubleshooting**
- **Debug HTML**: Use `test.html` - single-file debug version with inline CSS/JavaScript
- **Browser DevTools**: Monitor Network tab for API calls and data flow analysis
- **Console Logging**: Comprehensive logging throughout `aws-integration.js`, `node.js`, and `main.js`
- **Backend Debugging**: Express.js debug mode with detailed request/response logging

### 📊 Performance Testing

#### **Load Testing**
```bash
# API endpoint load testing
node tests/performance/load-test-api.js
# Tests: Concurrent API requests, response times, memory usage

# Frontend performance testing  
node tests/performance/load-test-frontend.js
# Tests: Node rendering performance, drag-and-drop responsiveness, memory leaks
```

#### **Scalability Testing**
```bash
# Large infrastructure testing
node tests/scalability/test-large-infrastructure.js
# Tests: 100+ nodes, complex connections, performance with scale

# Multi-tenant testing
node tests/scalability/test-multi-tenant.js  
# Tests: Multiple users, concurrent sessions, resource isolation
```

### 🔍 Code Quality & Standards

#### **Linting & Code Standards**
```bash
# ESLint for JavaScript code quality
npm run lint

# Prettier for code formatting
npm run format

# Security vulnerability scanning
npm audit
```

#### **Documentation Standards**
- **API Documentation**: Comprehensive JSDoc comments in all backend modules
- **Frontend Documentation**: Detailed comments in visualization and interaction code
- **Setup Guides**: Complete setup documentation in `docs/` folder
- **Architecture Documentation**: System design and data flow documentation

### 🚀 Deployment & Production

#### **Production Deployment**
```bash
# Production build
npm run build:production

# Docker containerization
docker build -t infrastructure-visualizer .
docker run -p 3001:3001 -p 63302:63302 infrastructure-visualizer

# Environment configuration
export NODE_ENV=production
export AWS_REGION=us-east-1
export GCP_PROJECT_ID=your-project-id
```

#### **Monitoring & Observability**
- **Application Monitoring**: Built-in health checks and metrics endpoints
- **Error Tracking**: Comprehensive error logging and reporting
- **Performance Metrics**: API response times, frontend rendering performance
- **Security Monitoring**: Authentication attempts, API usage patterns

### 🛠️ Development Tools & Utilities

#### **Automated Scripts**
- **`scripts/Start-Visualizer.ps1`**: Complete development environment setup
- **`scripts/Update-ApiKey.ps1`**: API key management and rotation
- **`demos/demo-auto-discovery.js`**: Auto-discovery feature demonstration
- **`demos/demo-add-instance.js`**: Instance addition workflow demonstration

#### **Configuration Management**
- **Environment Variables**: Secure credential and configuration management
- **Configuration Files**: `instances-config.json` for infrastructure definition
- **Dynamic Configuration**: Runtime configuration updates without restart

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

## 🛡️ Security Implementation

### 🔐 Enterprise-Grade Security Architecture

The project implements comprehensive security measures suitable for enterprise infrastructure management:

#### **Authentication & Authorization**
- **JWT Token System**: Secure token-based authentication with configurable expiration
- **API Key Management**: Rotating API keys with automated renewal capabilities
- **Role-Based Access Control (RBAC)**: Granular permissions for different user roles
- **Session Management**: Secure session handling with proper timeout and invalidation

#### **Data Protection**
- **Encryption at Rest**: Sensitive configuration data encrypted using industry standards
- **Encryption in Transit**: All API communications secured with HTTPS/TLS
- **Credential Security**: Cloud provider credentials managed through secure credential chains
- **Input Sanitization**: Comprehensive input validation preventing injection attacks

#### **Security Components**
```bash
security/
├── auth-manager.js        # Authentication system (514 lines)
│   ├── JWT token generation/validation
│   ├── API key management and rotation  
│   ├── Role-based access control
│   └── Session security and timeout handling
│
├── config-manager.js      # Secure configuration (395 lines)
│   ├── Encrypted credential storage
│   ├── Environment-specific configs
│   ├── Dynamic configuration updates
│   └── Secure key-value management
│
└── input-validation.js    # Input validation & sanitization
    ├── Request parameter validation
    ├── SQL injection prevention
    ├── XSS attack prevention
    └── API rate limiting
```

#### **Security Best Practices**
- **Principle of Least Privilege**: Minimal required permissions for cloud provider access
- **Security Headers**: Comprehensive HTTP security headers (HSTS, CSP, X-Frame-Options)
- **Audit Logging**: Complete audit trail of authentication and administrative actions
- **Error Handling**: Secure error responses that don't leak sensitive information

#### **Cloud Provider Security**
- **AWS**: IAM roles with minimal EC2 read permissions, credential rotation support
- **GCP**: Service account authentication with Compute Engine read-only access
- **Azure**: Managed identity integration with Resource Manager API access

For complete security implementation details, see `docs/SECURITY_IMPLEMENTATION_COMPLETE.md`

## 🎯 Key Technical Highlights

### 📊 Code Metrics & Project Scale
- **Total Backend Code**: 2,000+ lines across core integration modules
- **Frontend Visualization**: 1,800+ lines of interactive JavaScript
- **Security Implementation**: 1,300+ lines of enterprise security code
- **Testing Suite**: 500+ lines of comprehensive validation scripts
- **Documentation**: 15+ detailed setup and implementation guides

### 🌟 Advanced Features
- **Real Infrastructure Connectivity**: Live AWS EC2 (`i-005557a2ed89a5759`) + GCP Compute Engine (`gcpapp01`)
- **Professional Visualization**: 250px wide nodes with provider-specific styling and status indicators
- **Enterprise Security**: JWT authentication, RBAC permissions, encrypted configuration management
- **Intelligent Auto-Discovery**: Automatic detection and categorization of new cloud instances
- **Management Interface**: Dedicated administrative interface for system configuration and monitoring
- **Comprehensive Testing**: Multi-layer testing suite with integration, performance, and security validation

### 🚀 Production-Ready Capabilities
- **High Availability**: Graceful degradation and fallback mechanisms for cloud API unavailability
- **Scalability**: Architecture designed to handle 100+ infrastructure nodes with optimal performance
- **Monitoring**: Built-in health checks, performance metrics, and comprehensive logging
- **Deployment**: Docker containerization support with environment-specific configuration
- **Maintenance**: Automated scripts for deployment, updates, and system management

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
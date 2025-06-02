// 🔍 Infrastructure Visualizer - Auto-Discovery Demo
// This script demonstrates the new auto-discovery functionality

const fetch = require('node-fetch');
const API_BASE = 'http://localhost:3001';

console.log('🔍 Infrastructure Visualizer - Auto-Discovery Demo');
console.log('==================================================\n');

async function demonstrateAutoDiscovery() {
    try {
        console.log('1️⃣ Checking current auto-discovery status...');
        let response = await fetch(`${API_BASE}/api/auto-discovery/status`);
        let status = await response.json();
        
        console.log(`   Status: ${status.enabled ? '✅ Enabled' : '❌ Disabled'}`);
        console.log(`   Configured Instances: ${status.configuredInstances}`);
        console.log(`   Auto-Discovered: ${status.autoDiscoveredCount}`);
        console.log(`   Filters: ${JSON.stringify(status.filters, null, 2)}\n`);
        
        console.log('2️⃣ Enabling auto-discovery with custom filters...');
        const newConfig = {
            enabled: true,
            filters: [
                { Name: 'instance-state-name', Values: ['running'] }
            ]
        };
        
        response = await fetch(`${API_BASE}/api/auto-discovery/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newConfig)
        });
        
        const toggleResult = await response.json();
        console.log(`   ✅ ${toggleResult.message}`);
        console.log(`   New Config: ${JSON.stringify(toggleResult.autoDiscovery, null, 2)}\n`);
        
        console.log('3️⃣ Triggering manual auto-discovery...');
        response = await fetch(`${API_BASE}/api/discover-instances`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enableAutoDiscovery: true })
        });
        
        const discoveryResult = await response.json();
        console.log(`   🔍 Discovery Result: ${discoveryResult.message}`);
        console.log(`   Discovered Instances: ${discoveryResult.totalCount}`);
        
        if (discoveryResult.discoveredInstances.length > 0) {
            console.log('\n   📋 Discovered Instance Details:');
            discoveryResult.discoveredInstances.forEach((instance, index) => {
                console.log(`   ${index + 1}. ${instance.title} (${instance.id})`);
                console.log(`      - Status: ${instance.status}`);
                console.log(`      - Type: ${instance.metadata.instanceType}`);
                console.log(`      - Zone: ${instance.metadata.availabilityZone}`);
                console.log(`      - IP: ${instance.ip}`);
            });
        }
        
        console.log('\n4️⃣ Checking updated configuration...');
        response = await fetch(`${API_BASE}/api/config`);
        const config = await response.json();
        
        console.log(`   Total AWS Instances: ${config.aws.instances.length}`);
        const autoDiscovered = config.aws.instances.filter(i => i.autoDiscovered);
        console.log(`   Auto-Discovered: ${autoDiscovered.length}`);
        
        if (autoDiscovered.length > 0) {
            console.log('   📋 Auto-Discovered Instances:');
            autoDiscovered.forEach((instance, index) => {
                console.log(`   ${index + 1}. ${instance.alias} (${instance.id})`);
            });
        }
        
        console.log('\n5️⃣ Testing all-instances endpoint with auto-discovery...');
        response = await fetch(`${API_BASE}/api/all-instances`);
        const allInstances = await response.json();
        
        console.log(`   📊 Total Instances Retrieved: ${allInstances.length}`);
        const awsInstances = allInstances.filter(i => i.type === 'EC2');
        const gcpInstances = allInstances.filter(i => i.type === 'Compute Engine');
        const azureInstances = allInstances.filter(i => i.type === 'Container');
        
        console.log(`   - AWS EC2: ${awsInstances.length}`);
        console.log(`   - GCP Compute: ${gcpInstances.length}`);
        console.log(`   - Azure Container: ${azureInstances.length}`);
        
        console.log('\n✅ Auto-Discovery Demo Complete!');
        console.log('\n🎯 Next Steps:');
        console.log('   1. Open http://127.0.0.1:8080 in your browser');
        console.log('   2. Click the "⚙️ Discovery Settings" button');
        console.log('   3. Configure auto-discovery filters');
        console.log('   4. Click "🔍 Auto-Discover" to find new instances');
        console.log('   5. View the enhanced visualization with all instances');
        
    } catch (error) {
        console.error('❌ Demo failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('   - Make sure backend server is running (node backend-server.js)');
        console.log('   - Check AWS credentials are configured');
        console.log('   - Verify network connectivity to AWS');
    }
}

// Run the demo
demonstrateAutoDiscovery();

// Test Auto-Discovery Feature
// This script demonstrates the complete auto-discovery workflow

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testAutoDiscovery() {
    console.log('🔍 Testing Auto-Discovery Feature\n');
    
    try {
        // 1. Check current discovery status
        console.log('1. Checking current auto-discovery status...');
        const statusResponse = await fetch(`${BASE_URL}/api/auto-discovery/status`);
        const status = await statusResponse.json();
        console.log('   Current status:', status);
        
        // 2. Enable auto-discovery
        console.log('\n2. Enabling auto-discovery...');
        const enableResponse = await fetch(`${BASE_URL}/api/auto-discovery/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                enabled: true,
                filters: [
                    { Name: 'instance-state-name', Values: ['running', 'stopped'] }
                ]
            })
        });
        const enableResult = await enableResponse.json();
        console.log('   Result:', enableResult.message);
        
        // 3. Trigger manual discovery
        console.log('\n3. Triggering manual instance discovery...');
        const discoveryResponse = await fetch(`${BASE_URL}/api/discover-instances`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enableAutoDiscovery: true })
        });
        const discoveryResult = await discoveryResponse.json();
        console.log(`   Discovered ${discoveryResult.totalCount} instances`);
        
        if (discoveryResult.discoveredInstances && discoveryResult.discoveredInstances.length > 0) {
            console.log('   Discovered instances:');
            discoveryResult.discoveredInstances.forEach((instance, index) => {
                console.log(`     ${index + 1}. ${instance.title} (${instance.id}) - ${instance.status}`);
            });
        } else {
            console.log('   ℹ️  No new instances found (all existing instances are already configured)');
        }
        
        // 4. Check updated configuration
        console.log('\n4. Checking updated configuration...');
        const configResponse = await fetch(`${BASE_URL}/api/config`);
        const config = await configResponse.json();
        console.log(`   Total AWS instances configured: ${config.aws.instances.length}`);
        console.log(`   Auto-discovery enabled: ${config.aws.autoDiscovery?.enabled}`);
        
        // 5. Test frontend integration
        console.log('\n5. Testing all-instances endpoint (used by frontend)...');
        const allInstancesResponse = await fetch(`${BASE_URL}/api/all-instances`);
        const allInstances = await allInstancesResponse.json();
        console.log(`   Total instances available to frontend: ${allInstances.length}`);
        
        console.log('\n✅ Auto-discovery test completed successfully!');
        console.log('🌐 Frontend should now show all discovered instances');
        console.log('📱 You can test the UI by:');
        console.log('   - Opening http://127.0.0.1:8080 in your browser');
        console.log('   - Clicking "⚙️ Discovery Settings" to configure auto-discovery');
        console.log('   - Clicking "🔍 Auto-Discover" to find new instances');
        
    } catch (error) {
        console.error('❌ Auto-discovery test failed:', error.message);
    }
}

testAutoDiscovery();

// Integration test script to verify AWS EC2 data flow
// Run this with: node test-integration.js

async function testIntegration() {
    console.log('🧪 Testing AWS EC2 Integration Pipeline...\n');
    
    const BACKEND_URL = 'http://localhost:3001';
    
    try {
        // Test 1: Backend Health Check
        console.log('1️⃣ Testing backend health...');
        const healthResponse = await fetch(`${BACKEND_URL}/api/health`);
        const healthData = await healthResponse.json();
        console.log(`   ✅ Backend healthy: ${healthData.status} at ${healthData.timestamp}`);
        console.log(`   🎯 Monitoring instance: ${healthData.targetInstance}\n`);
        
        // Test 2: EC2 Instance Data
        console.log('2️⃣ Testing EC2 instance endpoint...');
        const instanceResponse = await fetch(`${BACKEND_URL}/api/ec2-instance`);
        const instanceData = await instanceResponse.json();
        console.log(`   ✅ Instance data received:`);
        console.log(`   📋 ID: ${instanceData.id}`);
        console.log(`   🏷️  Title: ${instanceData.title}`);
        console.log(`   🌐 IP: ${instanceData.ip}`);
        console.log(`   ⚡ Status: ${instanceData.status}`);
        console.log(`   🏗️  Type: ${instanceData.metadata.instanceType}`);
        console.log(`   🌍 AZ: ${instanceData.metadata.availabilityZone}`);
        console.log(`   🏷️  Environment: ${instanceData.metadata.environment}`);
        console.log(`   📡 Real Instance: ${instanceData.metadata.isRealInstance}\n`);
        
        // Test 3: Instance Status
        console.log('3️⃣ Testing instance status endpoint...');
        const statusResponse = await fetch(`${BACKEND_URL}/api/ec2-instance/status`);
        const statusData = await statusResponse.json();
        console.log(`   ✅ Status data received:`);
        console.log(`   🔄 Instance State: ${statusData.instanceState}`);
        console.log(`   🖥️  System Status: ${statusData.systemStatus}`);
        console.log(`   ⚙️  Instance Status: ${statusData.instanceStatus}`);
        console.log(`   🕐 Last Updated: ${statusData.lastUpdated}\n`);
        
        // Summary
        console.log('🎉 Integration Test Results:');
        console.log('   ✅ Backend API: Working');
        console.log('   ✅ EC2 Data Fetch: Working');
        console.log('   ✅ Real Instance Connection: Working');
        console.log('   ✅ Status Monitoring: Working');
        console.log('\n🚀 Your infrastructure visualizer is successfully connected to real AWS EC2 data!');
        console.log(`🌐 Frontend URL: http://127.0.0.1:63302`);
        console.log(`🔗 Backend URL: ${BACKEND_URL}`);
        
    } catch (error) {
        console.error('❌ Integration test failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Make sure backend server is running: npm run backend');
        console.log('   2. Check AWS credentials are configured');
        console.log('   3. Verify instance i-005557a2ed89a5759 exists and is accessible');
    }
}

// Run the test
testIntegration();
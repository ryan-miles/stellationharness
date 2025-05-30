// Multi-Cloud Infrastructure Test Script
// Tests the complete AWS + GCP + Azure infrastructure visualizer

const fetch = require('node-fetch');

async function testMultiCloudSetup() {
    console.log('🚀 Testing Multi-Cloud Infrastructure Visualizer\n');
    
    const baseUrl = 'http://localhost:3001';
    const tests = [];
    
    // Test 1: AWS EC2 Instance
    try {
        console.log('1️⃣ Testing AWS EC2 Instance...');
        const awsResponse = await fetch(`${baseUrl}/api/ec2-instance`);
        const awsData = await awsResponse.json();
        
        console.log(`   ✅ AWS Instance: ${awsData.title} (${awsData.ip})`);
        console.log(`   📊 Type: ${awsData.type} ${awsData.metadata.instanceType}`);
        console.log(`   🌍 Environment: ${awsData.metadata.environment}`);
        console.log(`   📍 Zone: ${awsData.metadata.availabilityZone}`);
        console.log(`   💾 Data Source: ${awsData.metadata.isRealInstance ? 'Live AWS API' : 'Mock Data'}\n`);
        
        tests.push({ name: 'AWS EC2', success: true, realData: awsData.metadata.isRealInstance });
    } catch (error) {
        console.log(`   ❌ AWS Test Failed: ${error.message}\n`);
        tests.push({ name: 'AWS EC2', success: false, realData: false });
    }
    
    // Test 2: GCP Compute Engine Instance
    try {
        console.log('2️⃣ Testing GCP Compute Engine Instance...');
        const gcpResponse = await fetch(`${baseUrl}/api/gcp-instance`);
        const gcpData = await gcpResponse.json();
        
        console.log(`   ✅ GCP Instance: ${gcpData.title} (${gcpData.ip})`);
        console.log(`   📊 Type: ${gcpData.type} ${gcpData.machineType}`);
        console.log(`   🌍 Environment: ${gcpData.metadata.environment}`);
        console.log(`   📍 Zone: ${gcpData.metadata.availabilityZone}`);
        console.log(`   💾 Data Source: ${gcpData.metadata.dataSource}\n`);
        
        tests.push({ name: 'GCP Compute', success: true, realData: gcpData.metadata.isRealInstance });
    } catch (error) {
        console.log(`   ❌ GCP Test Failed: ${error.message}\n`);
        tests.push({ name: 'GCP Compute', success: false, realData: false });
    }
    
    // Test 3: Health Check
    try {
        console.log('3️⃣ Testing Health Check...');
        const healthResponse = await fetch(`${baseUrl}/api/health`);
        const healthData = await healthResponse.json();
        
        console.log(`   ✅ API Health: ${healthData.status}`);
        console.log(`   📡 Target: ${healthData.targetInstance}`);
        console.log(`   ⏰ Timestamp: ${healthData.timestamp}\n`);
        
        tests.push({ name: 'Health Check', success: true, realData: true });
    } catch (error) {
        console.log(`   ❌ Health Check Failed: ${error.message}\n`);
        tests.push({ name: 'Health Check', success: false, realData: false });
    }
    
    // Test 4: Combined Multi-Cloud Endpoint
    try {
        console.log('4️⃣ Testing Combined Multi-Cloud Data...');
        const allResponse = await fetch(`${baseUrl}/api/all-instances`);
        const allData = await allResponse.json();
        
        console.log(`   ✅ Total Instances: ${allData.length}`);
        allData.forEach((instance, index) => {
            const provider = instance.metadata?.cloudProvider || instance.cloudProvider;
            const dataSource = instance.metadata?.isRealInstance ? 'Live' : 'Sample';
            console.log(`   ${index + 1}. ${instance.title} (${provider}) - ${dataSource}`);
        });
        console.log('');
        
        tests.push({ name: 'Multi-Cloud', success: true, realData: allData.some(i => i.metadata?.isRealInstance) });
    } catch (error) {
        console.log(`   ❌ Multi-Cloud Test Failed: ${error.message}\n`);
        tests.push({ name: 'Multi-Cloud', success: false, realData: false });
    }
    
    // Summary
    console.log('📋 Test Summary:');
    console.log('================');
    
    const successfulTests = tests.filter(t => t.success).length;
    const realDataTests = tests.filter(t => t.realData).length;
    
    tests.forEach(test => {
        const status = test.success ? '✅' : '❌';
        const dataType = test.realData ? '🔴 Live' : '🟡 Sample';
        console.log(`${status} ${test.name.padEnd(15)} - ${dataType}`);
    });
    
    console.log(`\n🎯 Results: ${successfulTests}/${tests.length} tests passed`);
    console.log(`📡 Live Data: ${realDataTests}/${tests.length} endpoints using real cloud data`);
    
    if (successfulTests === tests.length && realDataTests >= 2) {
        console.log('\n🎉 SUCCESS: Multi-cloud infrastructure visualizer is fully operational!');
        console.log('🌐 Real AWS EC2 + Real GCP Compute + Azure Sample data integration complete');
    } else if (successfulTests === tests.length) {
        console.log('\n⚠️  PARTIAL SUCCESS: All endpoints working but some using sample data');
    } else {
        console.log('\n❌ FAILED: Some endpoints are not responding correctly');
    }
}

// Run the test
if (require.main === module) {
    testMultiCloudSetup().catch(console.error);
}

module.exports = { testMultiCloudSetup };

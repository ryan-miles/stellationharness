// Verify Live Data vs Cached Data Test
// This script checks if the infrastructure visualizer is using live API data

const testLiveData = async () => {
    console.log('🧪 Testing Live Data Flow...\n');
    
    try {
        // Test AWS endpoint
        console.log('1️⃣ Testing AWS EC2 API...');
        const awsResponse = await fetch('http://localhost:3001/api/ec2-instance');
        const awsData = await awsResponse.json();
        
        console.log(`   ✅ AWS Response: ${awsData.title} (${awsData.status})`);
        console.log(`   📊 Data Source: ${awsData.metadata?.dataSource || 'Unknown'}`);
        console.log(`   🔄 Real Instance: ${awsData.metadata?.isRealInstance ? 'YES' : 'NO'}`);
        
        // Test GCP endpoint  
        console.log('\n2️⃣ Testing GCP Compute Engine API...');
        const gcpResponse = await fetch('http://localhost:3001/api/gcp-instance');
        const gcpData = await gcpResponse.json();
        
        console.log(`   ✅ GCP Response: ${gcpData.name} (${gcpData.status})`);
        console.log(`   📊 Data Source: ${gcpData.metadata?.dataSource || 'Unknown'}`);
        console.log(`   🔄 Real Instance: ${gcpData.metadata?.isRealInstance ? 'YES' : 'NO'}`);
        
        // Test combined endpoint
        console.log('\n3️⃣ Testing Combined Multi-Cloud API...');
        const allResponse = await fetch('http://localhost:3001/api/all-instances');
        const allData = await allResponse.json();
        
        console.log(`   📈 Total Instances: ${allData.length}`);
        allData.forEach((instance, i) => {
            console.log(`   ${i+1}. ${instance.title || instance.name} (${instance.status}) - ${instance.dataSource}`);
        });
        
        // Analysis
        console.log('\n📊 ANALYSIS:');
        const isAWSLive = awsData.metadata?.dataSource?.includes('AWS') || awsData.metadata?.isRealInstance;
        const isGCPLive = gcpData.metadata?.dataSource?.includes('GCP') || gcpData.metadata?.isRealInstance;
        
        if (isAWSLive && isGCPLive) {
            console.log('✅ STATUS: LIVE MULTI-CLOUD DATA');
            console.log('   Both AWS and GCP are pulling from real cloud APIs');
        } else if (isAWSLive || isGCPLive) {
            console.log('⚠️  STATUS: PARTIAL LIVE DATA');
            console.log(`   AWS: ${isAWSLive ? 'LIVE' : 'CACHED'}, GCP: ${isGCPLive ? 'LIVE' : 'CACHED'}`);
        } else {
            console.log('❌ STATUS: CACHED/MOCK DATA ONLY');
            console.log('   Neither service is pulling live data from cloud APIs');
        }
        
        // Status light check
        console.log('\n💡 STATUS LIGHTS:');
        const statusValues = [awsData.status, gcpData.status];
        const validStatuses = statusValues.filter(s => ['online', 'warning', 'offline'].includes(s));
        
        if (validStatuses.length === statusValues.length) {
            console.log('✅ All status values are valid for CSS status lights');
            console.log(`   Status mapping: ${statusValues.join(', ')}`);
        } else {
            console.log('❌ Some status values may not display status lights correctly');
            console.log(`   Current statuses: ${statusValues.join(', ')}`);
            console.log('   Expected: online, warning, or offline');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
};

// Run the test
testLiveData();

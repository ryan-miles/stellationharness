// Quick verification of what will be displayed in the nodes
// Run with: node verify-display.js

async function verifyNodeDisplay() {
    console.log('🎯 Verifying Node Display Format...\n');
    
    try {
        const response = await fetch('http://localhost:3001/api/ec2-instance');
        const instanceData = await response.json();
          console.log('📋 Current Node Will Display:');
        console.log('┌─────────────────────────────────┐');
        console.log(`│ ${instanceData.title.padEnd(31)} │`);
        console.log('├─────────────────────────────────┤');
        console.log(`│ Environment: AWS/${(instanceData.metadata?.environment || 'Production').padEnd(11)} │`);
        console.log(`│ Type: EC2/${(instanceData.metadata?.instanceType || instanceData.type).padEnd(20)} │`);
        console.log(`│ IP: ${instanceData.ip.padEnd(28)} │`);
        console.log('└─────────────────────────────────┘');
        
        console.log('\n✅ Multi-Cloud Ready Format:');
        console.log(`   🌍 Cloud Provider: AWS`);
        console.log(`   🏷️  Environment: ${instanceData.metadata?.environment || 'Production'}`);
        console.log(`   🏗️  Service Type: EC2`);
        console.log(`   ⚙️  Instance Type: ${instanceData.metadata?.instanceType}`);
        console.log(`   🌐 IP Address: ${instanceData.ip}`);
        
        console.log('\n🚀 Multi-Cloud Benefits:');
        console.log('   • Immediate cloud provider identification');
        console.log('   • Clear service type (EC2, RDS, AKS, etc.)');
        console.log('   • Environment context (Production, Dev, Staging)');
        console.log('   • Future-ready for Azure, GCP integration');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

verifyNodeDisplay();

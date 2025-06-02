/**
 * Debug script to test GCP status endpoint
 * This will decrypt API keys and test the GCP status directly
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// Decrypt data from storage (copied from auth-manager.js)
function decryptData(encryptedData, encryptionKey) {
    try {
        const algorithm = 'aes-256-gcm';
        const iv = Buffer.from(encryptedData.iv, 'hex');
        const decipher = crypto.createDecipheriv(algorithm, encryptionKey, iv);
        
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
        
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    } catch (error) {
        console.error('Failed to decrypt data:', error);
        return null;
    }
}

async function main() {
    try {
        // Load encryption key
        const secretsContent = await fs.readFile(path.join(__dirname, 'config', 'secrets.json'), 'utf8');
        const secretsData = JSON.parse(secretsContent);
        const encryptionKey = Buffer.from(secretsData.encryptionKey, 'hex');
        console.log('✅ Loaded encryption key');

        // Load and decrypt API keys
        const apiKeysContent = await fs.readFile(path.join(__dirname, 'config', 'api-keys.json'), 'utf8');
        const encryptedApiKeys = JSON.parse(apiKeysContent);
        const apiKeysData = decryptData(encryptedApiKeys, encryptionKey);
        
        if (!apiKeysData) {
            console.error('❌ Failed to decrypt API keys');
            return;
        }

        console.log('✅ Decrypted API keys successfully');
        console.log(`Found ${apiKeysData.length} API keys`);

        // Find an admin API key
        const adminKey = apiKeysData.find(([key, data]) => data.role === 'admin');
        if (!adminKey) {
            console.error('❌ No admin API key found');
            return;
        }

        const [apiKey, keyData] = adminKey;
        console.log(`✅ Found admin API key: ${apiKey.substring(0, 10)}...`);

        // Test single GCP instance endpoint
        console.log('\n🧪 Testing single GCP instance endpoint...');
        const gcpResponse = await fetch('http://localhost:3001/api/gcp-instance', {
            method: 'GET',
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (!gcpResponse.ok) {
            console.error(`❌ GCP HTTP ${gcpResponse.status}: ${gcpResponse.statusText}`);
            const errorText = await gcpResponse.text();
            console.error('Error response:', errorText);
            return;
        }

        const gcpSingleData = await gcpResponse.json();
        console.log('✅ GCP single instance endpoint response:');
        console.log(JSON.stringify(gcpSingleData, null, 2));

        // Test all-instances endpoint
        console.log('\n🧪 Testing all-instances endpoint...');
        const allResponse = await fetch('http://localhost:3001/api/all-instances', {
            method: 'GET',
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (!allResponse.ok) {
            console.error(`❌ All-instances HTTP ${allResponse.status}: ${allResponse.statusText}`);
            const errorText = await allResponse.text();
            console.error('Error response:', errorText);
            return;
        }

        const allData = await allResponse.json();
        console.log('✅ All-instances endpoint response:');
        console.log(JSON.stringify(allData, null, 2));

        // Analysis
        console.log('\n📊 STATUS ANALYSIS:');
        
        if (gcpSingleData) {
            console.log('\n1️⃣ Single GCP Instance:');
            console.log(`  Name: ${gcpSingleData.name}`);
            console.log(`  Status: ${gcpSingleData.status}`);
            console.log(`  GCP State: ${gcpSingleData.metadata?.state || 'unknown'}`);
            console.log(`  Zone: ${gcpSingleData.zone}`);
            console.log(`  Machine Type: ${gcpSingleData.machineType}`);
            console.log(`  Data Source: ${gcpSingleData.metadata?.dataSource}`);
        }        // Find GCP instance in all-instances response
        const instancesArray = allData.data ? allData.data.instances : allData;
        const gcpFromAll = instancesArray.find(instance => instance.cloudProvider === 'GCP');
        if (gcpFromAll) {
            console.log('\n2️⃣ GCP Instance from All-Instances:');
            console.log(`  Name: ${gcpFromAll.title || gcpFromAll.name}`);
            console.log(`  Status: ${gcpFromAll.status}`);
            console.log(`  GCP State: ${gcpFromAll.metadata?.state || 'unknown'}`);
            console.log(`  Zone: ${gcpFromAll.zone || gcpFromAll.metadata?.availabilityZone}`);
            console.log(`  Machine Type: ${gcpFromAll.machineType || gcpFromAll.metadata?.instanceType}`);
            console.log(`  Data Source: ${gcpFromAll.dataSource || gcpFromAll.metadata?.dataSource}`);
        }

        // Test instance library endpoint (used by frontend)
        console.log('\n🧪 Testing instance-library endpoint...');
        const libraryResponse = await fetch('http://localhost:3001/api/instance-library', {
            method: 'GET',
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (!libraryResponse.ok) {
            console.error(`❌ Library HTTP ${libraryResponse.status}: ${libraryResponse.statusText}`);
        } else {
            const libraryData = await libraryResponse.json();
            const gcpFromLibrary = libraryData.gcp && libraryData.gcp.length > 0 ? libraryData.gcp[0] : null;
            if (gcpFromLibrary) {
                console.log('\n3️⃣ GCP Instance from Instance Library:');
                console.log(`  Name: ${gcpFromLibrary.title || gcpFromLibrary.name}`);
                console.log(`  Status: ${gcpFromLibrary.status}`);
                console.log(`  Visible: ${gcpFromLibrary.isVisible}`);
                console.log(`  Data Source: ${gcpFromLibrary.dataSource}`);
            }
        }

        // Compare status
        if (gcpSingleData && gcpFromAll) {
            console.log('\n🔍 COMPARISON:');
            console.log(`  Single instance status: ${gcpSingleData.status}`);
            console.log(`  All-instances status: ${gcpFromAll.status}`);
            console.log(`  Match: ${gcpSingleData.status === gcpFromAll.status ? '✅ YES' : '❌ NO'}`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

main();

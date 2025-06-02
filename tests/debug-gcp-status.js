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
        console.log(`✅ Found admin API key: ${apiKey.substring(0, 10)}...`);        // Test GCP endpoint
        console.log('\n🧪 Testing GCP endpoint...');
        const response = await fetch('http://localhost:3001/api/gcp-instance', {
            method: 'GET',
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
            const errorText = await response.text();
            console.error('Error response:', errorText);
            return;
        }

        const gcpData = await response.json();
        console.log('✅ GCP instance endpoint response:');
        console.log(JSON.stringify(gcpData, null, 2));

        // Test all-instances endpoint
        console.log('\n🧪 Testing all-instances endpoint...');
        const allResponse = await fetch('http://localhost:3001/api/all-instances', {
            method: 'GET',
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
            const errorText = await response.text();
            console.error('Error response:', errorText);
            return;
        }

        const gcpData = await response.json();
        console.log('✅ GCP endpoint response:');
        console.log(JSON.stringify(gcpData, null, 2));

        // Analyze the status data
        if (gcpData.success && gcpData.instances) {
            console.log('\n📊 Status Analysis:');
            gcpData.instances.forEach((instance, index) => {
                console.log(`Instance ${index + 1}:`);
                console.log(`  Name: ${instance.name}`);
                console.log(`  Status: ${instance.status}`);
                console.log(`  GCP State: ${instance.gcpState || 'unknown'}`);
                console.log(`  Zone: ${instance.zone}`);
                console.log(`  Machine Type: ${instance.machineType}`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

main();

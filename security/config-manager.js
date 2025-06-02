/**
 * Secure Configuration Management Module
 * 
 * Provides secure handling of configuration data including:
 * - Encrypted storage of sensitive data
 * - Configuration validation
 * - Secure defaults
 * - Environment-based configuration
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class SecureConfigManager {
    constructor() {
        this.encryptionKey = this.getOrCreateEncryptionKey();
        this.algorithm = 'aes-256-gcm';
        this.configPath = path.join(__dirname, '..', 'config');
        this.backupPath = path.join(this.configPath, 'backups');
        
        this.ensureConfigDirectories();
    }

    async ensureConfigDirectories() {
        try {
            await fs.mkdir(this.configPath, { recursive: true });
            await fs.mkdir(this.backupPath, { recursive: true });
        } catch (error) {
            console.error('Failed to create config directories:', error);
        }
    }

    getOrCreateEncryptionKey() {
        // In production, this should come from a secure key management service
        const keyFromEnv = process.env.CONFIG_ENCRYPTION_KEY;
        
        if (keyFromEnv) {
            return Buffer.from(keyFromEnv, 'hex');
        }

        // Generate a new key (not recommended for production)
        const key = crypto.randomBytes(32);
        console.warn('⚠️ Generated new encryption key. Set CONFIG_ENCRYPTION_KEY environment variable in production.');
        console.log(`CONFIG_ENCRYPTION_KEY=${key.toString('hex')}`);
        return key;
    }

    // Encrypt sensitive configuration data
    encrypt(text) {
        if (!text) return text;
        
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
        cipher.setAAD(Buffer.from('stellationharness-config', 'utf8'));
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }

    // Decrypt sensitive configuration data
    decrypt(encryptedData) {
        if (!encryptedData || typeof encryptedData === 'string') {
            return encryptedData; // Not encrypted or plain text
        }

        try {
            const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
            decipher.setAAD(Buffer.from('stellationharness-config', 'utf8'));
            decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
            
            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('Failed to decrypt configuration data:', error.message);
            return null;
        }
    }

    // Secure default configuration with no sensitive data exposed
    getSecureDefaultConfig() {
        return {
            security: {
                enabled: true,
                authentication: {
                    required: true,
                    method: 'api-key',
                    sessionTimeout: 3600 // 1 hour
                },
                rateLimiting: {
                    enabled: true,
                    windowMs: 900000, // 15 minutes
                    maxRequests: 100
                },
                inputValidation: {
                    enabled: true,
                    strictMode: true
                }
            },
            aws: {
                region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
                instances: [],
                autoDiscovery: {
                    enabled: false,
                    filters: [
                        { Name: 'instance-state-name', Values: ['running'] }
                    ]
                },
                credentialsConfigured: !!process.env.AWS_ACCESS_KEY_ID
            },
            gcp: {
                project: process.env.GCP_PROJECT_ID || '',
                instances: [],
                credentialsConfigured: !!process.env.GOOGLE_APPLICATION_CREDENTIALS
            },
            azure: {
                subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || '',
                resourceGroup: process.env.AZURE_RESOURCE_GROUP || '',
                instances: [],
                credentialsConfigured: !!(process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET)
            },
            monitoring: {
                enabled: true,
                healthCheckInterval: 300000, // 5 minutes
                metricsRetention: 86400000 // 24 hours
            },
            ui: {
                theme: 'default',
                autoRefresh: true,
                refreshInterval: 30000 // 30 seconds
            }
        };
    }

    // Validate configuration structure and security
    validateConfiguration(config) {
        const errors = [];
        const warnings = [];

        // Required security settings
        if (!config.security?.enabled) {
            errors.push('Security must be enabled');
        }

        if (!config.security?.authentication?.required) {
            warnings.push('Authentication should be required for production');
        }

        // Validate cloud provider configurations
        if (config.aws?.instances) {
            config.aws.instances.forEach((instance, index) => {
                if (!this.validateInstanceId(instance.id, 'aws')) {
                    errors.push(`Invalid AWS instance ID at index ${index}: ${instance.id}`);
                }
                
                if (instance.alias && !this.validateAlias(instance.alias)) {
                    errors.push(`Invalid alias at AWS instance index ${index}: ${instance.alias}`);
                }
            });
        }

        if (config.gcp?.instances) {
            config.gcp.instances.forEach((instance, index) => {
                if (!this.validateInstanceId(instance.name, 'gcp')) {
                    errors.push(`Invalid GCP instance name at index ${index}: ${instance.name}`);
                }
            });
        }

        if (config.azure?.instances) {
            config.azure.instances.forEach((instance, index) => {
                if (!this.validateInstanceId(instance.name, 'azure')) {
                    errors.push(`Invalid Azure resource name at index ${index}: ${instance.name}`);
                }
            });
        }

        // Validate rate limiting settings
        if (config.security?.rateLimiting?.enabled) {
            const { windowMs, maxRequests } = config.security.rateLimiting;
            
            if (!windowMs || windowMs < 60000) {
                warnings.push('Rate limiting window should be at least 1 minute');
            }
            
            if (!maxRequests || maxRequests < 10) {
                warnings.push('Rate limiting should allow at least 10 requests');
            }
        }

        return { errors, warnings, isValid: errors.length === 0 };
    }

    validateInstanceId(id, provider) {
        if (!id) return false;

        switch (provider) {
            case 'aws':
                return /^i-[0-9a-f]{8,17}$/.test(id);
            case 'gcp':
                return /^[a-z]([a-z0-9-]*[a-z0-9])?$/.test(id) && id.length <= 63;
            case 'azure':
                return /^[a-zA-Z0-9]([a-zA-Z0-9-_]*[a-zA-Z0-9])?$/.test(id) && id.length <= 80;
            default:
                return false;
        }
    }

    validateAlias(alias) {
        return alias && 
               typeof alias === 'string' && 
               alias.length <= 100 && 
               /^[a-zA-Z0-9\s\-_\.]+$/.test(alias);
    }

    // Sanitize configuration before saving (remove sensitive data)
    sanitizeForStorage(config) {
        const sanitized = JSON.parse(JSON.stringify(config));

        // Remove or mask sensitive fields
        delete sanitized.security?.authentication?.keys;
        delete sanitized.aws?.credentials;
        delete sanitized.gcp?.credentials;
        delete sanitized.azure?.credentials;

        // Add metadata
        sanitized._metadata = {
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            sanitized: true
        };

        return sanitized;
    }

    // Save configuration securely with backup
    async saveConfiguration(config, filename = 'instances-config.json') {
        try {
            // Validate configuration
            const validation = this.validateConfiguration(config);
            
            if (!validation.isValid) {
                throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
            }

            if (validation.warnings.length > 0) {
                console.warn('⚠️ Configuration warnings:', validation.warnings);
            }

            // Create backup of existing configuration
            const configFile = path.join(this.configPath, filename);
            const backupFile = path.join(this.backupPath, `${Date.now()}-${filename}`);
            
            try {
                await fs.access(configFile);
                await fs.copyFile(configFile, backupFile);
                console.log(`📁 Configuration backed up to: ${backupFile}`);
            } catch (error) {
                // File doesn't exist, no backup needed
            }

            // Sanitize and save configuration
            const sanitizedConfig = this.sanitizeForStorage(config);
            const configData = JSON.stringify(sanitizedConfig, null, 2);
            
            await fs.writeFile(configFile, configData, { mode: 0o600 }); // Read/write for owner only
            
            console.log('✅ Configuration saved securely');
            return true;

        } catch (error) {
            console.error('❌ Failed to save configuration:', error);
            throw error;
        }
    }

    // Load configuration securely
    async loadConfiguration(filename = 'instances-config.json') {
        try {
            const configFile = path.join(this.configPath, filename);
            const configData = await fs.readFile(configFile, 'utf8');
            const config = JSON.parse(configData);

            // Merge with secure defaults
            const defaultConfig = this.getSecureDefaultConfig();
            const mergedConfig = this.mergeConfigurations(defaultConfig, config);

            // Validate loaded configuration
            const validation = this.validateConfiguration(mergedConfig);
            
            if (!validation.isValid) {
                console.error('❌ Loaded configuration is invalid:', validation.errors);
                console.log('🔄 Using secure defaults instead');
                return defaultConfig;
            }

            if (validation.warnings.length > 0) {
                console.warn('⚠️ Configuration warnings:', validation.warnings);
            }

            console.log('✅ Configuration loaded successfully');
            return mergedConfig;

        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('📝 No configuration file found, using secure defaults');
                return this.getSecureDefaultConfig();
            }

            console.error('❌ Failed to load configuration:', error);
            console.log('🔄 Using secure defaults due to error');
            return this.getSecureDefaultConfig();
        }
    }

    // Merge configurations with precedence
    mergeConfigurations(defaultConfig, userConfig) {
        const merged = JSON.parse(JSON.stringify(defaultConfig));

        // Recursively merge objects
        function merge(target, source) {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key]) target[key] = {};
                    merge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }

        merge(merged, userConfig);
        return merged;
    }

    // Clean up old backup files (keep last 10)
    async cleanupBackups(maxBackups = 10) {
        try {
            const files = await fs.readdir(this.backupPath);
            const backupFiles = files
                .filter(file => file.endsWith('-instances-config.json'))
                .map(file => ({
                    name: file,
                    path: path.join(this.backupPath, file),
                    timestamp: parseInt(file.split('-')[0])
                }))
                .sort((a, b) => b.timestamp - a.timestamp);

            if (backupFiles.length > maxBackups) {
                const filesToDelete = backupFiles.slice(maxBackups);
                
                for (const file of filesToDelete) {
                    await fs.unlink(file.path);
                    console.log(`🗑️ Cleaned up old backup: ${file.name}`);
                }
            }

        } catch (error) {
            console.warn('⚠️ Failed to cleanup backups:', error.message);
        }
    }

    // Get configuration metadata
    getConfigurationInfo(config) {
        return {
            version: config._metadata?.version || 'unknown',
            lastUpdated: config._metadata?.lastUpdated || 'unknown',
            instanceCounts: {
                aws: config.aws?.instances?.length || 0,
                gcp: config.gcp?.instances?.length || 0,
                azure: config.azure?.instances?.length || 0
            },
            securityEnabled: config.security?.enabled || false,
            authenticationRequired: config.security?.authentication?.required || false,
            credentialsConfigured: {
                aws: config.aws?.credentialsConfigured || false,
                gcp: config.gcp?.credentialsConfigured || false,
                azure: config.azure?.credentialsConfigured || false
            }
        };
    }
}

module.exports = new SecureConfigManager();

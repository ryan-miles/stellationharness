/**
 * Authentication & Authorization Security Module
 * 
 * Implements comprehensive security controls for the multi-cloud infrastructure visualizer:
 * - API key authentication
 * - Role-based access control (RBAC)
 * - Secure session management
 * - Cloud credential validation
 * - Security event logging
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const fs = require('fs').promises;
const path = require('path');

class SecurityManager {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || this.generateSecureSecret();
        this.apiKeys = new Map(); // Temporary storage, will be loaded from disk
        this.sessionTimeout = 60 * 60 * 1000; // 1 hour
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
        this.loginAttempts = new Map();
        
        // File paths for persistent storage
        this.apiKeysFile = path.join(__dirname, '..', 'config', 'api-keys.json');
        this.secretsFile = path.join(__dirname, '..', 'config', 'secrets.json');
        
        // Dedicated encryption key for API key storage (separate from JWT)
        this.encryptionKey = null;
        
        // Ensure config directory exists
        this.ensureConfigDir();
        
        // Default roles and permissions
        this.roles = {
            'viewer': ['read:instances', 'read:config'],
            'operator': ['read:instances', 'read:config', 'manage:instances'],
            'admin': ['read:instances', 'read:config', 'manage:instances', 'manage:config', 'manage:discovery']        };
        
        // Initialize encryption key and then load API keys
        this.initializeEncryptionKey().then(() => {
            this.initializeDefaultCredentials();
        });
    }

    generateSecureSecret() {
        const secret = crypto.randomBytes(64).toString('hex');
        console.warn('⚠️ Using generated JWT secret. Set JWT_SECRET environment variable in production.');
        return secret;
    }

    // File system operations for persistent storage
    async ensureConfigDir() {
        try {
            const configDir = path.dirname(this.apiKeysFile);
            await fs.mkdir(configDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create config directory:', error);        }
    }

    // Initialize persistent encryption key
    async initializeEncryptionKey() {
        try {
            // Try to load existing encryption key
            const keyContent = await fs.readFile(this.secretsFile, 'utf8');
            const keyData = JSON.parse(keyContent);
            this.encryptionKey = Buffer.from(keyData.encryptionKey, 'hex');
            console.log('🔐 Loaded existing encryption key');
        } catch (error) {
            if (error.code === 'ENOENT') {
                // Generate new encryption key and save it
                this.encryptionKey = crypto.randomBytes(32); // 256-bit key
                const keyData = {
                    encryptionKey: this.encryptionKey.toString('hex'),
                    createdAt: new Date().toISOString()
                };
                await fs.writeFile(this.secretsFile, JSON.stringify(keyData, null, 2), { mode: 0o600 });
                console.log('🆕 Generated new persistent encryption key');
            } else {
                console.error('Failed to load encryption key:', error);
                throw error;
            }
        }
    }    // Encrypt data for storage
    encryptData(data) {
        const algorithm = 'aes-256-gcm';
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, this.encryptionKey, iv);
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }

    // Decrypt data from storage
    decryptData(encryptedData) {
        try {
            const algorithm = 'aes-256-gcm';
            const iv = Buffer.from(encryptedData.iv, 'hex');
            const decipher = crypto.createDecipheriv(algorithm, this.encryptionKey, iv);
            
            decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
            
            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return JSON.parse(decrypted);
        } catch (error) {
            console.error('Failed to decrypt data:', error);
            return null;
        }
    }

    // Save API keys to encrypted file
    async saveApiKeys() {
        try {
            const apiKeysData = Array.from(this.apiKeys.entries()).map(([key, value]) => [key, value]);
            const encryptedData = this.encryptData(apiKeysData);
            
            await fs.writeFile(this.apiKeysFile, JSON.stringify(encryptedData, null, 2), { mode: 0o600 });
            console.log('🔐 API keys saved securely');
        } catch (error) {
            console.error('❌ Failed to save API keys:', error);
        }
    }

    // Load API keys from encrypted file
    async loadApiKeys() {
        try {
            const fileContent = await fs.readFile(this.apiKeysFile, 'utf8');
            const encryptedData = JSON.parse(fileContent);
            const apiKeysData = this.decryptData(encryptedData);
            
            if (apiKeysData) {
                this.apiKeys = new Map(apiKeysData);
                console.log(`🔑 Loaded ${this.apiKeys.size} API keys from storage`);
                return true;
            }
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('❌ Failed to load API keys:', error);
            }
        }        return false;
    }

    async initializeDefaultCredentials() {
        // First try to load existing API keys from storage
        const loaded = await this.loadApiKeys();
        
        if (loaded && this.apiKeys.size > 0) {
            console.log(`🔑 Using ${this.apiKeys.size} existing API keys from storage`);
            return;
        }
        
        // Create default admin API key if none exists
        console.log('🆕 No existing API keys found, creating default admin key...');
        const defaultApiKey = await this.createApiKey('admin', 'admin', 'Default administrator');
        console.log(`🔑 Default admin API key created: ${defaultApiKey}`);
        console.log('⚠️ Change this immediately in production!');
        
        // Save the new key to storage        await this.saveApiKeys();
    }

    // API Key Management
    async createApiKey(username, role, description = '') {
        const apiKey = 'sk_' + crypto.randomBytes(32).toString('hex');
        const hashedKey = await bcrypt.hash(apiKey, 12);
        
        this.apiKeys.set(apiKey, {
            username,
            role,
            description,
            hashedKey,
            createdAt: new Date(),
            lastUsed: null,
            isActive: true
        });
          // Save to persistent storage
        await this.saveApiKeys();
        console.log(`✅ API key created for ${username} with role ${role}`);
        return apiKey;
    }

    // Remove API key
    async revokeApiKey(apiKey) {
        if (this.apiKeys.has(apiKey)) {
            this.apiKeys.delete(apiKey);
            await this.saveApiKeys();
            console.log(`🗑️ API key revoked: ${apiKey.substring(0, 10)}...`);
            return true;
        }
        return false;
    }

    // List all API keys (without exposing the actual keys)
    listApiKeys() {
        return Array.from(this.apiKeys.entries()).map(([key, data]) => ({
            keyPreview: key.substring(0, 10) + '...',
            username: data.username,
            role: data.role,
            description: data.description,
            createdAt: data.createdAt,
            lastUsed: data.lastUsed,
            isActive: data.isActive
        }));
    }

    async validateApiKey(apiKey) {
        if (!apiKey || !apiKey.startsWith('sk_')) {
            return null;
        }

        const keyData = this.apiKeys.get(apiKey);
        if (!keyData || !keyData.isActive) {
            return null;
        }

        // Update last used timestamp
        keyData.lastUsed = new Date();
        
        // Save updated timestamp (non-blocking)
        this.saveApiKeys().catch(err => console.error('Failed to save API key update:', err));
        
        return {
            username: keyData.username,
            role: keyData.role,
            permissions: this.roles[keyData.role] || []
        };
    }

    // JWT Token Management
    generateJWT(payload, expiresIn = '1h') {
        return jwt.sign(payload, this.jwtSecret, { expiresIn });
    }

    verifyJWT(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            console.warn('🔒 Invalid JWT token:', error.message);
            return null;
        }
    }

    // Authentication Middleware
    authenticateApiKey(req, res, next) {
        const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
        
        if (!apiKey) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                message: 'API key missing. Include X-API-Key header or Authorization Bearer token.',
                timestamp: new Date().toISOString()
            });
        }

        this.validateApiKey(apiKey).then(user => {
            if (!user) {
                this.logSecurityEvent('auth_failed', {
                    reason: 'invalid_api_key',
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });

                return res.status(401).json({
                    success: false,
                    error: 'Authentication failed',
                    message: 'Invalid or expired API key.',
                    timestamp: new Date().toISOString()
                });
            }

            // Add user to request context
            req.user = user;
            
            this.logSecurityEvent('auth_success', {
                username: user.username,
                role: user.role,
                ip: req.ip
            });

            next();
        }).catch(error => {
            console.error('🔒 Authentication error:', error);
            res.status(500).json({
                success: false,
                error: 'Authentication system error',
                timestamp: new Date().toISOString()
            });
        });
    }

    // Authorization Middleware
    requirePermission(permission) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    timestamp: new Date().toISOString()
                });
            }

            if (!req.user.permissions.includes(permission)) {
                this.logSecurityEvent('authorization_failed', {
                    username: req.user.username,
                    role: req.user.role,
                    requiredPermission: permission,
                    ip: req.ip
                });

                return res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions',
                    message: `Required permission: ${permission}`,
                    userRole: req.user.role,
                    userPermissions: req.user.permissions,
                    timestamp: new Date().toISOString()
                });
            }

            next();
        };
    }

    // Cloud Credential Validation
    validateCloudCredentials() {
        const checks = {
            aws: this.validateAWSCredentials(),
            gcp: this.validateGCPCredentials(),
            azure: this.validateAzureCredentials()
        };

        return checks;
    }

    validateAWSCredentials() {
        const required = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
        const missing = required.filter(key => !process.env[key]);
        
        if (missing.length > 0) {
            console.warn('⚠️ Missing AWS credentials:', missing);
            return { valid: false, missing };
        }

        // Additional validation could include testing actual AWS API call
        return { valid: true, region: process.env.AWS_DEFAULT_REGION || 'us-east-1' };
    }

    validateGCPCredentials() {
        const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        
        if (!keyFile) {
            console.warn('⚠️ Missing GCP service account key file');
            return { valid: false, missing: ['GOOGLE_APPLICATION_CREDENTIALS'] };
        }

        // Additional validation could include checking file existence and format
        return { valid: true, keyFile };
    }

    validateAzureCredentials() {
        const required = ['AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET', 'AZURE_TENANT_ID'];
        const missing = required.filter(key => !process.env[key]);
        
        if (missing.length > 0) {
            console.warn('⚠️ Missing Azure credentials:', missing);
            return { valid: false, missing };
        }

        return { valid: true, subscription: process.env.AZURE_SUBSCRIPTION_ID };
    }

    // Security Event Logging
    logSecurityEvent(eventType, details = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            eventType,
            details,
            severity: this.getEventSeverity(eventType)
        };

        console.log(`🔒 [SECURITY] ${eventType.toUpperCase()}:`, logEntry);
        
        // In production, send to security monitoring system
        // this.sendToSecurityMonitoring(logEntry);
    }

    getEventSeverity(eventType) {
        const severityMap = {
            'auth_success': 'info',
            'auth_failed': 'warning',
            'authorization_failed': 'warning',
            'credential_validation': 'info',
            'api_key_created': 'info',
            'api_key_revoked': 'warning',
            'rate_limit_exceeded': 'warning',
            'suspicious_activity': 'critical'
        };

        return severityMap[eventType] || 'info';
    }

    // Login Attempt Tracking
    recordLoginAttempt(identifier, success) {
        const attempts = this.loginAttempts.get(identifier) || {
            count: 0,
            lastAttempt: null,
            lockedUntil: null
        };

        if (success) {
            this.loginAttempts.delete(identifier);
            return true;
        }

        attempts.count++;
        attempts.lastAttempt = new Date();

        if (attempts.count >= this.maxLoginAttempts) {
            attempts.lockedUntil = new Date(Date.now() + this.lockoutDuration);
            this.logSecurityEvent('account_locked', {
                identifier,
                attempts: attempts.count,
                lockedUntil: attempts.lockedUntil
            });
        }

        this.loginAttempts.set(identifier, attempts);
        return false;
    }

    isAccountLocked(identifier) {
        const attempts = this.loginAttempts.get(identifier);
        
        if (!attempts || !attempts.lockedUntil) {
            return false;
        }

        if (new Date() > attempts.lockedUntil) {
            this.loginAttempts.delete(identifier);
            return false;
        }

        return true;
    }

    // Security Headers Middleware
    setSecurityHeaders(req, res, next) {
        // Prevent XSS attacks
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        
        // Prevent information disclosure
        res.removeHeader('X-Powered-By');
        res.setHeader('Server', 'Multi-Cloud-Visualizer');
        
        // Content Security Policy
        res.setHeader('Content-Security-Policy', 
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "connect-src 'self' http://localhost:3001; " +
            "img-src 'self' data:; " +
            "font-src 'self'"
        );
        
        // HTTPS enforcement (in production)
        if (process.env.NODE_ENV === 'production') {
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        next();
    }

    // Generate secure configuration
    generateSecureConfig() {
        return {
            authentication: {
                enabled: true,
                method: 'api-key',
                sessionTimeout: this.sessionTimeout
            },
            authorization: {
                enabled: true,
                defaultRole: 'viewer',
                roles: this.roles
            },
            security: {
                rateLimiting: true,
                inputValidation: true,
                securityHeaders: true,
                auditLogging: true
            },
            cloudCredentials: this.validateCloudCredentials()
        };
    }
}

module.exports = new SecurityManager();

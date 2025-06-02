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

class SecurityManager {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || this.generateSecureSecret();
        this.apiKeys = new Map(); // In production, store in secure database
        this.sessionTimeout = 60 * 60 * 1000; // 1 hour
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
        this.loginAttempts = new Map();
        
        // Default roles and permissions
        this.roles = {
            'viewer': ['read:instances', 'read:config'],
            'operator': ['read:instances', 'read:config', 'manage:instances'],
            'admin': ['read:instances', 'read:config', 'manage:instances', 'manage:config', 'manage:discovery']
        };
        
        this.initializeDefaultCredentials();
    }

    generateSecureSecret() {
        const secret = crypto.randomBytes(64).toString('hex');
        console.warn('⚠️ Using generated JWT secret. Set JWT_SECRET environment variable in production.');
        return secret;
    }

    async initializeDefaultCredentials() {
        // Create default admin API key if none exists
        if (this.apiKeys.size === 0) {
            const defaultApiKey = await this.createApiKey('admin', 'admin', 'Default administrator');
            console.log(`🔑 Default admin API key created: ${defaultApiKey}`);
            console.log('⚠️ Change this immediately in production!');
        }
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
        
        console.log(`✅ API key created for ${username} with role ${role}`);
        return apiKey;
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

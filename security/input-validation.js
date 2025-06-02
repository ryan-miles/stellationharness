/**
 * Comprehensive Input Validation & Sanitization Module
 * 
 * Implements security-first validation for all user inputs to prevent:
 * - XSS attacks
 * - SQL injection attempts
 * - Code injection
 * - Path traversal attacks
 * - DoS via oversized inputs
 */

const validator = require('validator');
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');

class SecurityValidator {
    constructor() {
        this.maxStringLength = 500;
        this.maxDescriptionLength = 1000;
        this.maxArraySize = 100;
    }

    // AWS Instance ID validation
    validateInstanceId() {
        return [
            param('instanceId')
                .optional()
                .isLength({ min: 10, max: 19 })
                .matches(/^i-[0-9a-f]{8,17}$/)
                .withMessage('Invalid AWS Instance ID format'),
            body('instanceId')
                .optional()
                .isLength({ min: 10, max: 19 })
                .matches(/^i-[0-9a-f]{8,17}$/)
                .withMessage('Invalid AWS Instance ID format')
        ];
    }

    // GCP Instance Name validation
    validateGCPInstanceName() {
        return [
            param('instanceName')
                .optional()
                .isLength({ min: 1, max: 63 })
                .matches(/^[a-z]([a-z0-9-]*[a-z0-9])?$/)
                .withMessage('Invalid GCP instance name format'),
            body('instanceName')
                .optional()
                .isLength({ min: 1, max: 63 })
                .matches(/^[a-z]([a-z0-9-]*[a-z0-9])?$/)
                .withMessage('Invalid GCP instance name format')
        ];
    }

    // Azure Resource Name validation
    validateAzureResourceName() {
        return [
            param('resourceName')
                .optional()
                .isLength({ min: 1, max: 80 })
                .matches(/^[a-zA-Z0-9]([a-zA-Z0-9-_]*[a-zA-Z0-9])?$/)
                .withMessage('Invalid Azure resource name format'),
            body('resourceName')
                .optional()
                .isLength({ min: 1, max: 80 })
                .matches(/^[a-zA-Z0-9]([a-zA-Z0-9-_]*[a-zA-Z0-9])?$/)
                .withMessage('Invalid Azure resource name format')
        ];
    }

    // Safe string validation (alias, description, etc.)
    validateSafeString(field, maxLength = this.maxStringLength) {
        return body(field)
            .optional()
            .isLength({ max: maxLength })
            .trim()
            .escape()
            .matches(/^[a-zA-Z0-9\s\-_\.]+$/)
            .withMessage(`${field} contains invalid characters`);
    }

    // Description validation with longer length
    validateDescription(field = 'description') {
        return body(field)
            .optional()
            .isLength({ max: this.maxDescriptionLength })
            .trim()
            .escape()
            .withMessage(`${field} is too long`);
    }

    // Provider validation
    validateProvider() {
        return body('provider')
            .optional()
            .isIn(['aws', 'gcp', 'azure'])
            .withMessage('Invalid cloud provider');
    }

    // Boolean validation
    validateBoolean(field) {
        return body(field)
            .optional()
            .isBoolean()
            .withMessage(`${field} must be a boolean value`);
    }

    // Array validation with size limits
    validateArray(field, itemValidator = null) {
        const validators = [
            body(field)
                .optional()
                .isArray({ max: this.maxArraySize })
                .withMessage(`${field} array too large`)
        ];

        if (itemValidator) {
            validators.push(
                body(`${field}.*`).custom(itemValidator)
            );
        }

        return validators;
    }

    // IP Address validation
    validateIPAddress(field) {
        return body(field)
            .optional()
            .isIP()
            .withMessage('Invalid IP address format');
    }

    // URL validation
    validateURL(field) {
        return body(field)
            .optional()
            .isURL({ require_protocol: true, protocols: ['http', 'https'] })
            .withMessage('Invalid URL format');
    }

    // Cloud-specific zone validation
    validateAWSZone() {
        return body('zone')
            .optional()
            .matches(/^[a-z]{2}-[a-z]+-\d[a-z]$/)
            .withMessage('Invalid AWS availability zone format');
    }

    validateGCPZone() {
        return body('zone')
            .optional()
            .matches(/^[a-z]+-[a-z]+\d+-[a-z]$/)
            .withMessage('Invalid GCP zone format');
    }

    validateAzureRegion() {
        return body('region')
            .optional()
            .matches(/^[a-z]+[a-z0-9]*$/)
            .withMessage('Invalid Azure region format');
    }

    // Filter validation for discovery
    validateDiscoveryFilters() {
        return [
            body('filters')
                .optional()
                .isArray({ max: 10 })
                .withMessage('Too many filters'),
            body('filters.*.Name')
                .isIn(['instance-state-name', 'instance-type', 'tag:Name', 'tag:Environment'])
                .withMessage('Invalid filter name'),
            body('filters.*.Values')
                .isArray({ max: 20 })
                .withMessage('Too many filter values'),
            body('filters.*.Values.*')
                .isLength({ max: 100 })
                .matches(/^[a-zA-Z0-9\-_\.\*]+$/)
                .withMessage('Invalid filter value')
        ];
    }

    // Sanitize HTML content to prevent XSS
    sanitizeHtml(text) {
        if (!text) return text;
        
        return validator.escape(text)
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
    }

    // Check validation results and return errors
    handleValidationErrors(req, res, next) {
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            console.warn('⚠️ Input validation failed:', {
                errors: errors.array(),
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString()
            });

            return res.status(400).json({
                success: false,
                error: 'Input validation failed',
                details: errors.array().map(err => ({
                    field: err.param,
                    message: err.msg,
                    value: err.value
                })),
                timestamp: new Date().toISOString()
            });
        }
        
        next();
    }

    // Rate limiting configurations
    createRateLimit(windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests') {
        return rateLimit({
            windowMs,
            max,
            message: {
                success: false,
                error: message,
                timestamp: new Date().toISOString()
            },
            standardHeaders: true,
            legacyHeaders: false,
            handler: (req, res) => {
                console.warn('🚫 Rate limit exceeded:', {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    endpoint: req.originalUrl,
                    timestamp: new Date().toISOString()
                });
                
                res.status(429).json({
                    success: false,
                    error: message,
                    retryAfter: Math.round(windowMs / 1000),
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    // Specific rate limits for different endpoint types
    getStandardRateLimit() {
        return this.createRateLimit(15 * 60 * 1000, 100, 'Too many requests. Please try again later.');
    }

    getStrictRateLimit() {
        return this.createRateLimit(15 * 60 * 1000, 20, 'Too many configuration changes. Please slow down.');
    }    getDiscoveryRateLimit() {
        return this.createRateLimit(5 * 60 * 1000, 5, 'Discovery operations limited. Please wait before trying again.');
    }

    // Simple validation methods for compatibility with backend
    validateAWSInstanceId(instanceId) {
        if (!instanceId || typeof instanceId !== 'string') {
            return { isValid: false, errors: ['Instance ID is required'] };
        }
        
        const awsInstanceRegex = /^i-[0-9a-f]{8,17}$/;
        if (!awsInstanceRegex.test(instanceId)) {
            return { isValid: false, errors: ['Invalid AWS Instance ID format'] };
        }
        
        return { isValid: true, errors: [] };
    }

    validateApiKey(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            return { isValid: false, errors: ['API key is required'] };
        }
        
        if (!apiKey.startsWith('sk_') || apiKey.length < 20) {
            return { isValid: false, errors: ['Invalid API key format'] };
        }
        
        return { isValid: true, errors: [] };
    }

    validateString(str, minLength = 0, maxLength = 500) {
        if (str === null || str === undefined) {
            return minLength === 0;
        }
        
        if (typeof str !== 'string') {
            return false;
        }
        
        return str.length >= minLength && str.length <= maxLength;
    }
}

module.exports = new SecurityValidator();

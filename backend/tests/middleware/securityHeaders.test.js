import { jest, describe, it, expect } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import securityHeaders from '../../src/middleware/securityHeaders.js';

const app = express();
app.use(securityHeaders);
app.get('/test', (req, res) => res.send('test'));
app.post('/test', (req, res) => res.json({ message: 'test' }));
app.get('/api/auth/logout', (req, res) => res.json({ message: 'logged out' }));

describe('Security Headers Middleware', () => {
  it('should set basic security headers', async () => {
    const response = await request(app).get('/test');
    
    // Content Security Policy
    expect(response.headers['content-security-policy']).toBeDefined();
    
    // Cross-Origin headers
    expect(response.headers['cross-origin-embedder-policy']).toBeDefined();
    expect(response.headers['cross-origin-opener-policy']).toBe('same-origin');
    expect(response.headers['cross-origin-resource-policy']).toBe('same-site');
    
    // Other security headers
    expect(response.headers['x-dns-prefetch-control']).toBe('off');
    expect(response.headers['expect-ct']).toContain('max-age=86400');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
    expect(response.headers['x-download-options']).toBe('noopen');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-permitted-cross-domain-policies']).toBe('none');
    expect(response.headers['referrer-policy']).toBe('no-referrer,strict-origin-when-cross-origin');
    expect(response.headers['x-xss-protection']).toBe('0');
  });

  it('should set Permissions-Policy header', async () => {
    const response = await request(app).get('/test');
    expect(response.headers['permissions-policy']).toBeDefined();
    expect(response.headers['permissions-policy']).toContain('camera=()');
    expect(response.headers['permissions-policy']).toContain('geolocation=()');
  });

  it('should set Clear-Site-Data header on logout', async () => {
    const response = await request(app).get('/api/auth/logout');
    expect(response.headers['clear-site-data']).toBe('"cache", "cookies", "storage"');
  });

  it('should set Cache-Control for GET requests', async () => {
    const response = await request(app).get('/test');
    expect(response.headers['cache-control']).toBe('no-store, max-age=0');
  });

  it('should not set Cache-Control for POST requests', async () => {
    const response = await request(app).post('/test');
    expect(response.headers['cache-control']).toBeUndefined();
  });
}); 
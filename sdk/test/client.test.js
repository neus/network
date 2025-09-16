/**
 * NEUS SDK Client Tests
 * Basic functionality tests for Day 1 production readiness
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NeusClient } from '../client.js';
import { ValidationError, NetworkError, ApiError } from '../errors.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('NeusClient', () => {
  let client;

  beforeEach(() => {
    client = new NeusClient({ enableLogging: false });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default config', () => {
      const defaultClient = new NeusClient();
      expect(defaultClient.baseUrl).toBe('https://api.neus.network');
      expect(defaultClient.config.timeout).toBe(30000);
    });

    it('should accept custom config', () => {
      const customClient = new NeusClient({
        apiUrl: 'http://localhost:3000',
        timeout: 5000,
        enableLogging: true
      });
      expect(customClient.baseUrl).toBe('http://localhost:3000');
      expect(customClient.config.timeout).toBe(5000);
      expect(customClient.config.enableLogging).toBe(true);
    });

    it('should enforce HTTPS for neus.network domains', () => {
      const httpClient = new NeusClient({ apiUrl: 'http://api.neus.network' });
      expect(httpClient.baseUrl).toBe('https://api.neus.network');
    });
  });

  describe('verify()', () => {
    it('should validate required parameters', async () => {
      await expect(client.verify({})).rejects.toThrow(ValidationError);
    });

    it('should validate verifier types', async () => {
      await expect(
        client.verify({
          verifier: 'invalid-verifier',
          content: 'test'
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should validate content parameter', async () => {
      await expect(
        client.verify({
          verifier: 'ownership-basic',
          content: null
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        client.verify({
          verifier: 'ownership-basic',
          content: 123
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getStatus()', () => {
    it('should validate qHash parameter', async () => {
      await expect(client.getStatus()).rejects.toThrow(ValidationError);
      await expect(client.getStatus('')).rejects.toThrow(ValidationError);
      await expect(client.getStatus(123)).rejects.toThrow(ValidationError);
    });

    it('should make correct API call', async () => {
      const mockResponse = {
        success: true,
        status: 'verified',
        data: { qHash: '0xtest123' }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.getStatus('0xtest123');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.neus.network/api/v1/verification/status/0xtest123',
        expect.objectContaining({
          method: 'GET'
        })
      );

      expect(result.success).toBe(true);
      expect(result.qHash).toBe('0xtest123');
    });

    it('should handle API errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () =>
          Promise.resolve({
            success: false,
            error: { message: 'Proof not found', code: 'NOT_FOUND' }
          })
      });

      await expect(client.getStatus('0xinvalid')).rejects.toThrow(ApiError);
    });
  });

  describe('getVerifiers()', () => {
    it('should return array of verifiers', async () => {
      const mockResponse = {
        success: true,
        data: ['ownership-basic', 'nft-ownership', 'token-holding', 'ownership-licensed']
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const verifiers = await client.getVerifiers();

      expect(Array.isArray(verifiers)).toBe(true);
      expect(verifiers).toContain('ownership-basic');
      expect(verifiers).toContain('nft-ownership');
      expect(verifiers).toContain('token-holding');
      expect(verifiers).toContain('ownership-licensed');
    });

    it('should handle empty response gracefully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: null })
      });

      const verifiers = await client.getVerifiers();
      expect(Array.isArray(verifiers)).toBe(true);
      expect(verifiers).toEqual([]);
    });
  });

  describe('isHealthy()', () => {
    it('should return true for healthy API', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const healthy = await client.isHealthy();
      expect(healthy).toBe(true);
    });

    it('should return false for unhealthy API', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const healthy = await client.isHealthy();
      expect(healthy).toBe(false);
    });

    it('should return false for error responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const healthy = await client.isHealthy();
      expect(healthy).toBe(false);
    });
  });

  describe('pollProofStatus()', () => {
    it('should validate qHash parameter', async () => {
      await expect(client.pollProofStatus()).rejects.toThrow(ValidationError);
      await expect(client.pollProofStatus('')).rejects.toThrow(ValidationError);
    });

    it('should poll until terminal status', async () => {
      // Mock three calls: pending -> verifying -> verified
      const responses = [
        { success: true, status: 'pending', data: { status: 'pending' } },
        { success: true, status: 'verifying', data: { status: 'processing_verifiers' } },
        { success: true, status: 'verified', data: { status: 'verified', qHash: '0xtest123' } }
      ];

      let callCount = 0;
      fetch.mockImplementation(() => {
        const response = responses[callCount++];
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(response)
        });
      });

      const result = await client.pollProofStatus('0xtest123', {
        interval: 100,
        timeout: 5000
      });

      expect(result.status).toBe('verified');
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Network Error Handling', () => {
    it('should handle network timeouts', async () => {
      fetch.mockRejectedValueOnce(new Error('Network timeout'));

      await expect(client.getStatus('0xtest')).rejects.toThrow(NetworkError);
    });

    it('should handle connection refused', async () => {
      const error = new Error('Connection refused');
      error.code = 'ECONNREFUSED';
      fetch.mockRejectedValueOnce(error);

      await expect(client.isHealthy()).resolves.toBe(false);
    });
  });
});

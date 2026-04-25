import { describe, it, expect, beforeAll } from 'vitest';
import { NeusClient } from '../client.js';

const LIVE = process.env.NEUS_SDK_LIVE_TESTS === '1';
const API_URL = process.env.NEUS_API_URL || 'https://api.neus.network';
const TIMEOUT = 30000;

describe('NEUS SDK Integration', () => {
  let client;

  beforeAll(() => {
    client = new NeusClient({
      apiUrl: API_URL,
      timeout: TIMEOUT,
      enableLogging: false
    });
  });

  describe('API Health Check', () => {
    it('should connect to API successfully', async () => {
      if (!LIVE) return;

      const healthy = await client.isHealthy();
      expect(healthy).toBe(true);
    }, 10000);
  });

  describe('Verifiers List', () => {
    it('should fetch available verifiers', async () => {
      if (!LIVE) return;

      const verifiers = await client.getVerifiers();

      expect(Array.isArray(verifiers)).toBe(true);
      expect(verifiers.length).toBeGreaterThan(0);

      const expectedVerifiers = [
        'ownership-basic',
        'nft-ownership',
        'token-holding'
      ];

      expectedVerifiers.forEach(verifier => {
        expect(verifiers).toContain(verifier);
      });
    }, 10000);
  });

  describe('Status Endpoint', () => {
    it('should handle non-existent proof gracefully', async () => {
      if (!LIVE) return;

      const fakeQHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      try {
        await client.getProof(fakeQHash);
      } catch (error) {
        expect(error.name).toBe('ApiError');
        expect(error.statusCode).toBe(404);
      }
    }, 10000);
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const badClient = new NeusClient({
        apiUrl: 'https://nonexistent.invalid',
        timeout: 1000
      });

      const healthy = await badClient.isHealthy();
      expect(healthy).toBe(false);
    });

    it('should validate inputs before API calls', async () => {
      await expect(client.getProof('')).rejects.toThrow('proofId is required');
      await expect(client.getProof(123)).rejects.toThrow('proofId is required');
      await expect(client.verify({ content: 123 })).rejects.toThrow('content is required and must be a string');
    });
  });

  describe('SDK Configuration', () => {
    it('should handle different API URL formats', () => {
      const clients = [
        new NeusClient({ apiUrl: 'https://api.neus.network/' }),
        new NeusClient({ apiUrl: 'https://api.neus.network' }),
        new NeusClient({ apiUrl: 'http://localhost:3000' })
      ];

      expect(clients[0].baseUrl).toBe('https://api.neus.network');
      expect(clients[1].baseUrl).toBe('https://api.neus.network');
      expect(clients[2].baseUrl).toBe('http://localhost:3000');
    });

    it('should enforce HTTPS for production domains', () => {
      const client = new NeusClient({ apiUrl: 'http://api.neus.network' });
      expect(client.baseUrl).toBe('https://api.neus.network');
    });
  });

  describe('Basic Workflow Simulation', () => {
    it('should demonstrate typical usage pattern', async () => {
      const healthy = await client.isHealthy().catch(() => false);
      expect(typeof healthy).toBe('boolean');

      if (healthy && LIVE) {
        const verifiers = await client.getVerifiers();
        expect(Array.isArray(verifiers)).toBe(true);
        expect(verifiers.length).toBeGreaterThan(0);
      }

      expect(() => client.isHealthy()).not.toThrow();
    });
  });
});

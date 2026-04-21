/**
 * NEUS SDK Client Tests
 * Basic functionality tests
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
      await expect(client.verify({
        verifier: 'invalid-verifier',
        content: 'test'
      })).rejects.toThrow(ValidationError);
    });

    it('should validate content parameter', async () => {
      await expect(client.verify({
        verifier: 'ownership-basic',
        content: null
      })).rejects.toThrow(ValidationError);

      await expect(client.verify({
        verifier: 'ownership-basic',
        content: 123
      })).rejects.toThrow(ValidationError);
    });
  });

  describe('getProof()', () => {
    it('should validate proofId parameter', async () => {
      await expect(client.getProof()).rejects.toThrow(ValidationError);
      await expect(client.getProof('')).rejects.toThrow(ValidationError);
      await expect(client.getProof(123)).rejects.toThrow(ValidationError);
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

      const result = await client.getProof('0xtest123');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.neus.network/api/v1/proofs/0xtest123',
        expect.objectContaining({
          method: 'GET'
        })
      );

      expect(result.success).toBe(true);
      expect(result.proofId).toBe('0xtest123');
      expect(result.qHash).toBe('0xtest123');
    });

    it('should normalize proofId when API only returns qHash', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          status: 'verified',
          data: { status: 'verified', qHash: '0xonlyqhash' }
        })
      });

      const result = await client.getProof('0xonlyqhash');
      expect(result.proofId).toBe('0xonlyqhash');
      expect(result.qHash).toBe('0xonlyqhash');
    });

    it('should handle API errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({
          success: false,
          error: { message: 'Proof not found', code: 'NOT_FOUND' }
        })
      });

      await expect(client.getProof('0xinvalid')).rejects.toThrow(ApiError);
    });
  });

  describe('getVerifiers()', () => {
    it('should return array of verifiers', async () => {
      const mockResponse = {
        success: true,
        data: ['ownership-basic', 'nft-ownership', 'token-holding']
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

    it('should return catalog metadata when requested', async () => {
      const mockResponse = {
        success: true,
        data: ['ownership-social'],
        metadata: {
          'ownership-social': {
            flowType: 'interactive',
            supportsDirectApi: false
          }
        },
        meta: { hubChainId: 8453 }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const catalog = await client.getVerifierCatalog();
      expect(catalog.data).toEqual(['ownership-social']);
      expect(catalog.metadata['ownership-social']?.supportsDirectApi).toBe(false);
      expect(catalog.meta?.hubChainId).toBe(8453);
    });
  });

  describe('verify() catalog capabilities', () => {
    it('rejects hosted-only verifiers based on public catalog capability', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: ['ownership-social'],
          metadata: {
            'ownership-social': {
              supportsDirectApi: false
            }
          }
        })
      });

      await expect(client.verify({
        verifier: 'ownership-social',
        data: { provider: 'github' }
      })).rejects.toThrow('requires hosted interactive checkout');
    });
  });

  describe('createWalletLinkData()', () => {
    it('builds a signed wallet-link payload for direct advanced flows', async () => {
      const wallet = {
        selectedAddress: '0x2222222222222222222222222222222222222222',
        request: vi.fn(async ({ method, params }) => {
          if (method === 'personal_sign') {
            expect(typeof params?.[0]).toBe('string');
            expect(params?.[1]).toBe('0x2222222222222222222222222222222222222222');
            return '0xsigned';
          }
          throw new Error(`Unexpected method: ${method}`);
        })
      };

      const data = await client.createWalletLinkData({
        primaryWalletAddress: '0x1111111111111111111111111111111111111111',
        secondaryWalletAddress: '0x2222222222222222222222222222222222222222',
        wallet,
        relationshipType: 'ORG',
        label: ' Team wallet '
      });

      expect(data).toMatchObject({
        primaryWalletAddress: '0x1111111111111111111111111111111111111111',
        secondaryWalletAddress: '0x2222222222222222222222222222222222222222',
        chain: `eip155:${client._getHubChainId()}`,
        signature: '0xsigned',
        signatureMethod: 'eip191',
        relationshipType: 'org',
        label: 'Team wallet'
      });
      expect(typeof data.signedTimestamp).toBe('number');
      expect(wallet.request).toHaveBeenCalledTimes(1);
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
    it('should validate proofId parameter', async () => {
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

  describe('verify() default options', () => {
    it('sends private stored defaults when options omitted', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { status: 'verified', qHash: `0x${'ab'.repeat(32)}` }
          })
      });

      const wallet = '0x1234567890123456789012345678901234567890';
      await client.verify({
        verifierIds: ['ownership-basic'],
        data: {
          owner: wallet,
          content: 'hello'
        },
        walletAddress: wallet,
        signature: `0x${'11'.repeat(65)}`,
        signedTimestamp: Date.now()
      });

      expect(fetch).toHaveBeenCalled();
      const [, init] = fetch.mock.calls[0];
      const body = JSON.parse(init.body);
      expect(body.options.privacyLevel).toBe('private');
      expect(body.options.publicDisplay).toBe(false);
      expect(body.options.storeOriginalContent).toBe(true);
    });

    it('honors explicit storeOriginalContent false', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { status: 'verified', qHash: `0x${'cd'.repeat(32)}` }
          })
      });

      const wallet = '0x2234567890123456789012345678901234567890';
      await client.verify({
        verifierIds: ['ownership-basic'],
        data: {
          owner: wallet,
          content: 'hello'
        },
        walletAddress: wallet,
        signature: `0x${'22'.repeat(65)}`,
        signedTimestamp: Date.now(),
        options: { storeOriginalContent: false }
      });

      const [, init] = fetch.mock.calls[0];
      const body = JSON.parse(init.body);
      expect(body.options.storeOriginalContent).toBe(false);
    });
  });

  describe('Network Error Handling', () => {
    it('should handle network timeouts', async () => {
      fetch.mockRejectedValueOnce(new Error('Network timeout'));

      await expect(client.getProof('0xtest')).rejects.toThrow(NetworkError);
    });

    it('should handle connection refused', async () => {
      const error = new Error('Connection refused');
      error.code = 'ECONNREFUSED';
      fetch.mockRejectedValueOnce(error);

      await expect(client.isHealthy()).resolves.toBe(false);
    });
  });
});

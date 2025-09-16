/**
 * NEUS SDK Utils Tests
 * Test utility functions for Day 1 production readiness
 */
import { describe, it, expect } from 'vitest';
import {
  constructVerificationMessage,
  validateWalletAddress,
  validateTimestamp,
  validateQHash,
  normalizeAddress,
  createVerificationData,
  deriveDid,
  isTerminalStatus,
  isSuccessStatus,
  isFailureStatus,
  formatVerificationStatus,
  formatTimestamp,
  isSupportedChain,
  withRetry,
  delay,
  computeContentHash,
  NEUS_CONSTANTS
} from '../utils.js';

describe('Utils', () => {
  describe('constructVerificationMessage()', () => {
    it('should create consistent message format', () => {
      const params = {
        walletAddress: '0x742d35Cc6634C0532925a3b8D82AB78c0D73C3Db',
        signedTimestamp: 1678886400000,
        data: { content: 'test', owner: '0x742d35Cc6634C0532925a3b8D82AB78c0D73C3Db' },
        verifierIds: ['ownership-basic'],
        chainId: 84532
      };

      const message = constructVerificationMessage(params);

      expect(typeof message).toBe('string');
      expect(message).toContain('NEUS Verification Request');
      expect(message).toContain('0x742d35Cc6634C0532925a3b8D82AB78c0D73C3Db');
      expect(message).toContain('1678886400000');
      expect(message).toContain('ownership-basic');
    });

    it('should handle multiple verifiers', () => {
      const params = {
        walletAddress: '0x742d35Cc6634C0532925a3b8D82AB78c0D73C3Db',
        signedTimestamp: 1678886400000,
        data: { content: 'test' },
        verifierIds: ['ownership-basic', 'nft-ownership'],
        chainId: 84532
      };

      const message = constructVerificationMessage(params);

      expect(message).toContain('ownership-basic');
      expect(message).toContain('nft-ownership');
    });
  });

  describe('validateWalletAddress()', () => {
    it('should validate correct addresses', () => {
      expect(validateWalletAddress('0x742d35Cc6634C0532925a3b8D82AB78c0D73C3Db')).toBe(true);
      expect(validateWalletAddress('0x0000000000000000000000000000000000000000')).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(validateWalletAddress('')).toBe(false);
      expect(validateWalletAddress('742d35Cc6634C0532925a3b8D82AB78c0D73C3Db')).toBe(false); // No 0x
      expect(validateWalletAddress('0x742d35')).toBe(false); // Too short
      expect(validateWalletAddress('0x742d35Cc6634C0532925a3b8D82AB78c0D73C3DbXX')).toBe(false); // Too long
      expect(validateWalletAddress('0xZZZd35Cc6634C0532925a3b8D82AB78c0D73C3Db')).toBe(false); // Invalid chars
      expect(validateWalletAddress(null)).toBe(false);
      expect(validateWalletAddress(undefined)).toBe(false);
      expect(validateWalletAddress(123)).toBe(false);
    });
  });

  describe('validateTimestamp()', () => {
    it('should validate recent timestamps', () => {
      const now = Date.now();
      expect(validateTimestamp(now)).toBe(true);
      expect(validateTimestamp(now - 60000)).toBe(true); // 1 minute ago
      expect(validateTimestamp(now - 299000)).toBe(true); // 4 min 59 sec ago (within default max)
    });

    it('should reject old timestamps', () => {
      const now = Date.now();
      expect(validateTimestamp(now - 600000)).toBe(false); // 10 minutes ago
      expect(validateTimestamp(now - 3600000)).toBe(false); // 1 hour ago
    });

    it('should reject future timestamps', () => {
      const future = Date.now() + 60000; // 1 minute in future
      expect(validateTimestamp(future)).toBe(false);
    });

    it('should respect custom max age', () => {
      const now = Date.now();
      const tenMinutesAgo = now - 600000;

      expect(validateTimestamp(tenMinutesAgo, 300000)).toBe(false); // 5min max
      expect(validateTimestamp(tenMinutesAgo, 900000)).toBe(true); // 15min max
    });

    it('should handle invalid inputs', () => {
      expect(validateTimestamp()).toBe(false);
      expect(validateTimestamp(null)).toBe(false);
      expect(validateTimestamp('invalid')).toBe(false);
      expect(validateTimestamp(-1)).toBe(false);
    });
  });

  describe('createVerificationData()', () => {
    it('should create basic verification data', () => {
      const data = createVerificationData(
        'test content',
        '0x742d35Cc6634C0532925a3b8D82AB78c0D73C3Db'
      );

      expect(data).toEqual({
        content: 'test content',
        owner: '0x742d35cc6634c0532925a3b8d82ab78c0d73c3db', // Addresses are normalized to lowercase
        reference: {
          type: 'content',
          id: expect.any(String)
        }
      });
    });

    it('should accept custom reference', () => {
      const customRef = { type: 'custom', id: 'test123' };
      const data = createVerificationData(
        'test content',
        '0x742d35Cc6634C0532925a3b8D82AB78c0D73C3Db',
        customRef
      );

      expect(data.reference).toEqual(customRef);
    });
  });

  describe('deriveDid()', () => {
    it('should create DID from address', () => {
      const did = deriveDid('0x742d35Cc6634C0532925a3b8D82AB78c0D73C3Db');
      expect(did).toBe('did:pkh:eip155:84532:0x742d35cc6634c0532925a3b8d82ab78c0d73c3db'); // DID standard uses lowercase
    });

    it('should accept custom chain ID', () => {
      const did = deriveDid('0x742d35Cc6634C0532925a3b8D82AB78c0D73C3Db', 1);
      expect(did).toBe('did:pkh:eip155:1:0x742d35cc6634c0532925a3b8d82ab78c0d73c3db'); // DID standard uses lowercase
    });

    it('should handle lowercase addresses', () => {
      const did = deriveDid('0x742d35cc6634c0532925a3b8d82ab78c0d73c3db');
      expect(did).toBe('did:pkh:eip155:84532:0x742d35cc6634c0532925a3b8d82ab78c0d73c3db');
    });
  });

  describe('Status Checking Functions', () => {
    describe('isTerminalStatus()', () => {
      it('should identify terminal statuses', () => {
        expect(isTerminalStatus('verified')).toBe(true);
        expect(isTerminalStatus('verified_crosschain_propagated')).toBe(true);
        expect(isTerminalStatus('verified_no_verifiers')).toBe(true);
        expect(isTerminalStatus('rejected')).toBe(true);
        expect(isTerminalStatus('rejected_verifier_failure')).toBe(true);
        expect(isTerminalStatus('error_processing_exception')).toBe(true);
        expect(isTerminalStatus('not_found')).toBe(true);
      });

      it('should identify non-terminal statuses', () => {
        expect(isTerminalStatus('pending')).toBe(false);
        expect(isTerminalStatus('processing')).toBe(false);
        expect(isTerminalStatus('processing_verifiers')).toBe(false);
        expect(isTerminalStatus('signing')).toBe(false);
      });
    });

    describe('isSuccessStatus()', () => {
      it('should identify success statuses', () => {
        expect(isSuccessStatus('verified')).toBe(true);
        expect(isSuccessStatus('verified_no_verifiers')).toBe(true);
        expect(isSuccessStatus('verified_crosschain_propagated')).toBe(true);
        expect(isSuccessStatus('partially_verified')).toBe(true);
      });

      it('should identify non-success statuses', () => {
        expect(isSuccessStatus('pending')).toBe(false);
        expect(isSuccessStatus('failed')).toBe(false);
        expect(isSuccessStatus('error')).toBe(false);
      });
    });

    describe('isFailureStatus()', () => {
      it('should identify failure statuses', () => {
        expect(isFailureStatus('rejected')).toBe(true);
        expect(isFailureStatus('rejected_verifier_failure')).toBe(true);
        expect(isFailureStatus('rejected_zk_initiation_failure')).toBe(true);
        expect(isFailureStatus('error_processing_exception')).toBe(true);
        expect(isFailureStatus('not_found')).toBe(true);
      });

      it('should identify non-failure statuses', () => {
        expect(isFailureStatus('verified')).toBe(false);
        expect(isFailureStatus('pending')).toBe(false);
        expect(isFailureStatus('processing')).toBe(false);
      });
    });
  });

  describe('formatVerificationStatus()', () => {
    it('should format status objects correctly', () => {
      const formatted = formatVerificationStatus('verified');

      expect(formatted).toHaveProperty('label');
      expect(formatted).toHaveProperty('description');
      expect(formatted).toHaveProperty('color');
      expect(formatted).toHaveProperty('category');

      expect(typeof formatted.label).toBe('string');
      expect(typeof formatted.description).toBe('string');
      expect(typeof formatted.color).toBe('string');
      expect(typeof formatted.category).toBe('string');
    });

    it('should handle unknown statuses', () => {
      const formatted = formatVerificationStatus('unknown_status');

      expect(formatted.label).toBe('Unknown Status'); // Actual implementation capitalizes and formats
      expect(formatted.category).toBe('unknown');
    });
  });

  describe('delay()', () => {
    it('should resolve after specified time', async () => {
      const start = Date.now();
      await delay(50);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(45); // Account for timing variance
      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('computeContentHash()', () => {
    it('should generate consistent hashes', async () => {
      const hash1 = await computeContentHash('test content');
      const hash2 = await computeContentHash('test content');

      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for different content', async () => {
      const hash1 = await computeContentHash('content 1');
      const hash2 = await computeContentHash('content 2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('validateQHash()', () => {
    it('should validate correct qHash format', () => {
      expect(
        validateQHash('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')
      ).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(validateQHash('invalid')).toBe(false);
      expect(validateQHash('0x123')).toBe(false); // Too short
      expect(
        validateQHash('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')
      ).toBe(false); // Missing 0x
      expect(validateQHash(null)).toBe(false);
      expect(validateQHash('')).toBe(false);
    });
  });

  describe('normalizeAddress()', () => {
    it('should normalize valid address to lowercase', () => {
      const address = '0x742d35Cc6634C0532925a3b8D82AB78c0D73C3Db';
      expect(normalizeAddress(address)).toBe('0x742d35cc6634c0532925a3b8d82ab78c0d73c3db');
    });

    it('should throw on invalid address', () => {
      expect(() => normalizeAddress('invalid')).toThrow('Invalid wallet address format');
    });
  });

  describe('formatTimestamp()', () => {
    it('should format timestamp to readable string', () => {
      const timestamp = 1678886400000;
      const formatted = formatTimestamp(timestamp);

      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('isSupportedChain()', () => {
    it('should return true for hub chain', () => {
      expect(isSupportedChain(NEUS_CONSTANTS.HUB_CHAIN_ID)).toBe(true);
    });

    it('should return true for testnet chains', () => {
      NEUS_CONSTANTS.TESTNET_CHAINS.forEach(chainId => {
        expect(isSupportedChain(chainId)).toBe(true);
      });
    });

    it('should return false for unsupported chains', () => {
      expect(isSupportedChain(1)).toBe(false); // Ethereum mainnet
      expect(isSupportedChain(137)).toBe(false); // Polygon mainnet
      expect(isSupportedChain(999999)).toBe(false); // Invalid chain
    });
  });

  describe('withRetry()', () => {
    it('should retry failed function calls', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 3) throw new Error('Test error');
        return 'success';
      };

      const result = await withRetry(fn, { maxAttempts: 3, baseDelay: 10 });
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw error after max attempts', async () => {
      const fn = async () => {
        throw new Error('Always fails');
      };

      await expect(withRetry(fn, { maxAttempts: 2, baseDelay: 10 })).rejects.toThrow(
        'Always fails'
      );
    });

    it('should return immediately on success', async () => {
      const fn = async () => 'immediate success';

      const result = await withRetry(fn);
      expect(result).toBe('immediate success');
    });
  });

  describe('NEUS_CONSTANTS', () => {
    it('should have correct hub chain ID', () => {
      expect(NEUS_CONSTANTS.HUB_CHAIN_ID).toBe(84532);
    });

    it('should have correct testnet chains', () => {
      expect(NEUS_CONSTANTS.TESTNET_CHAINS).toEqual([11155111, 11155420, 421614, 80002]);
    });

    it('should have default verifiers', () => {
      expect(NEUS_CONSTANTS.DEFAULT_VERIFIERS).toEqual([
        'ownership-basic',
        'nft-ownership',
        'token-holding',
        'ownership-licensed'
      ]);
    });
  });
});

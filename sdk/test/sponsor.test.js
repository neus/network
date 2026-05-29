import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fetchSponsorGrant } from '../sponsor.js';
import { ValidationError, ApiError, NetworkError } from '../errors.js';

global.fetch = vi.fn();

describe('fetchSponsorGrant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requires appId and orgWallet', async () => {
    await expect(fetchSponsorGrant({ orgWallet: '0x1234567890123456789012345678901234567890' }))
      .rejects.toThrow(ValidationError);
    await expect(fetchSponsorGrant({ appId: 'my-app' }))
      .rejects.toThrow(ValidationError);
  });

  it('posts sponsor grant request with integrator headers', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            sponsorGrant: 'grant-token-abc',
            exp: 1_700_000_000,
            orgWallet: '0x1234567890123456789012345678901234567890',
            appId: 'my-app'
          }
        })
    });

    const result = await fetchSponsorGrant({
      appId: 'my-app',
      orgWallet: '0x1234567890123456789012345678901234567890',
      verifierIds: ['ownership-basic'],
      origin: 'https://app.example'
    });

    expect(result.sponsorGrant).toBe('grant-token-abc');
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://api.neus.network/api/v1/sponsor/grant');
    expect(init.method).toBe('POST');
    expect(init.headers['X-Neus-App']).toBe('my-app');
    expect(init.headers.Origin).toBe('https://app.example');
    const body = JSON.parse(init.body);
    expect(body.orgWallet).toBe('0x1234567890123456789012345678901234567890');
    expect(body.verifierIds).toEqual(['ownership-basic']);
  });

  it('throws ApiError on upstream failure', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () =>
        Promise.resolve({
          success: false,
          error: { message: 'Origin not authorized' }
        })
    });

    await expect(
      fetchSponsorGrant({
        appId: 'my-app',
        orgWallet: '0x1234567890123456789012345678901234567890'
      })
    ).rejects.toThrow(ApiError);
  });

  it('wraps network failures', async () => {
    fetch.mockRejectedValueOnce(new Error('offline'));

    await expect(
      fetchSponsorGrant({
        appId: 'my-app',
        orgWallet: '0x1234567890123456789012345678901234567890'
      })
    ).rejects.toThrow(NetworkError);
  });
});

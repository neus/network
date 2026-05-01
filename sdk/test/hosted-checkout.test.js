import { describe, expect, it } from 'vitest';
import {
  buildHostedCheckoutUrl,
  buildHostedCheckoutRedirectUrl
} from '../widgets/verify-gate/hostedCheckout.js';

describe('hosted checkout handoff URLs', () => {
  it('keeps popup mode for popup launches but removes it for same-window redirects', () => {
    const popupUrl = buildHostedCheckoutUrl({
      hostedCheckoutUrl: 'https://neus.network/verify',
      verifierList: ['proof-of-human'],
      returnUrl: 'https://app.example/demo?claim=fair-airdrop',
      origin: 'https://app.example'
    });

    const popup = new URL(popupUrl);
    expect(popup.searchParams.get('mode')).toBe('popup');
    expect(popup.searchParams.get('returnUrl')).toBe('https://app.example/demo?claim=fair-airdrop');
    expect(popup.searchParams.get('origin')).toBe('https://app.example');

    const redirect = new URL(buildHostedCheckoutRedirectUrl(popupUrl));
    expect(redirect.searchParams.get('mode')).toBeNull();
    expect(redirect.searchParams.get('returnUrl')).toBe('https://app.example/demo?claim=fair-airdrop');
    expect(redirect.searchParams.get('origin')).toBe('https://app.example');
  });
});

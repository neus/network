export const HOSTED_CHECKOUT_MESSAGE_TYPE = 'neus_checkout_done';

export function buildHostedCheckoutUrl({
  hostedCheckoutUrl,
  verifierList,
  returnUrl,
  origin,
  oauthProvider,
  campaignTitle,
  campaignMessage
}) {
  const checkoutUrl = new URL(hostedCheckoutUrl);
  checkoutUrl.searchParams.set('verifiers', verifierList.join(','));
  checkoutUrl.searchParams.set('mode', 'popup');
  checkoutUrl.searchParams.set('returnUrl', returnUrl);
  checkoutUrl.searchParams.set('origin', origin);
  if (typeof oauthProvider === 'string' && oauthProvider.trim()) {
    checkoutUrl.searchParams.set('oauthProvider', oauthProvider.trim());
  }
  if (typeof campaignTitle === 'string' && campaignTitle.trim()) {
    checkoutUrl.searchParams.set('presetLabel', campaignTitle.trim().slice(0, 200));
  }
  if (typeof campaignMessage === 'string' && campaignMessage.trim()) {
    checkoutUrl.searchParams.set('message', campaignMessage.trim().slice(0, 200));
  }
  return checkoutUrl.toString();
}

export function buildHostedCheckoutRedirectUrl(popupCheckoutUrl) {
  const checkoutUrl = new URL(popupCheckoutUrl);
  checkoutUrl.searchParams.delete('mode');
  return checkoutUrl.toString();
}

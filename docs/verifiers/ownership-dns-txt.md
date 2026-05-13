# ownership-dns-txt

Domain ownership verification via DNS TXT records

- **Access:** `public`
- **Category:** `ownership`
- **Flow:** `external_lookup`
- **Expiry:** `point_in_time`
- **Schema:** [./schemas/ownership-dns-txt.json](./schemas/ownership-dns-txt.json) — JSON Schema for the `data` field

## DNS record (setup in your DNS panel)

Publish **TXT** at `_neus.<domain>`.

- **Value format:** `wallet=<your-wallet-or-account-address>` (required prefix `wallet=`).
- **Ethereum:** use lowercase `0x` plus 40 hex digits in DNS so it matches what NEUS expects for Ethereum addresses.
- **Solana and other networks:** use the address format NEUS expects for that network. For **Solana**, the string is **case-sensitive**—use the exact value NEUS shows for that account (for example in the product or SDK copy helpers).
- **Alternate line:** `wallet=eip155:<chainId>:<address>` is accepted only when the verification run includes the matching numeric `chainId` in verifier options (otherwise rely on `wallet=<address>`).

## Full payload (`data` object)

_Fields in the `data` object for the verification request. Signing and top-level `walletAddress` follow the same rules as other signed proof flows._

### Required fields

- `domain` (`string`, hostname, min length 1) — Domain you control in DNS.

### Optional in schema, required in practice

- `walletAddress` (`string`, `universal-address`) — **Omit** from `data` only when the **proof request** already supplies a verified signer `walletAddress` (the service fills it in before the DNS check). The TXT record must still match the wallet or account address NEUS uses for the proof. **Include** `walletAddress` in `data` for self-contained API calls or when you want the signed payload to list the address explicitly.

- **Compatible with:** `ownership-basic`, `agent-identity`

## Example

_Illustrative values only. Use real addresses and tokens from your integration._

```javascript
await client.verify({
  verifier: 'ownership-dns-txt',
  data: {
    "domain": "example.com",
    "walletAddress": "0x3333333333333333333333333333333333333333"
  }
});

// Request shape (illustrative) — signer wallet at top level is enough to omit data.walletAddress
{
  "verifierIds": [
    "ownership-dns-txt"
  ],
  "data": {
    "domain": "example.com",
    "walletAddress": "0x3333333333333333333333333333333333333333"
  },
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "signature": "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001",
  "signedTimestamp": 1700000000000,
  "chainId": 84532
}
```

## Next steps

- Use this verifier in `requiredVerifiers` for `VerifyGate` or in `verifierIds` for API gate checks.
- For hosted-only verifiers, use hosted checkout (`hostedCheckoutUrl`) where applicable.
- Return to the [Verifier Catalog](./README.md).

# NEUS API - Minimal cURL Example

Complete verification in a single API call.

## Sign the Standard Message Format

Sign this 6-line message with your wallet:

```
NEUS Verification Request
Wallet: 0x742d35cc6634c0532925a3b8d82ab78c0d73c3db
Chain: 84532
Verifiers: ownership-basic
Data: {"content":"Hello NEUS","owner":"0x742d35Cc6634C0532925a3b8D82AB78c0D73C3Db"}
Timestamp: 1678886400000
```

## Submit Verification

```bash
curl -X POST https://api.neus.network/api/v1/verification \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b8D82AB78c0D73C3Db",
    "verifierIds": ["ownership-basic"],
    "data": {"content": "Hello NEUS", "owner": "0x742d35Cc6634C0532925a3b8D82AB78c0D73C3Db"},
    "signedTimestamp": 1678886400000,
    "signature": "0x...",
    "chainId": 84532
  }'
```

## Check Status

```bash
curl https://api.neus.network/api/v1/verification/status/0x{qHash}
```

## Troubleshooting

If you encounter signature issues, use the helper endpoint:

```bash
curl -X POST https://api.neus.network/api/v1/verification/standardize \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x...","verifierIds":["ownership-basic"],"data":{"content":"Hello"},"signedTimestamp":1678886400000}'
```
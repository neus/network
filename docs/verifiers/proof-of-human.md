# proof-of-human

Hosted human verification for sybil resistance

- **Access:** `public`
- **Category:** `identity`
- **Flow:** `interactive`
- **Expiry:** `expiring`
- **Schema:** [./schemas/proof-of-human.json](./schemas/proof-of-human.json) — JSON Schema for the `data` field

## Hosted input

_What you pass to start the hosted flow. NEUS collects and submits the raw proof bundle in the hosted session._

### Required fields

- `provider` (`string enum: zkpassport`)

### Optional fields

- `scope` (`string pattern ^[a-zA-Z0-9_-]{1,64}$`)

- **Compatible with:** `ownership-basic`, `ownership-social`, `ai-content-moderation`

## Example

_Hosted-only. Use `VerifyGate` or send users to hosted `/verify`._

```javascript
<VerifyGate
  requiredVerifiers={['proof-of-human']}
  verifierData={{
    'proof-of-human': {
      provider: 'zkpassport',
      scope: 'neus-v1',
    },
  }}
/>
```

## Next steps

- Use this verifier in `requiredVerifiers` for `VerifyGate`.
- Hosted Verify: `https://neus.network/verify?verifiers=proof-of-human`
- Do not manually assemble `proofs` / `queryResult` through the public SDK path.
- Return to the [Verifier Catalog](./README.md).

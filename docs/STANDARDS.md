# Standards & Protocol Specifications

**Technical specifications for NEUS Network protocol integration**

NEUS follows established blockchain standards and implements secure authentication patterns for seamless integration.

---

## Core Standards

### Chain IDs

* **Numeric chain IDs only** in SDK/API and in signed messages (e.g., `1`, `8453`, `84532`).
* **Hub (enforced):** `PRIMARY_CHAIN_ID = 84532` (Base Sepolia).

See also
- API request/response flows: [./api/README.md](./api/README.md)

### Identity (DIDs)

* **did:pkh** (`did:pkh:eip155:<chainId>:<address>`) is stored and emitted in proofs.
* CAIP strings may be shown in UI or documentation, but they are not sent in requests and are not stored except as part of the DID string.

### Off-chain Signatures (used today)

* **EIP-191** (“personal\_sign”) with a **canonical NEUS message**:

  ```
  NEUS Verification Request
  Wallet: 0x<lowercased address>
  Chain: 84532
  Verifiers: ownership-basic, ...
  Data: <deterministic JSON of the request payload>
  Timestamp: <unix ms, freshness window enforced>
  ```
* Server rebuilds/validates this and enforces `PRIMARY_CHAIN_ID` (84532).

Related
- Troubleshooting signatures and standardization helpers: [./api/README.md](./api/README.md)

#### Signature Contract (Normative)

**Signature standard:** EIP-191 (“personal_sign”).  
**Hub chain (enforced):** `84532` (Base Sepolia).  
**Smart accounts:** EIP-1271 and EIP-6492 are supported server-side.

1) Canonical message (exactly 6 lines, exact order)

```
NEUS Verification Request
Wallet: 0x<lowercased address>
Chain: 84532
Verifiers: <comma-separated verifier ids>
Data: <deterministic JSON of request.data>
Timestamp: <unix ms>
```

– Wallet MUST be lowercased inside the message.  
– Chain MUST be the numeric hub chain id (`84532`).  
– Verifiers MUST list the same IDs sent in `verifierIds`.  
– Data MUST be the deterministic JSON of the `data` object only.  
– Timestamp MUST be Unix milliseconds.

2) Deterministic JSON (Normative)

– Objects: sort keys ordinal; omit `undefined`; keep `null`.  
– Arrays: preserve order; canonicalize elements recursively.  
– Strings: standard JSON escaping.  
– Numbers: culture-invariant decimal with a dot (`.`).  
– No extra whitespace (no pretty print).

3) What is signed vs. what is sent

– The six-line message above is what gets signed.  
– The HTTP body includes `walletAddress, signature, signedTimestamp, chainId, verifierIds, data, [options...]`.  
– `options` are not included in the signed message.

4) Freshness and errors

– Freshness window: signatures older than 5 minutes or >1 minute in the future are rejected.  
– Typical errors: `SIGNATURE_VERIFICATION_FAILED`, `SIGNATURE_EXPIRED`, `PAYLOAD_INVALID`.

### Smart Account Signatures

* **EIP-1271**: contract-wallet validation when EOA recovery fails.
* **EIP-6492**: detect/unwrap pre-deployment (counterfactual) signatures.
* Both are **implemented**.

### On-chain Transactions

* **EIP-155** applies automatically to on-chain transactions (for example, the hub transaction stored in `hubTransaction`).
* EIP-155 is not used for off‑chain authentication.

### Cross-chain Vouchers (propagation)

* **ERC-7683-compatible**, one voucher **per target chain**, all **anchored by `qHash`**.

  ```solidity
  struct Voucher {
      bytes32 qHash;          // NEUS verification anchor
      uint256 sourceChainId;  // hub chain (84532 today)
      uint256 targetChainId;  // numeric
      address relayer;
      uint256 expiry;
      bytes   proof;          // opaque verifier/proof payload
  }
  ```

See also
- Voucher security model and guarantees: [./VOUCHER-SECURITY.md](./VOUCHER-SECURITY.md)

### Cryptography

* **SHAKE-256** → `qHash` (anchor for proofs/vouchers/storage references).
* **ECDSA secp256k1** → wallet signatures; **EIP-1271/6492** for smart accounts.

---

## Not used currently

* **CAIP-2 in requests**: Not used. CAIP appears only in documentation/DIDs.
* **EIP-712**: Not used yet (planned; see “Future” below).

---

## Minimal examples

### SDK/API payload

```ts
const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'Hello NEUS...',
  options: {
    // spoke chains (if any). hub is implicit (84532) and enforced server-side.
    targetChains: [421614, 11155111], 
    privacyLevel: 'public',
    storeOriginalContent: true,
    enableIpfs: true
  },
  meta: {
    tags: ['program', 'proof-of-support']
  }
});
```

### Stored proof (key fields)

* `did`: `did:pkh:eip155:84532:<wallet>`
* `hubTransaction.chainId`: `84532`
* `verifierContentHash`: hex string
* `options.privacyLevel`: `'public' | 'private'`
* Originals stored **only** when `privacyLevel === 'public'` **and** `storeOriginalContent === true`.

---

## Implementation checklist

* **Chain IDs:** numeric everywhere in code; **do not** send CAIP strings in requests.
* **Hub enforcement:** server validates `Chain: 84532` in the signed message.
* **Signatures:** EIP-191 canonical message; freshness window enforced; address lowercased in message.
* **Smart accounts:** support EIP-1271 and EIP-6492 paths.
* **Vouchers:** ERC-7683-compatible; one target per voucher; anchor by `qHash`.
* **Content proofs:** verifiers emit hashed content `verifierContentHash`; original content stored only if `public` + `storeOriginalContent=true`.
* **OAuth:** code + PKCE; do not retain tokens; store only non-sensitive public identifiers if needed.

---

## Future (planned)

* **Contracts switch:** changed to mainnet; everything else unchanged.
* **Additional spokes:** expand `targetChains` set (still numeric).
* **ZK circuits:** more verifiers using zk (RISC-Zero/STARK); current verifiers may mark `zk_not_required`.

---
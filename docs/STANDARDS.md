# Standards & Protocol Specifications

**Technical specifications for NEUS Network protocol integration**

NEUS Network follows established blockchain standards and implements secure authentication patterns for seamless integration.

---

## Core Standards

### Chain IDs

* **Numeric chain IDs only** in SDK/API and in signed messages (e.g., `1`, `8453`, `84532`).
* **Hub (enforced):** `PRIMARY_CHAIN_ID = 84532` (Base Sepolia).

### Identity (DIDs)

* **did:pkh** (`did:pkh:eip155:<chainId>:<address>`) stored and emitted in proofs.
* We **may** show CAIP strings in UI/docs, but we **don’t** send them in requests and **don’t** store them except as part of the DID string.

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

* **EIP-155** applies automatically to on-chain tx (e.g., the hub transaction stored in `hubTransaction`).
* We do **not** use EIP-155 for off-chain auth.

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

### Cryptography

* **SHAKE-256** → `qHash` (anchor for proofs/vouchers/storage references).
* **ECDSA secp256k1** → wallet signatures; **EIP-1271/6492** for smart accounts.

---

## What’s **not** used right now

* **CAIP-2 in requests**: **Not used.** CAIP for **docs/DIDs only**.
* **EIP-712**: **Not used yet.** (Planned; see “Future” below.)

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
    tags: ['campaign', 'proof-of-support']
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

## Future (what we’ll add when ready)

* **Hub switch:** changed to Base mainnet; everything else unchanged.
* **EIP-712 typed data:** replace EIP-191 with 712 (domain.chainId **= hub**; include wallet, chain, timestamp, canonical payload; DID optional). Until then, **EIP-191 is the only accepted format.**
* **DNS verifier (re-intro, optional):** `_neus.example.com  TXT  "wallet=eip155:<id>:<address>"`.
* **Additional spokes:** expand `targetChains` set (still numeric).
* **ZK circuits:** more verifiers using zk (RISC-Zero/STARK); current verifiers may mark `zk_not_required`.

---
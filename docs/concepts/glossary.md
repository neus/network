# Glossary

## Proof ID

**Proof ID** (`proofId`) is the stable identifier for a proof record.

Use the Proof ID to:

- Store a portable reference to a proof
- Fetch status (`GET /api/v1/verification/status/{qHash}` with the same `proofId` value)
- Power gating and downstream integrations

### Notes

- Treat the Proof ID as **opaque**. Do not parse meaning from it.
- Proof freshness is determined by timestamps (for example `createdAt`, `completedAt`, and/or `lastUpdated` depending on the surface). A Proof ID does not change when you re-check status.

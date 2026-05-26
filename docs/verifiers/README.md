# Verifier schemas

JSON Schemas in **`schemas/`** describe the `data` object for each public verifier. Two schema sets exist:

- **`spec/verifiers/schemas/`** — Integrator-facing: the fields your app or API call must supply. Hosted verifiers require only the `provider` field.
- **`docs/verifiers/schemas/`** — Complete schemas: includes fields like `internalSocialToken` that the hosted OAuth flow populates automatically. Do not supply these fields in API calls.

- [Verifier catalog](https://docs.neus.network/verification/verifiers) (overview and usage)
- Each **`*.md`** file in this folder lists fields, hosted-flow inputs where applicable, and an illustrative example payload.
# Public API Spec

The NEUS Public API is defined by a single **OpenAPI 3.0** specification.

## Standard specification

- **OpenAPI JSON**: [`public-api.json`](public-api.json)

## Base URL

`https://api.neus.network`

## Authentication

Request-bound wallet signatures. See [Signing](../concepts/signing.md).

## Optional Attribution Header

Use `X-Neus-App` as an optional public app identifier for attribution and analytics. It is not a secret and is not used for authentication.

## Rate limits

Rate limits are documented in the [API Reference](README.md#rate-limits).

## Interactive reference (OpenAPI)

{% openapi src="https://raw.githubusercontent.com/neus/network/main/docs/api/public-api.json" %}

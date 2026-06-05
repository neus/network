# CI / Servers

## Use NEUS access key

```bash
npx -y -p @neus/sdk neus setup --access-key <npk_...>
```

Create access keys under **Account -> Access keys** on [neus.network](https://neus.network/profile?tab=account). Never paste keys into chat or committed files.

For bearer auth, pass the access key in the `Authorization` header:

```
Authorization: Bearer <npk_...>
```

Full docs: [docs.neus.network/mcp/setup](https://docs.neus.network/mcp/setup)

"use client";

// widgets/verify-gate/VerifyGate.jsx
import { useCallback, useMemo, useState, useEffect } from "react";
import { NeusClient } from "@neus/sdk/client";

// widgets/verify-gate/hostedCheckout.js
var HOSTED_CHECKOUT_MESSAGE_TYPE = "neus_checkout_done";
function buildHostedCheckoutUrl({
  hostedCheckoutUrl,
  verifierList = [],
  returnUrl,
  origin,
  oauthProvider,
  campaignTitle,
  campaignMessage,
  appId,
  billingWallet,
  gateId
}) {
  const checkoutUrl = new URL(hostedCheckoutUrl);
  checkoutUrl.searchParams.set("mode", "popup");
  checkoutUrl.searchParams.set("returnUrl", returnUrl);
  checkoutUrl.searchParams.set("origin", origin);
  const gateIdTrimmed = typeof gateId === "string" ? gateId.trim() : "";
  if (gateIdTrimmed) {
    checkoutUrl.searchParams.set("gateId", gateIdTrimmed);
  } else {
    const verifiers = Array.isArray(verifierList) ? verifierList.filter(Boolean) : [];
    if (verifiers.length > 0) {
      checkoutUrl.searchParams.set("verifiers", verifiers.join(","));
    }
    if (typeof appId === "string" && appId.trim()) {
      checkoutUrl.searchParams.set("appId", appId.trim());
    }
    if (typeof billingWallet === "string" && billingWallet.trim()) {
      checkoutUrl.searchParams.set("billingWallet", billingWallet.trim().toLowerCase());
    }
  }
  if (typeof oauthProvider === "string" && oauthProvider.trim()) {
    checkoutUrl.searchParams.set("oauthProvider", oauthProvider.trim());
  }
  if (typeof campaignTitle === "string" && campaignTitle.trim()) {
    checkoutUrl.searchParams.set("presetLabel", campaignTitle.trim().slice(0, 200));
  }
  if (typeof campaignMessage === "string" && campaignMessage.trim()) {
    checkoutUrl.searchParams.set("message", campaignMessage.trim().slice(0, 200));
  }
  return checkoutUrl.toString();
}
function buildHostedCheckoutRedirectUrl(popupCheckoutUrl) {
  const checkoutUrl = new URL(popupCheckoutUrl);
  checkoutUrl.searchParams.delete("mode");
  return checkoutUrl.toString();
}

// brand-mark.js
var NEUS_BRAND_PACK_VERSION = "2026-06-03-mark-og-finalize-v1";
var NEUS_MARK_CDN_ORIGIN = "https://neus.network";
var PACK_BASE = `${NEUS_MARK_CDN_ORIGIN}/images/neus-brand-pack`;
var v = encodeURIComponent(NEUS_BRAND_PACK_VERSION);
function withBrandPackVersion(file) {
  const name = file.replace(/^\//, "");
  return `${PACK_BASE}/${name}?v=${v}`;
}
var NEUS_DEFAULT_MARK_URL = withBrandPackVersion("favicon.svg");
var NEUS_DEFAULT_OG_IMAGE_URL = withBrandPackVersion("og-default-1200x630-neus.png");

// widgets/verify-gate/VerifyGate.jsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var THEME = {
  primary: "var(--neus-primary, #98C0EF)",
  primaryHover: "var(--neus-primary-hover, rgb(61, 114, 201))",
  onAccent: "#0a0a0a",
  success: "var(--neus-trust, var(--neus-primary, #98C0EF))",
  error: "var(--neus-error, #ef4444)",
  warning: "var(--neus-warning, #f59e0b)",
  bgDark: "var(--neus-bg-dark, rgba(2, 6, 23, 0.95))",
  bgCard: "var(--neus-bg-card, rgba(15, 23, 42, 0.8))",
  textPrimary: "var(--neus-text-primary, rgba(255, 255, 255, 0.93))",
  textSecondary: "var(--neus-text-secondary, #94a3b8)",
  textMuted: "var(--neus-text-muted, #64748b)",
  border: "var(--neus-border, rgba(148, 163, 184, 0.2))",
  borderHover: "var(--neus-border-hover, rgba(61, 114, 201, 0.4))"
};
if (typeof document !== "undefined") {
  const sid = "neus-vg-primary-cta";
  if (!document.getElementById(sid)) {
    const el = document.createElement("style");
    el.id = sid;
    el.textContent = "@keyframes neus-vg-spin{to{transform:rotate(360deg)}}button.neus-vg__primary{ color: #0a0a0a !important; -webkit-text-fill-color: #0a0a0a; }button.neus-vg__primary .neus-vg__label,button.neus-vg__primary span.neus-vg__label{ color: inherit !important; -webkit-text-fill-color: inherit; }";
    document.head.appendChild(el);
  }
}
var DEFAULT_HOSTED_CHECKOUT_URL = "https://neus.network/verify";
var VERIFY_GATE_DEFAULT_ERROR = "Something went wrong. Please try again.";
function getVerifyGateUserError(err) {
  const c = err && err.code;
  const msg = String(err && err.message || "");
  if (c === "INVALID_WALLET_ADDRESS" || c === "CONFIGURATION_ERROR") {
    return "Connect a wallet and try again.";
  }
  if (msg === "walletAddress is required and must be a string") {
    return "Connect a wallet and try again.";
  }
  if (/^User rejected\b/i.test(msg) || /rejected the signature|User rejected the wallet-link/i.test(msg)) {
    return "The request was cancelled.";
  }
  if (c === "VALIDATION_ERROR" && /wallet|connect|No wallet|No Web3|accounts available|walletAddress/i.test(msg)) {
    return "Connect a wallet and try again.";
  }
  return null;
}
function dispatchNeusProofCreatedForHost({ qHash, walletAddress }) {
  try {
    if (typeof window === "undefined") return;
    const raw = typeof qHash === "string" ? qHash.trim() : "";
    if (!raw) return;
    const w = typeof walletAddress === "string" ? walletAddress.trim() : "";
    const normalizedWallet = w && /^0x[a-fA-F0-9]{40}$/.test(w) ? w.toLowerCase() : w;
    window.dispatchEvent(
      new CustomEvent("neusAccessUpdated", {
        detail: {
          proofCreated: true,
          qHash: raw,
          ...normalizedWallet ? { walletAddress: normalizedWallet } : {}
        }
      })
    );
  } catch (_err) {
  }
}
function VerifyGateInlineSpinner({ size = 16 }) {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      "aria-hidden": "true",
      style: { animation: "neus-vg-spin 0.8s linear infinite" },
      children: [
        /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "9", fill: "none", stroke: "currentColor", strokeWidth: "3", opacity: "0.25" }),
        /* @__PURE__ */ jsx("path", { d: "M21 12a9 9 0 0 0-9-9", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round" })
      ]
    }
  );
}
function NeusLogo({ size = 16 }) {
  return /* @__PURE__ */ jsx(
    "img",
    {
      src: NEUS_DEFAULT_MARK_URL,
      alt: "",
      "aria-hidden": "true",
      width: size,
      height: size,
      style: {
        width: size,
        height: size,
        display: "block",
        borderRadius: 4,
        flexShrink: 0,
        objectFit: "contain",
        background: "transparent"
      }
    }
  );
}
function VerifyGate({
  gateId = void 0,
  requiredVerifiers = ["ownership-basic"],
  onVerified = void 0,
  apiUrl = void 0,
  appId = void 0,
  billingWallet = void 0,
  paymentSignature = void 0,
  extraHeaders = void 0,
  hostedCheckoutUrl = void 0,
  oauthProvider = void 0,
  style = void 0,
  children = void 0,
  showBrand = false,
  disabled = false,
  buttonText = void 0,
  mode = "create",
  qHash: qHashProp = null,
  strategy = "reuse-or-create",
  checkExisting = true,
  allowPrivateReuse = true,
  campaignTitle = void 0,
  campaignMessage = void 0,
  onStateChange = void 0,
  onError = void 0,
  wallet = void 0,
  chain = void 0,
  signatureMethod = void 0
}) {
  const [state, setState] = useState("idle");
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [existingProofs, setExistingProofs] = useState(null);
  const [operation, setOperation] = useState("verify");
  const resolvedGateId = typeof gateId === "string" ? gateId.trim() : "";
  const client = useMemo(
    () => new NeusClient({ apiUrl, appId: resolvedGateId ? void 0 : appId, billingWallet: resolvedGateId ? void 0 : billingWallet, paymentSignature, extraHeaders }),
    [apiUrl, appId, billingWallet, paymentSignature, extraHeaders, resolvedGateId]
  );
  const verifierList = useMemo(() => {
    if (resolvedGateId) return [];
    return Array.isArray(requiredVerifiers) && requiredVerifiers.length > 0 ? requiredVerifiers : ["ownership-basic"];
  }, [requiredVerifiers, resolvedGateId]);
  const primaryVerifier = verifierList[0];
  const qHash = qHashProp || null;
  const resolvedQHash = qHash;
  const resolvedHostedCheckoutUrl = useMemo(() => {
    if (typeof hostedCheckoutUrl === "string" && hostedCheckoutUrl.trim()) {
      return hostedCheckoutUrl.trim();
    }
    if (typeof apiUrl === "string" && apiUrl.trim()) {
      try {
        return new URL("/verify", apiUrl.trim()).toString();
      } catch (_err) {
        return DEFAULT_HOSTED_CHECKOUT_URL;
      }
    }
    return DEFAULT_HOSTED_CHECKOUT_URL;
  }, [apiUrl, hostedCheckoutUrl]);
  const shouldCheckExisting = !resolvedGateId && checkExisting && strategy !== "fresh";
  const inferChainFromAddress = useCallback((address) => {
    const raw = String(address || "").trim();
    if (!raw) return void 0;
    if (/^0x[a-fA-F0-9]{40}$/.test(raw)) return void 0;
    if (typeof chain === "string" && chain.includes(":")) return chain.trim();
    return "solana:mainnet";
  }, [chain]);
  const buildGateRequirements = useCallback(() => {
    return verifierList.map((verifierId) => ({ verifierId }));
  }, [verifierList]);
  const applySatisfiedGateResult = useCallback((gateResult, address) => {
    if (!gateResult?.satisfied) return false;
    setNotice(null);
    setError(null);
    setState("verified");
    setExistingProofs(gateResult);
    const existingProof = gateResult.existing?.[primaryVerifier];
    if (existingProof && onVerified) {
      const existingQHash = existingProof.qHash || null;
      onVerified({
        qHash: existingQHash,
        address: existingProof.walletAddress || address,
        verifierIds: verifierList,
        verifiedVerifiers: existingProof.verifiedVerifiers || [],
        existing: true,
        proofsByVerifierId: gateResult.existing || {},
        proofUrl: existingQHash ? `${apiUrl || "https://api.neus.network"}/api/v1/proofs/${existingQHash}` : null
      });
    }
    return true;
  }, [apiUrl, onVerified, primaryVerifier, verifierList]);
  const getOrRequestWalletAddress = useCallback(async () => {
    const provider = wallet || (typeof window !== "undefined" ? window.ethereum : null);
    if (!provider) {
      throw new Error("No wallet provider available");
    }
    if (provider.publicKey && typeof provider.publicKey.toBase58 === "function") {
      const pk = provider.publicKey.toBase58();
      if (pk) return pk;
    }
    if (typeof provider.getAddress === "function") {
      const addr = await provider.getAddress().catch(() => null);
      if (addr) return addr;
    }
    if (typeof provider.address === "string" && provider.address) {
      return provider.address;
    }
    if (typeof provider.request !== "function") {
      throw new Error("Connect a wallet and try again.");
    }
    let accounts = await provider.request({ method: "eth_accounts" });
    if (!accounts || accounts.length === 0) {
      await provider.request({ method: "eth_requestAccounts" });
      accounts = await provider.request({ method: "eth_accounts" });
    }
    if (!accounts || accounts.length === 0) {
      throw new Error("Connect a wallet and try again.");
    }
    return accounts[0];
  }, [wallet]);
  const tryPrivateReuse = useCallback(async (address) => {
    setOperation("reuse");
    setState("signing");
    const provider = wallet || (typeof window !== "undefined" ? window.ethereum : null);
    const requirements = buildGateRequirements();
    const resolvedChain = inferChainFromAddress(address);
    const resolvedSignatureMethod = typeof signatureMethod === "string" && signatureMethod.trim() ? signatureMethod.trim() : resolvedChain && !resolvedChain.startsWith("eip155:") ? "ed25519" : void 0;
    const privateAuth = provider ? await client.createGatePrivateAuth({
      address,
      wallet: provider,
      ...resolvedChain ? { chain: resolvedChain } : {},
      ...resolvedSignatureMethod ? { signatureMethod: resolvedSignatureMethod } : {}
    }) : null;
    const gateResults = await Promise.all(
      requirements.map(async (requirement) => {
        const verifierId = requirement?.verifierId;
        if (!verifierId) {
          return { verifierId: null, eligible: false, qHash: null };
        }
        const maxAgeMs = requirement?.maxAgeMs;
        const gateParams = {
          address,
          verifierIds: [verifierId],
          includePrivate: true,
          includeQHashes: true,
          ...privateAuth ? { privateAuth } : { wallet: provider },
          ...resolvedChain ? { chain: resolvedChain } : {},
          ...resolvedSignatureMethod ? { signatureMethod: resolvedSignatureMethod } : {}
        };
        if (typeof maxAgeMs === "number" && maxAgeMs > 0) {
          gateParams.since = Date.now() - maxAgeMs;
        }
        const apiResult = await client.gateCheck(gateParams);
        const data = apiResult?.data || {};
        const matchedQHashes = Array.isArray(data.matchedQHashes) ? data.matchedQHashes : Array.isArray(data.matchedProofIds) ? data.matchedProofIds : [];
        return {
          verifierId,
          eligible: data.eligible === true,
          qHash: matchedQHashes[0] || null
        };
      })
    );
    const existing = {};
    const missing = [];
    for (const result of gateResults) {
      if (!result.verifierId) continue;
      if (!result.eligible) {
        missing.push({ verifierId: result.verifierId });
        continue;
      }
      if (result.qHash) {
        existing[result.verifierId] = {
          qHash: result.qHash,
          walletAddress: address,
          verifiedVerifiers: [{ verifierId: result.verifierId, verified: true }]
        };
      }
    }
    const adaptedGateResult = {
      satisfied: missing.length === 0,
      missing,
      existing,
      allProofs: []
    };
    setExistingProofs(adaptedGateResult);
    return adaptedGateResult;
  }, [client, buildGateRequirements, wallet, inferChainFromAddress, signatureMethod]);
  const launchHostedCheckout = useCallback(async () => {
    if (typeof window === "undefined") {
      throw new Error("Open this in a browser to verify.");
    }
    const origin = window.location.origin;
    const returnUrl = window.location.href;
    const checkoutUrl = buildHostedCheckoutUrl({
      hostedCheckoutUrl: resolvedHostedCheckoutUrl,
      verifierList,
      returnUrl,
      origin,
      oauthProvider,
      campaignTitle,
      campaignMessage,
      gateId: resolvedGateId || void 0,
      appId: resolvedGateId ? void 0 : appId,
      billingWallet: resolvedGateId ? void 0 : billingWallet
    });
    let expectedOrigin = null;
    try {
      expectedOrigin = new URL(resolvedHostedCheckoutUrl).origin;
    } catch (_err) {
      expectedOrigin = null;
    }
    return new Promise((resolve, reject) => {
      const url = checkoutUrl;
      const popup = window.open(
        url,
        "neus_checkout",
        "width=600,height=700,scrollbars=yes,resizable=yes"
      );
      if (!popup) {
        window.location.assign(buildHostedCheckoutRedirectUrl(url));
        return;
      }
      let completed = false;
      const timeoutId = window.setTimeout(() => {
        cleanup();
        reject(new Error("Hosted checkout timed out. Please try again."));
      }, 10 * 60 * 1e3);
      const pollId = window.setInterval(() => {
        if (!popup.closed) return;
        if (!completed) {
          cleanup();
          reject(new Error("Hosted checkout was closed before completion."));
        }
      }, 500);
      const cleanup = () => {
        window.removeEventListener("message", onMessage);
        window.clearTimeout(timeoutId);
        window.clearInterval(pollId);
        try {
          if (!popup.closed) popup.close();
        } catch (_err) {
        }
      };
      const onMessage = (event) => {
        if (!expectedOrigin || event.origin !== expectedOrigin) return;
        const payload = event?.data;
        if (!payload || payload.type !== HOSTED_CHECKOUT_MESSAGE_TYPE) return;
        completed = true;
        cleanup();
        if (payload?.eligible === false) {
          reject(new Error("Verification could not be completed."));
          return;
        }
        resolve(payload);
      };
      window.addEventListener("message", onMessage);
    });
  }, [resolvedHostedCheckoutUrl, verifierList, oauthProvider, campaignTitle, campaignMessage, appId, billingWallet, resolvedGateId]);
  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);
  useEffect(() => {
    if (!shouldCheckExisting || mode === "access") return;
    const checkExistingProofs = async () => {
      try {
        const provider2 = wallet || (typeof window !== "undefined" ? window.ethereum : null);
        if (!provider2 || typeof provider2.request !== "function") return;
        const accounts = await provider2.request({ method: "eth_accounts" });
        if (!accounts || accounts.length === 0) return;
        const address = accounts[0];
        setWalletAddress(address);
        const gateResult = await client.checkGate({
          walletAddress: address,
          requirements: buildGateRequirements()
        });
        setExistingProofs(gateResult);
        applySatisfiedGateResult(gateResult, address);
      } catch (_err) {
      }
    };
    checkExistingProofs();
    const provider = wallet || (typeof window !== "undefined" ? window.ethereum : null);
    if (provider && typeof provider.on === "function" && typeof provider.removeListener === "function") {
      const handleAccountsChanged = () => {
        setWalletAddress(null);
        setExistingProofs(null);
        if (state === "verified") setState("idle");
        checkExistingProofs();
      };
      provider.on("accountsChanged", handleAccountsChanged);
      return () => provider.removeListener("accountsChanged", handleAccountsChanged);
    }
  }, [shouldCheckExisting, mode, client, buildGateRequirements, applySatisfiedGateResult, state, wallet]);
  const handleClick = useCallback(async () => {
    if (disabled || isProcessing) return;
    if (state === "verified" && existingProofs?.satisfied) {
      return;
    }
    setError(null);
    setNotice(null);
    if (shouldCheckExisting && walletAddress) {
      try {
        const gateResult = await client.checkGate({
          walletAddress,
          requirements: buildGateRequirements()
        });
        if (applySatisfiedGateResult(gateResult, walletAddress)) return;
      } catch (_err) {
      }
    }
    try {
      if (mode === "access") {
        setOperation("access");
        setIsProcessing(true);
        setState("signing");
        if (!resolvedQHash) {
          throw new Error("qHash is required for access mode");
        }
        setState("verifying");
        const privateData = await client.getPrivateProof(
          resolvedQHash,
          wallet || (typeof window !== "undefined" ? window.ethereum : null)
        );
        setState("verified");
        onVerified?.({
          qHash: resolvedQHash,
          data: privateData.data,
          mode: "access",
          proofUrl: privateData.proofUrl
        });
      } else if (strategy === "reuse") {
        setOperation("reuse");
        if (!allowPrivateReuse) {
          setNotice("No existing proof was found.");
          return;
        }
        setIsProcessing(true);
        const address = walletAddress || await getOrRequestWalletAddress();
        setWalletAddress(address);
        const gateResult = await tryPrivateReuse(address);
        if (applySatisfiedGateResult(gateResult, address)) return;
        setState("idle");
        setNotice("No matching proof was found. Create a proof to continue.");
      } else {
        setOperation("verify");
        setIsProcessing(true);
        setState("interactive-checkout");
        onStateChange?.("interactive-checkout");
        const checkoutResult = await launchHostedCheckout();
        const checkoutQHash = checkoutResult?.qHash || null;
        const handoffWallet = typeof checkoutResult?.walletAddress === "string" && checkoutResult.walletAddress.trim() || walletAddress && String(walletAddress).trim() || "";
        setState("verified");
        dispatchNeusProofCreatedForHost({
          qHash: checkoutQHash,
          walletAddress: handoffWallet
        });
        onVerified?.({
          qHash: checkoutQHash,
          verifierIds: verifierList,
          existing: false,
          mode: "create",
          eligible: checkoutResult?.eligible !== false,
          proofUrl: checkoutResult?.proofUrl || (checkoutQHash ? `${apiUrl || "https://api.neus.network"}/api/v1/proofs/${checkoutQHash}` : null)
        });
      }
    } catch (err) {
      const userMsg = getVerifyGateUserError(err);
      const fallback = mode === "access" ? "Access failed" : VERIFY_GATE_DEFAULT_ERROR;
      setError(userMsg !== null ? userMsg : fallback);
      setState("error");
      onError?.(err);
    } finally {
      setIsProcessing(false);
    }
  }, [
    disabled,
    isProcessing,
    mode,
    resolvedQHash,
    verifierList,
    client,
    apiUrl,
    launchHostedCheckout,
    onVerified,
    onError,
    onStateChange,
    shouldCheckExisting,
    walletAddress,
    existingProofs,
    strategy,
    allowPrivateReuse,
    buildGateRequirements,
    applySatisfiedGateResult,
    getOrRequestWalletAddress,
    tryPrivateReuse,
    state,
    wallet
  ]);
  const handleReuseExisting = useCallback(async () => {
    if (disabled || isProcessing) return;
    if (mode === "access") return;
    if (!allowPrivateReuse) return;
    setError(null);
    setNotice(null);
    try {
      setIsProcessing(true);
      const address = walletAddress || await getOrRequestWalletAddress();
      setWalletAddress(address);
      const gateResult = await tryPrivateReuse(address);
      if (applySatisfiedGateResult(gateResult, address)) return;
      setState("idle");
      setNotice("No matching proof was found. Verify to create a proof.");
    } catch (err) {
      const userMsg = getVerifyGateUserError(err);
      setError(userMsg !== null ? userMsg : "Unable to access private proofs");
      setState("error");
      onError?.(err);
    } finally {
      setIsProcessing(false);
    }
  }, [
    disabled,
    isProcessing,
    mode,
    allowPrivateReuse,
    walletAddress,
    getOrRequestWalletAddress,
    tryPrivateReuse,
    applySatisfiedGateResult,
    onError
  ]);
  const primaryCtaClass = state === "idle" || state === "interactive-checkout" ? "neus-vg__primary" : "";
  const getLabel = () => {
    if (buttonText && state === "idle") return buttonText;
    if (mode === "access") {
      return {
        idle: "Sign to view",
        signing: "Waiting for signature...",
        verifying: "Accessing...",
        verified: "Access granted",
        error: "Retry"
      }[state];
    }
    if (strategy === "reuse") {
      return {
        idle: "Check proofs",
        signing: "Waiting for signature...",
        verifying: "Checking...",
        verified: "Verified",
        error: "Retry"
      }[state];
    }
    return {
      idle: "Verify with NEUS",
      signing: "Waiting for signature...",
      verifying: operation === "reuse" ? "Checking..." : "Verifying...",
      verified: "Verified",
      error: "Retry"
    }[state];
  };
  const buttonBaseStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    fontWeight: 500,
    fontSize: "14px",
    cursor: disabled || isProcessing ? "not-allowed" : "pointer",
    transition: "all 0.2s ease",
    opacity: disabled || isProcessing ? 0.6 : 1,
    fontFamily: "inherit"
  };
  const getButtonStyle = () => {
    if (state === "verified") {
      return {
        ...buttonBaseStyle,
        background: "var(--neus-verified-bg, rgba(152, 192, 239, 0.12))",
        color: THEME.success,
        border: "1px solid var(--neus-verified-border, rgba(61, 114, 201, 0.28))"
      };
    }
    if (state === "error") {
      return {
        ...buttonBaseStyle,
        background: "rgba(239, 68, 68, 0.15)",
        color: THEME.error,
        border: "1px solid rgba(239, 68, 68, 0.3)"
      };
    }
    if (state === "signing" || state === "verifying") {
      return {
        ...buttonBaseStyle,
        background: "rgba(61, 114, 201, 0.15)",
        color: "var(--neus-accent, #98C0EF)",
        border: "1px solid rgba(61, 114, 201, 0.3)"
      };
    }
    return {
      ...buttonBaseStyle,
      background: THEME.primary,
      color: THEME.onAccent,
      border: "none",
      boxShadow: "0 10px 26px rgba(0, 0, 0, 0.34)"
    };
  };
  if (children) {
    if (state === "verified") {
      return /* @__PURE__ */ jsx(Fragment, { children });
    }
    return /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", padding: "20px", ...style }, children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: handleClick,
          disabled: disabled || isProcessing,
          className: primaryCtaClass,
          style: getButtonStyle(),
          children: [
            (state === "signing" || state === "verifying" || state === "interactive-checkout") && /* @__PURE__ */ jsx(VerifyGateInlineSpinner, { size: 16 }),
            showBrand && state === "idle" && /* @__PURE__ */ jsx(NeusLogo, { size: 16 }),
            state === "verified" && /* @__PURE__ */ jsx("svg", { width: "16", height: "16", viewBox: "0 0 20 20", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }),
            /* @__PURE__ */ jsx("span", { className: "neus-vg__label", style: { color: "inherit" }, children: getLabel() })
          ]
        }
      ),
      notice && /* @__PURE__ */ jsx("div", { style: {
        color: THEME.textSecondary,
        marginTop: "10px",
        fontSize: "13px",
        padding: "8px 12px",
        background: "rgba(148, 163, 184, 0.08)",
        borderRadius: "6px",
        border: "1px solid rgba(148, 163, 184, 0.14)"
      }, children: notice }),
      mode !== "access" && allowPrivateReuse && shouldCheckExisting && strategy !== "reuse" && state === "idle" && /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: handleReuseExisting,
          disabled: disabled || isProcessing,
          style: {
            marginTop: notice ? "10px" : "12px",
            background: "transparent",
            border: "none",
            padding: 0,
            color: THEME.textSecondary,
            fontSize: "12px",
            cursor: disabled || isProcessing ? "not-allowed" : "pointer",
            textDecoration: "underline",
            textUnderlineOffset: "2px",
            opacity: disabled || isProcessing ? 0.6 : 0.9
          },
          children: "Already verified? Reuse your proof."
        }
      ),
      error && /* @__PURE__ */ jsx("div", { style: {
        color: THEME.error,
        marginTop: "8px",
        fontSize: "13px",
        padding: "8px 12px",
        background: "rgba(239, 68, 68, 0.1)",
        borderRadius: "6px",
        border: "1px solid rgba(239, 68, 68, 0.2)"
      }, children: error })
    ] });
  }
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      onClick: handleClick,
      className: primaryCtaClass,
      style: { ...getButtonStyle(), ...style },
      disabled: disabled || isProcessing,
      children: [
        (state === "signing" || state === "verifying" || state === "interactive-checkout") && /* @__PURE__ */ jsx(VerifyGateInlineSpinner, { size: 16 }),
        showBrand && state === "idle" && /* @__PURE__ */ jsx(NeusLogo, { size: 16 }),
        state === "verified" && /* @__PURE__ */ jsx("svg", { width: "16", height: "16", viewBox: "0 0 20 20", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }),
        /* @__PURE__ */ jsx("span", { className: "neus-vg__label", style: { color: "inherit" }, children: getLabel() }),
        error && /* @__PURE__ */ jsxs("span", { style: { opacity: 0.8, marginLeft: "8px" }, children: [
          ": ",
          error
        ] })
      ]
    }
  );
}
export {
  VerifyGate
};

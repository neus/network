"use client";

// widgets/verify-gate/ProofBadge.jsx
import { useEffect, useState } from "react";

// brand-mark.js
var NEUS_BRAND_PACK_VERSION = "2026-06-07-app-icon-raster-v1";
var NEUS_MARK_CDN_ORIGIN = "https://neus.network";
var PACK_BASE = `${NEUS_MARK_CDN_ORIGIN}/images/neus-brand-pack`;
var v = encodeURIComponent(NEUS_BRAND_PACK_VERSION);
function withBrandPackVersion(file) {
  const name = file.replace(/^\//, "");
  return `${PACK_BASE}/${name}?v=${v}`;
}
var NEUS_DEFAULT_MARK_URL = withBrandPackVersion("favicon.svg");
var NEUS_DEFAULT_OG_IMAGE_URL = withBrandPackVersion("og-default-1200x630-neus.png");

// widgets/verify-gate/ProofBadge.jsx
import { jsx, jsxs } from "react/jsx-runtime";
var DEFAULT_API_BASE = "https://api.neus.network";
var NeusLogo = ({ size = 12, logoUrl }) => /* @__PURE__ */ jsx(
  "img",
  {
    src: logoUrl ?? NEUS_DEFAULT_MARK_URL,
    alt: "",
    "aria-hidden": "true",
    width: size,
    height: size,
    style: {
      width: size,
      height: size,
      display: "block",
      borderRadius: 2,
      flexShrink: 0,
      objectFit: "contain",
      background: "transparent"
    }
  }
);
function ProofBadge({
  qHash,
  proofUrlPattern = "/proof/:qHash",
  size = "sm",
  uiLinkBase = "https://neus.network",
  apiUrl = DEFAULT_API_BASE,
  proof = void 0,
  showChains = false,
  showLabel = true,
  logoUrl = void 0,
  onClick = void 0,
  className = ""
}) {
  const resolvedQHash = qHash;
  const [status, setStatus] = useState(() => {
    if (proof) {
      const proofStatus = proof.status || "";
      return proofStatus.includes("verified") ? "verified" : proofStatus.includes("pending") || proofStatus.includes("processing") ? "pending" : "failed";
    }
    return resolvedQHash ? "pending" : "unknown";
  });
  const [chainCount, setChainCount] = useState(() => {
    if (proof?.crosschain) {
      const total = proof.crosschain.totalChains || 0;
      const relayResults = proof.crosschain.relayResults || {};
      return total > 0 ? total : Object.keys(relayResults).length + (proof.crosschain.hubTxHash ? 1 : 0);
    }
    return 0;
  });
  useEffect(() => {
    if (!resolvedQHash || proof) return;
    let cancelled = false;
    async function checkStatus() {
      try {
        const res = await fetch(`${apiUrl}/api/v1/proofs/${resolvedQHash}`, {
          headers: { Accept: "application/json" }
        });
        if (!res.ok) {
          if (!cancelled) setStatus("failed");
          return;
        }
        const json = await res.json();
        if (cancelled) return;
        const proofStatus = json?.data?.status || "";
        const isVerified = proofStatus.toLowerCase().includes("verified");
        const isPending = proofStatus.toLowerCase().includes("processing") || proofStatus.toLowerCase().includes("pending");
        setStatus(isVerified ? "verified" : isPending ? "pending" : "failed");
        if (showChains && json?.data?.crosschain) {
          const cc = json.data.crosschain;
          const total = cc.totalChains || 0;
          const relayResults = cc.relayResults || {};
          const count = total > 0 ? total : Object.keys(relayResults).length + (cc.hubTxHash ? 1 : 0);
          setChainCount(count);
        }
      } catch (_) {
        if (!cancelled) setStatus("failed");
      }
    }
    checkStatus();
    return () => {
      cancelled = true;
    };
  }, [resolvedQHash, proof, apiUrl, showChains]);
  const base = String(uiLinkBase).replace(/\/$/, "");
  const href = resolvedQHash ? `${base}${String(proofUrlPattern).replace(":qHash", resolvedQHash)}` : base;
  const isSm = size === "sm";
  const logoSize = isSm ? 12 : 14;
  const fontSize = isSm ? 10 : 11;
  const gap = isSm ? 4 : 5;
  const padY = isSm ? 2 : 3;
  const padX = isSm ? 6 : 8;
  const label = status === "verified" ? "Verified" : status === "pending" ? "Pending" : status === "unknown" ? "Unknown" : "Unverified";
  const style = {
    display: "inline-flex",
    alignItems: "center",
    gap,
    textDecoration: "none",
    padding: `${padY}px ${padX}px`,
    borderRadius: 9999,
    border: "1px solid var(--neus-badge-border, rgba(148, 163, 184, 0.2))",
    background: "var(--neus-badge-bg, rgba(148, 163, 184, 0.06))",
    color: "var(--neus-badge-text, #94a3b8)",
    fontFamily: "var(--neus-badge-font, inherit)",
    fontWeight: 500,
    fontSize,
    whiteSpace: "nowrap",
    lineHeight: 1,
    cursor: "pointer",
    transition: "opacity 0.15s ease"
  };
  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick({ qHash: resolvedQHash, status, chainCount });
    }
  };
  const title = showChains && chainCount > 0 ? `${label} on ${chainCount} chain${chainCount === 1 ? "" : "s"}` : label;
  return /* @__PURE__ */ jsxs(
    "a",
    {
      href,
      target: "_blank",
      rel: "noreferrer",
      style,
      className,
      "aria-label": title,
      title,
      onClick: handleClick,
      children: [
        /* @__PURE__ */ jsx(NeusLogo, { size: logoSize, logoUrl }),
        showLabel && /* @__PURE__ */ jsx("span", { children: label }),
        showChains && chainCount > 0 && /* @__PURE__ */ jsxs("span", { style: { opacity: 0.7, fontSize: fontSize - 1 }, children: [
          "\xB7 ",
          chainCount
        ] })
      ]
    }
  );
}
function SimpleProofBadge({
  qHash,
  proofUrlPattern = "/proof/:qHash",
  uiLinkBase = "https://neus.network",
  apiUrl = DEFAULT_API_BASE,
  size = "sm",
  label = "Verified",
  logoUrl = void 0,
  proof = void 0,
  onClick = void 0,
  className = ""
}) {
  const resolvedQHash = qHash;
  const [status, setStatus] = useState(() => {
    if (proof) {
      const proofStatus = proof.status || "";
      return proofStatus.includes("verified") ? "verified" : "failed";
    }
    return resolvedQHash ? "pending" : "unknown";
  });
  useEffect(() => {
    if (!resolvedQHash || proof) return;
    let cancelled = false;
    async function checkStatus() {
      try {
        const res = await fetch(`${apiUrl}/api/v1/proofs/${resolvedQHash}`, {
          headers: { Accept: "application/json" }
        });
        if (!res.ok) {
          if (!cancelled) setStatus("failed");
          return;
        }
        const json = await res.json();
        if (cancelled) return;
        const isVerified = json?.success === true || json?.data?.status?.toLowerCase()?.includes("verified");
        setStatus(isVerified ? "verified" : "failed");
      } catch (_) {
        if (!cancelled) setStatus("failed");
      }
    }
    checkStatus();
    return () => {
      cancelled = true;
    };
  }, [resolvedQHash, proof, apiUrl]);
  const base = String(uiLinkBase).replace(/\/$/, "");
  const href = resolvedQHash ? `${base}${String(proofUrlPattern).replace(":qHash", resolvedQHash)}` : base;
  const isSm = size === "sm";
  const logoSize = isSm ? 12 : 14;
  const fontSize = isSm ? 10 : 11;
  const style = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    textDecoration: "none",
    padding: "2px 6px",
    borderRadius: 9999,
    border: "1px solid var(--neus-badge-border, rgba(148, 163, 184, 0.2))",
    background: "var(--neus-badge-bg, transparent)",
    color: "var(--neus-badge-text, #94a3b8)",
    fontFamily: "var(--neus-badge-font, inherit)",
    fontWeight: 500,
    fontSize,
    whiteSpace: "nowrap",
    lineHeight: 1,
    cursor: "pointer",
    transition: "opacity 0.15s ease"
  };
  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick({ qHash: resolvedQHash, status });
    }
  };
  const displayLabel = status === "verified" ? label : status === "pending" ? "Pending" : status === "unknown" ? "Unknown" : "Unverified";
  return /* @__PURE__ */ jsxs(
    "a",
    {
      href,
      target: "_blank",
      rel: "noreferrer",
      style,
      className,
      "aria-label": displayLabel,
      title: displayLabel,
      onClick: handleClick,
      children: [
        /* @__PURE__ */ jsx(NeusLogo, { size: logoSize, logoUrl }),
        /* @__PURE__ */ jsx("span", { children: displayLabel })
      ]
    }
  );
}
function NeusPillLink({
  qHash,
  proofUrlPattern = "/proof/:qHash",
  uiLinkBase = "https://neus.network",
  label = "View",
  size = "sm",
  logoUrl = void 0,
  onClick = void 0,
  className = ""
}) {
  const resolvedQHash = qHash;
  const base = String(uiLinkBase).replace(/\/$/, "");
  const href = resolvedQHash ? `${base}${String(proofUrlPattern).replace(":qHash", resolvedQHash)}` : base;
  const isSm = size === "sm";
  const logoSize = isSm ? 12 : 14;
  const fontSize = isSm ? 10 : 11;
  const style = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    textDecoration: "none",
    padding: "2px 6px",
    borderRadius: 9999,
    border: "1px solid var(--neus-badge-border, rgba(148, 163, 184, 0.2))",
    background: "var(--neus-badge-bg, transparent)",
    color: "var(--neus-badge-text, #94a3b8)",
    fontFamily: "var(--neus-badge-font, inherit)",
    fontWeight: 500,
    fontSize,
    whiteSpace: "nowrap",
    lineHeight: 1,
    cursor: "pointer",
    transition: "opacity 0.15s ease"
  };
  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick({ qHash: resolvedQHash });
    }
  };
  return /* @__PURE__ */ jsxs(
    "a",
    {
      href,
      target: "_blank",
      rel: "noreferrer",
      style,
      className,
      "aria-label": label,
      title: label,
      onClick: handleClick,
      children: [
        /* @__PURE__ */ jsx(NeusLogo, { size: logoSize, logoUrl }),
        /* @__PURE__ */ jsx("span", { children: label })
      ]
    }
  );
}
function VerifiedIcon({
  qHash,
  proofUrlPattern = "/proof/:qHash",
  uiLinkBase = "https://neus.network",
  size = 14,
  logoUrl = void 0,
  tooltip = "Proof",
  onClick = void 0,
  className = ""
}) {
  const resolvedQHash = qHash;
  const href = resolvedQHash ? `${String(uiLinkBase).replace(/\/$/, "")}${String(proofUrlPattern).replace(":qHash", resolvedQHash)}` : void 0;
  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick({ qHash: resolvedQHash });
    }
  };
  const icon = /* @__PURE__ */ jsx(
    "span",
    {
      title: tooltip,
      className,
      style: {
        display: "inline-flex",
        cursor: href || onClick ? "pointer" : "default",
        opacity: 0.85,
        transition: "opacity 0.15s ease"
      },
      children: /* @__PURE__ */ jsx(NeusLogo, { size, logoUrl })
    }
  );
  if (href) {
    return /* @__PURE__ */ jsx(
      "a",
      {
        href,
        target: "_blank",
        rel: "noreferrer",
        onClick: handleClick,
        style: { display: "inline-flex", textDecoration: "none" },
        "aria-label": tooltip,
        children: icon
      }
    );
  }
  return icon;
}
export {
  NeusPillLink,
  ProofBadge,
  SimpleProofBadge,
  VerifiedIcon
};

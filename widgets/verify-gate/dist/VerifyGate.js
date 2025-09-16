"use client";

// verify-gate/VerifyGate.jsx
import React, { useCallback, useMemo, useState } from "react";
import { NeusClient } from "@neus/sdk";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var BRAND_CID = "bafkreiefbrffecrifnzcn3hfksklw3vospkf244c5ijkizxtzbsm2vtnga";
var BRAND_IPFS_GATEWAYS = [
  "https://ipfs.neus.network/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://ipfs.io/ipfs/"
];
var NeusLogo = ({ size = 14 }) => {
  const [gatewayIndex, setGatewayIndex] = useState(0);
  const src = `${BRAND_IPFS_GATEWAYS[gatewayIndex]}${BRAND_CID}`;
  return /* @__PURE__ */ jsx(
    "img",
    {
      src,
      alt: "NEUS",
      width: size,
      height: size,
      loading: "eager",
      decoding: "async",
      referrerPolicy: "no-referrer",
      onError: () => setGatewayIndex((i) => (i + 1) % BRAND_IPFS_GATEWAYS.length),
      style: { height: size, width: size, marginRight: 8, verticalAlign: "middle" }
    }
  );
};
function VerifyGate({
  requiredVerifiers = ["ownership-basic"],
  // Array of verifier IDs
  onVerified,
  apiUrl,
  style,
  children,
  // Advanced options for power users
  verifierOptions,
  verifierData,
  showBrand = true,
  disabled = false,
  // Private proof access mode
  mode = "create",
  // 'create' or 'access'
  qHash = null
  // Required when mode='access'
}) {
  const [state, setState] = useState("idle");
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const client = useMemo(() => new NeusClient({ apiUrl }), [apiUrl]);
  const verifierList = useMemo(() => {
    return Array.isArray(requiredVerifiers) && requiredVerifiers.length > 0 ? requiredVerifiers : ["ownership-basic"];
  }, [requiredVerifiers]);
  const primaryVerifier = verifierList[0];
  const handleClick = useCallback(async () => {
    if (disabled || isProcessing)
      return;
    setError(null);
    setIsProcessing(true);
    setState("signing");
    try {
      if (mode === "access") {
        if (!qHash) {
          throw new Error("qHash is required for access mode");
        }
        setState("verifying");
        const privateData = await client.getPrivateStatus(qHash);
        setState("verified");
        onVerified?.({
          qHash,
          data: privateData.data,
          mode: "access",
          statusUrl: privateData.statusUrl
        });
      } else {
        setState("verifying");
        let verificationData;
        if (verifierList.length === 1) {
          const explicit = verifierData && verifierData[primaryVerifier];
          if (explicit && typeof explicit === "object") {
            verificationData = explicit;
          } else if (primaryVerifier === "ownership-basic") {
            verificationData = { content: `NEUS verification with ${primaryVerifier}` };
          } else {
            verificationData = verifierOptions || {};
          }
        } else {
          verificationData = {};
          verifierList.forEach((verifierId) => {
            const explicit = verifierData && verifierData[verifierId];
            if (explicit && typeof explicit === "object") {
              verificationData[verifierId] = explicit;
            } else if (verifierId === "ownership-basic") {
              verificationData[verifierId] = { content: `NEUS verification with ${verifierId}` };
            } else {
              verificationData[verifierId] = verifierOptions || {};
            }
          });
        }
        const res = await client.verify({
          verifierIds: verifierList,
          data: verificationData,
          options: {
            privacyLevel: "private",
            // Secure by default
            publicDisplay: false,
            storeOriginalContent: false,
            ...verifierOptions && { verifierOptions }
          }
        });
        const final = await client.pollProofStatus(res.qHash || res?.data?.qHash, {
          interval: 3e3,
          timeout: 6e4
        });
        setState("verified");
        const hubTx = final?.data?.hubTransaction || {};
        const crosschain = final?.data?.crosschain || {};
        const txHash = hubTx?.txHash || crosschain?.hubTxHash || null;
        const verifiedVerifiers = final?.data?.verifiedVerifiers || [];
        const allVerified = verifierList.every(
          (verifierId) => verifiedVerifiers.find((v) => v.verifierId === verifierId)?.verified === true
        );
        if (allVerified) {
          onVerified?.({
            qHash: final.qHash,
            address: final?.data?.walletAddress,
            txHash,
            verifierIds: verifierList,
            verifiedVerifiers,
            statusUrl: final?.statusUrl
          });
        } else {
          throw new Error("Not all required verifiers passed");
        }
      }
    } catch (error2) {
      setError(error2?.message || (mode === "access" ? "Access failed" : "Verification failed"));
      setState("error");
    } finally {
      setIsProcessing(false);
    }
  }, [disabled, isProcessing, mode, qHash, verifierList, client, verifierOptions, verifierData, onVerified, primaryVerifier]);
  const labels = mode === "access" ? {
    idle: "Sign to view",
    signing: "Waiting for signature...",
    verifying: "Accessing...",
    verified: "Access granted \u2713",
    error: "Retry"
  } : {
    idle: "Verify with NEUS",
    signing: "Waiting for signature...",
    verifying: "Verifying...",
    verified: "Verified \u2713",
    error: "Retry"
  };
  if (children) {
    if (state === "verified") {
      return /* @__PURE__ */ jsx(Fragment, { children });
    }
    return /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", padding: "20px", ...style }, children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: handleClick,
          disabled: disabled || isProcessing,
          style: {
            padding: "12px 24px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            background: state === "verified" ? "#4caf50" : "#fff",
            color: state === "verified" ? "#fff" : "#333",
            cursor: disabled || isProcessing ? "not-allowed" : "pointer"
          },
          children: [
            showBrand && /* @__PURE__ */ jsx(NeusLogo, { size: 14 }),
            /* @__PURE__ */ jsx("span", { children: labels[state] })
          ]
        }
      ),
      error && /* @__PURE__ */ jsx("div", { style: { color: "red", marginTop: "8px", fontSize: "14px" }, children: error })
    ] });
  }
  return /* @__PURE__ */ jsxs(
    "button",
    {
      onClick: handleClick,
      style,
      disabled: disabled || isProcessing,
      children: [
        showBrand && /* @__PURE__ */ jsx(NeusLogo, { size: 14 }),
        /* @__PURE__ */ jsx("span", { children: labels[state] }),
        error && ` \u2014 ${error}`
      ]
    }
  );
}
export {
  VerifyGate
};
//# sourceMappingURL=VerifyGate.js.map

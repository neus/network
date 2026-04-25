import React from 'react';
import {
  Fingerprint,
  AtSign,
  Globe,
  Building2,
  Coins,
  Image as ImageIcon,
  FileKey,
  Shield,
  FileCheck2,
  Bot,
  Waypoints,
  FileText,
  Zap
} from 'lucide-react';

const BY_VERIFIER = {
  'ownership-basic': FileText,
  'proof-of-human': Fingerprint,
  'ownership-social': AtSign,
  'ownership-dns-txt': Globe,
  'ownership-org-oauth': Building2,
  'token-holding': Coins,
  'nft-ownership': ImageIcon,
  'contract-ownership': FileKey,
  'wallet-risk': Shield,
  'ai-content-moderation': FileCheck2,
  'agent-identity': Bot,
  'agent-delegation': Waypoints
};

export function ClaimCardIcon({ verifierId, className = 'text-primary', size = 22, label }) {
  const Icon = BY_VERIFIER[verifierId] || Zap;
  return <Icon className={className} size={size} strokeWidth={1.75} aria-hidden="true" title={label} />;
}

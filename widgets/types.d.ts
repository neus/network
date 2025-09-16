/**
 * NEUS Widgets TypeScript Definitions
 */

declare module '@neus/widgets' {
  import React, { ReactNode } from 'react';

  export interface VerifyGateProps {
    requiredVerifiers?: string[];
    onVerified?: (result: { 
      qHash: string; 
      address?: string; 
      txHash?: string; 
      verifierIds: string[]; 
      verifiedVerifiers?: any[]; 
      statusUrl?: string | null;
      mode?: string;
      data?: any;
    }) => void;
    apiUrl?: string;
    style?: Record<string, any>;
    children?: ReactNode;
    verifierOptions?: Record<string, any>;
    verifierData?: Record<string, any>;
    showBrand?: boolean;
    disabled?: boolean;
    mode?: 'create' | 'access';
    qHash?: string | null;
  }

  export function VerifyGate(props: VerifyGateProps): React.ReactElement;

  export interface ProofBadgeProps {
    qHash: string;
    size?: 'sm' | 'md';
    uiLinkBase?: string;
    showDot?: boolean;
    labelOverride?: string;
    proof?: { status?: string };
  }

  export function ProofBadge(props: ProofBadgeProps): React.ReactElement;

  export interface NeusPillLinkProps {
    qHash?: string;
    uiLinkBase?: string;
    label?: string;
    size?: 'sm' | 'md';
  }

  export function NeusPillLink(props: NeusPillLinkProps): React.ReactElement;
}
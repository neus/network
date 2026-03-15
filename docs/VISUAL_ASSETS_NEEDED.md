# Visual Assets Needed

High-impact visuals to complete the documentation polish.

---

## Priority 1: Landing Page Diagrams

### 1. Architecture Diagram
**File:** `docs/images/diagram-how-it-works.svg`
**Location:** `docs/index.mdx` (after "How It Works" heading)
**Purpose:** Show the Verify → Proof ID → Reuse flow at a glance
**Specs:** 800x200px, dark mode, simple 3-box flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Verify    │────▶│  Proof ID   │────▶│  Reuse Anywhere │
│   (once)    │     │  (receipt)  │     │  (apps, agents) │
└─────────────┘     └─────────────┘     └─────────────────┘
```

### 2. Integration Path Decision Tree
**File:** `docs/images/diagram-integration-path.svg`
**Location:** `docs/choose-an-integration-path.mdx` (replace ASCII decision tree)
**Purpose:** Help users quickly find their path
**Specs:** 600x400px, dark mode, flowchart style

---

## Priority 2: UI Screenshots

### 3. Hosted Verify Flow
**Files:**
- `docs/images/screenshot-verify-landing.png`
- `docs/images/screenshot-verify-success.png`
**Location:** `docs/cookbook/auth-hosted-verify.mdx`
**Purpose:** Show what users will see
**Specs:** 1200x800px, dark mode, browser window minimal chrome

### 4. Proof Page
**File:** `docs/images/screenshot-proof-page.png`
**Location:** `docs/platform/receipts-and-results.mdx`
**Purpose:** Show the public proof page
**Specs:** 1200x800px, dark mode

### 5. Hub Dashboard
**File:** `docs/images/screenshot-hub.png`
**Location:** `docs/platform/hub.mdx`
**Purpose:** Show profile/proof discovery
**Specs:** 1200x800px, dark mode

---

## Priority 3: Use Case Visuals

### 6. Use Case Cards
**Files:**
- `docs/images/usecase-nft-gating.png`
- `docs/images/usecase-sybil-resistance.png`
- `docs/images/usecase-agent-verification.png`
**Location:** New section in `docs/index.mdx` (optional)
**Purpose:** Visual representation of use cases
**Specs:** 400x300px each, consistent style

---

## Implementation Notes

1. **Diagram Style:**
   - Use NEUS brand color `#98C0EF` for primary elements
   - Dark background `#101113`
   - White text
   - Rounded corners (8px)
   - Simple, minimal design

2. **Screenshot Style:**
   - Dark mode only
   - Hide browser chrome where possible
   - Annotate key elements with callouts
   - Use placeholder data, blur real addresses

3. **File Formats:**
   - Diagrams: SVG (scalable, editable)
   - Screenshots: PNG (high quality)

---

## After Visuals Are Added

Update the markdown files to reference the new images:

```mdx
## How It Works

<img src="./images/diagram-how-it-works.svg" alt="NEUS verification flow" />
```

---

*This file can be deleted after visuals are created and integrated.*
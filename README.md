# BRAND SENTINEL — Pre-Publication Brand Governance Platform
### Team Vajra | CodeTitan Hackathon 2026
> **"EVERY PIECE OF CONTENT. ONE APPROVED BRAND TRUTH."**  
> Create confidently. Review transparently. Publish consistently.

---

## 1. Executive Summary

Brand Sentinel is an enterprise-grade, pre-publication brand governance platform designed to eliminate brand erosion, regulatory non-compliance, and unverified marketing claims before content is published. 

Unlike legacy post-publication scanners or generic LLM wrappers, Brand Sentinel deploys a **hybrid AI governance engine**:
1. **Deterministic Rule Engine**: High-velocity lexical analysis for prohibited vocabulary, required disclaimers, character/channel constraints, and accessibility rules.
2. **Retrieval-Augmented Generation (RAG) Grounding**: Dual BM25 and semantic cosine similarity retrieval mapping claims strictly against certified corporate guidelines and facts.
3. **Contextual LLM & Claim Discrepancy Engine**: Uncovers subtle voice deviations, hyperbolic assertions, and flags unbacked statistics as `"Not verified — approved supporting evidence not found."`
4. **Human-in-the-Loop Stewardship**: Automated systems highlight issues and suggest non-destructive corrections, but authoritative release decisions remain strictly human-controlled.

---

## 2. Technology Stack & Architecture

- **Frontend**:
  - React 18, TypeScript, Vite
  - Tailwind CSS with an enterprise Navy/Blue theme (`#0B192C`, `#1E3E62`, `#1D4ED8`)
  - Lucide React icon system
  - Responsive, component-driven inspection studio and side-by-side revision interface
- **Backend**:
  - Node.js & Express.js with TypeScript REST APIs
  - JWT Authentication with strict Role-Based Access Control (RBAC) middleware
  - Multer for secure document uploads (PDF, DOCX, TXT)
  - `pdf-parse` & `mammoth` for text extraction preserving structural offsets
- **Database**:
  - Relational Database engine (`better-sqlite3`) with strict foreign keys (`PRAGMA foreign_keys = ON`), WAL journaling, and 23 normalized tables.
- **AI Governance Engine**:
  - Hybrid pipeline: Deterministic lexical engine + Semantic embedding retrieval + LLM verification (supporting optional Gemini API key or robust offline semantic reasoning engine).

---

## 3. User Roles & RBAC Matrix

| Capability | Content Creator | Human Reviewer | Brand Admin |
| :--- | :---: | :---: | :---: |
| Creator Workspace & Draft Authoring | Yes | View Only | Yes |
| Document Upload (PDF / DOCX / TXT) | Yes | View Only | Yes |
| Run Preflight Scans & Inspect AI Findings | Yes | Yes | Yes |
| Accept / Edit / Dismiss Suggestions | Yes | No | Yes |
| Resubmit Revised Copy (vN+1) | Yes | No | Yes |
| Human Review Queue & Comment Thread | No | Yes | Yes |
| Authoritative Decision: Approve / Reject / Escalate | No | Yes | Yes |
| Manage Brand Guidelines & Lexicon Rules | No | No | Yes |
| Register Certified Facts & SLA Claims | No | No | Yes |
| View Governance Analytics & Immutable Audit Trail | Yes | Yes | Yes |

*Note: Self-approval by creators is blocked by policy.*

---

## 4. End-to-End Content Lifecycle Workflow

```
[ Creator Draft ]
       │
       ▼
[ Document Upload / Text Input ]
       │
       ▼
[ Preflight AI Scan ] ───► [ Deterministic Rules + RAG Brand Retrieval ]
       │
       ▼
[ AI Review Results ] ───► Highlighted Passages + Grounded Evidence Citations
       │
       ▼
[ Suggestion Decision ] ─► Accept / Edit / Dismiss with Mandatory Reason
       │
       ▼
[ Version N+1 Revision ] ─► Rescan for Verified Compliance (Score >= 95)
       │
       ▼
[ Submission to Human Reviewer ]
       │
       ▼
[ Reviewer Inspection ] ─► Comments + Grounded Evidence Audit
       │
       ▼
[ Final Decision Gate ] ─► APPROVE / REJECT / REQUEST CHANGES / ESCALATE
       │
       ▼
[ Immutable Audit Trail ] (Recorded with User ID, Status Transition & Timestamps)
```

---

## 5. Core Platform Pages & Features

1. **Authentication & Quick Role Switcher**:
   - Secure login and registration.
   - 1-Click Demo Identity Switcher in the top navigation bar to seamlessly test the Creator, Reviewer, and Admin perspectives during evaluations.
2. **Main Dashboard**:
   - Live KPI counters: Total Submissions, Pending Reviews, Approved Assets, Revisions Requested, Critical Findings.
   - Real-time recent submissions table and violation category trends.
3. **Creator Workspace**:
   - Form for Title, Body, Channel, Content Type, Campaign, and Persona.
   - Document attachment zone supporting PDF, DOCX, and TXT with live text extraction.
   - 1-click **Run Preflight Scan** trigger.
4. **Inspection Studio**:
   - Highlighted passages categorized by severity (Critical, High, Medium, Low).
   - Grounded Evidence Citation panel showing Source ID, Version, and exact excerpt.
   - Suggestion card with inline **Accept**, **Edit**, or **Dismiss with Reason** modal.
   - Revision resubmission creating version increments.
5. **Brand Knowledge Management**:
   - Dedicated tabs for Brand Guidelines, Voice Rules, Terminology Rules, Approved Facts, Approved Claims, Assets, and Campaigns.
   - Admin modals to publish new guidelines, banned terms, and facts.
6. **Reviewer Console**:
   - Queue sorted by urgency and critical violation counts.
   - Content inspection with comment thread and decision gates (Approve, Reject, Request Changes, Escalate).
7. **Governance Analytics**:
   - Category distribution, severity breakdown, top recurring prohibited terms, and unverified guideline gaps.
8. **Audit Trail**:
   - Searchable, immutable record of every lifecycle event.

---

## 6. Setup & Execution Instructions

### Prerequisites
- Node.js (v18+ or v24+)
- npm (v9+)

### Installation
```bash
# Clone the repository
git clone https://github.com/TeamVajra/BrandSentinel.git
cd BrandSentinel

# Install all workspace dependencies
npm install
```

### Seeding the Enterprise Knowledge Base
```bash
# Seeds 3 RBAC users, guidelines, voice rules, terms, approved claims, and submissions
npm run seed
```

### Running the End-to-End Test Suite
```bash
# Runs full programmatic integration verification
npm run test
```

### Running Development Servers
```bash
# Starts both Express backend (Port 5000) and Vite client (Port 5173)
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### Default Demo Credentials
- **Content Creator**: `creator@vajra.com` | `password123`
- **Human Reviewer**: `reviewer@vajra.com` | `password123`
- **Brand Administrator**: `admin@vajra.com` | `password123`
*(Or use the 1-click quick-switcher on the login screen and navbar)*

---

## 7. Team Vajra | CodeTitan Hackathon 2026
Built with precision, explainability, security, and human accountability.

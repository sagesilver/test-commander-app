Here you go — a drop‑in spec you can hand to Cursor. It includes: how to bulk‑download icons, Firestore collections/schemas, security rules, Functions, and the admin UIs for global + org‑level maintenance.

---

# test-commander-testtypes-design.md

## 0) Purpose

Implement **Test Types** as a managed reference list with:

* **Global catalog** maintained by **App Admin** (add/edit/archive types).
* **Org‑level selection** maintained by **Org Admin** (choose which global types are enabled for their org, and optional org‑specific overrides like labels/icons).
* **High‑quality free icons** (Lucide) downloaded in bulk and available in the app.

This aligns with our UI stack and iconography (Lucide/Tailwind/MUI X) and our RBAC model (App Admin vs Org Admin)   and follows our existing security/onboarding patterns for privileged operations and role checks .

---

## 1) Icon Source & Bulk Download

**Pack:** Lucide (MIT, SVG). Matches our visual style and grid components.

### 1.1 Folder Structure (repo)

```
/scripts/icons/download-testtype-icons.ts
/public/icons/test-types/lucide/*.svg     // local copy for dev + SSR
```

> Optional: also upload to **Firebase Storage** for CDN delivery:

```
gs://<project-id>.appspot.com/icons/test-types/lucide/*.svg
```

### 1.2 Install dependencies

```bash
pnpm add -D lucide-static axios
# or: npm i -D lucide-static axios
```

### 1.3 Configure the icon list

Create `/scripts/icons/testtype-icons.ts`:

```ts
export const LUCIDE_TESTTYPE_ICONS = [
  // Extend as needed; keep names in kebab-case (lucide-static filenames)
  'wind',              // Smoke
  'smile',             // Sanity
  'rotate-cw',         // Regression
  'git-merge',         // Integration
  'monitor',           // System
  'globe',             // End-to-End
  'search',            // Exploratory
  'activity',          // Performance
  'shield',            // Security
  'eye',               // Accessibility
  'code',              // API
  'database',          // Database
  'smartphone',        // Mobile
  'globe-2',           // Cross-Browser
];
```

### 1.4 Script: Download/Copy SVGs locally

Lucide publishes raw SVGs via `lucide-static`. We copy the files we need.

`/scripts/icons/download-testtype-icons.ts`:

```ts
import fs from 'node:fs';
import path from 'node:path';
import { LUCIDE_TESTTYPE_ICONS } from './testtype-icons.js';

const SRC = path.resolve('node_modules/lucide-static/icons');
const DEST = path.resolve('public/icons/test-types/lucide');

(async () => {
  fs.mkdirSync(DEST, { recursive: true });
  let copied = 0;
  for (const name of LUCIDE_TESTTYPE_ICONS) {
    const src = path.join(SRC, `${name}.svg`);
    const dest = path.join(DEST, `${name}.svg`);
    if (!fs.existsSync(src)) {
      console.error(`Missing icon: ${name}`);
      continue;
    }
    fs.copyFileSync(src, dest);
    copied++;
  }
  console.log(`Copied ${copied} test type icons to ${DEST}`);
})();
```

Run:

```bash
ts-node scripts/icons/download-testtype-icons.ts
```

### 1.5 (Optional) Upload icons to Firebase Storage

`/scripts/icons/upload-to-storage.ts`:

```ts
import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

const SERVICE_ACCOUNT = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON!);
initializeApp({ credential: cert(SERVICE_ACCOUNT), storageBucket: process.env.FB_STORAGE_BUCKET });

const LOCAL = path.resolve('public/icons/test-types/lucide');
const PREFIX = 'icons/test-types/lucide';

(async () => {
  const bucket = getStorage().bucket();
  const files = fs.readdirSync(LOCAL).filter(f => f.endsWith('.svg'));
  for (const f of files) {
    const local = path.join(LOCAL, f);
    const remote = `${PREFIX}/${f}`;
    await bucket.upload(local, { destination: remote, contentType: 'image/svg+xml', public: true });
    console.log(`Uploaded: ${remote}`);
  }
})();
```

Env:

```bash
export GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account", ...}'
export FB_STORAGE_BUCKET="<project-id>.appspot.com"
ts-node scripts/icons/upload-to-storage.ts
```

> Storage icons are public‑read; see rules below.

---

## 2) Data Model (Firestore)

We add a **global catalog** and an **org‑level configuration** that references the global catalog. This is consistent with our multi‑tenant ER model (App Admin → Org → Project) .

### 2.1 Collections & Docs

```
/globalTestTypes/{testTypeId}
  name: string
  code: string            // unique, kebab-case; e.g., "regression"
  category: string|null   // optional grouping
  description: string
  icon: {
    pack: "lucide",
    name: "rotate-cw",    // lucide-static filename
    src: "local"|"storage",
    url: string           // "/icons/test-types/lucide/rotate-cw.svg" OR storage public URL
  }
  status: "ACTIVE"|"ARCHIVED"
  createdAt, createdBy, updatedAt, updatedBy

/organisations/{orgId}/settings/testTypes/{testTypeId} // mirrors global IDs
  enabled: boolean
  override?: {
    name?: string
    description?: string
    icon?: { pack:string, name:string, src:"local"|"storage", url:string }
  }
  updatedAt, updatedBy
```

> We keep org docs light and **reference the global type**; org can override display fields selectively.

---

## 3) Seed Data

Create `/seed/global-testtypes.json` (partial example; extend to full set as needed):

```json
[
  {
    "code": "smoke",
    "name": "Smoke Test",
    "category": "Stability",
    "description": "Basic build verification",
    "icon": { "pack": "lucide", "name": "wind", "src": "local", "url": "/icons/test-types/lucide/wind.svg" },
    "status": "ACTIVE"
  },
  {
    "code": "sanity",
    "name": "Sanity Test",
    "category": "Stability",
    "description": "Quick narrow checks after small changes",
    "icon": { "pack": "lucide", "name": "smile", "src": "local", "url": "/icons/test-types/lucide/smile.svg" },
    "status": "ACTIVE"
  },
  {
    "code": "regression",
    "name": "Regression Test",
    "category": "Coverage",
    "description": "Re-validate previously working functionality",
    "icon": { "pack": "lucide", "name": "rotate-cw", "src": "local", "url": "/icons/test-types/lucide/rotate-cw.svg" },
    "status": "ACTIVE"
  }
]
```

Seeder `/scripts/seed/seed-global-testtypes.ts`:

```ts
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import seed from './global-testtypes.json';

const app = initializeApp({
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

(async () => {
  for (const t of seed) {
    const id = t.code; // use code as doc id
    await setDoc(doc(db, 'globalTestTypes', id), {
      ...t,
      createdAt: serverTimestamp(),
      createdBy: 'system',
      updatedAt: serverTimestamp(),
      updatedBy: 'system'
    });
    console.log(`Seeded ${id}`);
  }
})();
```

---

## 4) Security Rules

Follow the RBAC patterns we use elsewhere (App Admin / Org Admin, least privilege reads) .

`firestore.rules` (excerpt):

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // GLOBAL CATALOG
    match /globalTestTypes/{testTypeId} {
      allow read: if request.auth != null; // Everyone can read catalog
      allow write, create, update, delete:
        if isAppAdmin(); // Only App Admin maintains global list
    }

    // ORG-LEVEL SELECTION
    match /organisations/{orgId}/settings/testTypes/{testTypeId} {
      allow read: if isMemberOfOrg(orgId); // org-scoped read
      allow write, update:
        if isOrgAdmin(orgId); // only org admins maintain their selection
      allow delete:
        if isOrgAdmin(orgId);
    }

    function isAppAdmin() {
      return request.auth != null && 'APP_ADMIN' in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles;
    }

    function isMemberOfOrg(orgId) {
      return request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.organisationId == orgId;
    }

    function isOrgAdmin(orgId) {
      return isMemberOfOrg(orgId) &&
        'ORG_ADMIN' in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles;
    }
  }
}
```

> Mirrors our Auth/RBAC approach for preventing privilege issues and ensuring consistency with existing user docs/roles .

---

## 5) Cloud Functions (optional but recommended)

Keep privileged flows server‑mediated (same pattern as user creation & RBAC checks) .

`functions/src/index.ts`:

```ts
export const createGlobalTestType = functions.https.onCall(async (data, context) => {
  // check APP_ADMIN
  // validate schema (code unique, icon pack/name valid)
  // write /globalTestTypes/{code}
});

export const updateGlobalTestType = functions.https.onCall(async (data, context) => {
  // check APP_ADMIN
  // update fields; prevent code collisions
});

export const archiveGlobalTestType = functions.https.onCall(async (data, context) => {
  // check APP_ADMIN
  // set status = 'ARCHIVED'
});

export const setOrgTestTypes = functions.https.onCall(async (data, context) => {
  // check ORG_ADMIN for orgId
  // input: { orgId, enabledIds: string[], overrides?: Record<id, override> }
  // batch write to /organisations/{orgId}/settings/testTypes/*
});
```

---

## 6) Frontend Types & Fetching

### 6.1 TypeScript types

```ts
export type IconRef = {
  pack: 'lucide';
  name: string;        // lucide-static filename (kebab-case)
  src: 'local'|'storage';
  url: string;         // resolved path to svg
};

export type GlobalTestType = {
  id: string;
  code: string;
  name: string;
  category?: string|null;
  description: string;
  icon: IconRef;
  status: 'ACTIVE'|'ARCHIVED';
  createdAt?: any;
  createdBy?: string;
  updatedAt?: any;
  updatedBy?: string;
};

export type OrgTestType = {
  id: string;           // same id as global
  enabled: boolean;
  override?: Partial<Pick<GlobalTestType, 'name'|'description'|'icon'>>;
  updatedAt?: any;
  updatedBy?: string;
};
```

### 6.2 Queries (least‑privilege)

* **Global list** (read‑only): `getDocs(collection(db, 'globalTestTypes'))`
* **Org selection**: `getDocs(collection(db, 'organisations', orgId, 'settings', 'testTypes'))`

These follow our data‑access guidance (targeted reads) .

---

## 7) Admin UIs

Follow our **Forms Design Standard** (dark theme, tokens, accessibility)  .

### 7.1 Global: “Test Types (Global)”

**Route:** `/admin/global/test-types` (App Admin only)

**Features:**

* List with filters (status/category), search by name/code.
* Add / Edit / Archive.
* Icon picker pre‑filtered to Lucide + our whitelisted names.
* Validation: unique `code`, required `name`, `icon.name` must exist.
* Write via Cloud Functions above (or direct writes with rules).

### 7.2 Org: “Test Types (Org)”

**Route:** `/org/:orgId/settings/test-types` (Org Admin only)

**Features:**

* Grid with all **ACTIVE** global types and a toggle to **Enable** per org.
* Optional per‑type overrides: display name, description, **icon override** (still from Lucide).
* Batch **Enable/Disable**.
* Persist to `/organisations/{orgId}/settings/testTypes/{id}`.

> In test case forms and grids, show only **enabled** org types. (Matches the Grid view style where Test Type is a color‑coded/with icon badge) .

---

## 8) Rendering Icons

Prefer local SVG path for speed; if Storage is used, store the public URL in `icon.url`.

React component:

```tsx
export function TestTypeIcon({ icon }: { icon: IconRef }) {
  return (
    <img
      src={icon.url}
      alt=""
      width={18}
      height={18}
      className="inline-block align-middle opacity-90"
      loading="lazy"
    />
  );
}
```

> Keep sizing consistent with our iconography guidelines (20–24px, muted where secondary) .

---

## 9) Storage Rules (if using Storage for icons)

Open‑read public bucket path for icons:

```txt
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /icons/test-types/{pack}/{file} {
      allow read: if true;       // public read (icons only)
      allow write: if request.auth != null && request.auth.token.admin == true; // deploy script/service acct
    }
  }
}
```

---

## 10) Integration Points

* **Test Case forms**: `Test Type` select pulls from org‑enabled list; display chip with icon (consistent with form UX)  and **Grid view** column uses the icon (badges/pills) .
* **Reporting/filters**: use `code` (stable key), display `name` (possibly org‑overridden).

---

## 11) Migrations & Tasks

1. **Download icons** (script 1.4).
2. (Optional) **Upload to Storage** (script 1.5).
3. **Seed** global types (script 3 + full JSON).
4. Deploy **rules** (Firestore + Storage) and **Functions**.
5. Build **Global** and **Org** maintenance screens.
6. Update **Test Case** model field to reference test type codes (if not already in schema) — consistent with current Test Case structure where `Test Type` is a field used for reporting/regression support .

---

## 12) Notes & Edge Cases

* **Archiving** a global type does not delete org selections; UI should mark it as archived and prevent new usage.
* If an org had enabled a now‑archived type, keep it visible as “(Archived)” and allow disabling but not re‑enabling.
* Icon overrides remain constrained to our Lucide whitelist to preserve visual consistency (per Style spec) .
* Respect **least‑privilege** reads in all pages (no cross‑tenant scans) .

---

## 13) QA Checklist

* [ ] App Admin can create/update/archive global test types (rules enforced).
* [ ] Org Admin can enable/disable and override icon/name/description for their org only.
* [ ] Non‑admins can read lists but cannot write.
* [ ] Test Case forms and grids show **only org‑enabled** types with the correct icon.
* [ ] Icons render in both **light** and **dark** modes with accessible contrast (per style guide) .
* [ ] No client over‑fetching of other orgs’ data.

Larger List of test Types
Here’s a **comprehensive list of test types** you can support in the Test Commander application.
It combines industry-standard categories with flexibility for your tagging/filtering system, so they can be used for classification, reporting, and regression planning.

## **1. Functional Testing**

* **Smoke Testing** – Basic build verification.
* **Sanity Testing** – Quick checks on specific functionality.
* **Regression Testing** – Verification after changes.
* **Integration Testing** – Interactions between components/modules.
* **System Testing** – End-to-end validation.
* **User Acceptance Testing (UAT)** – Final business validation.
* **End-to-End (E2E) Testing** – Full workflow coverage.

---

## **2. Non-Functional Testing**

* **Performance Testing** – Response times, throughput.
* **Load Testing** – Expected user load.
* **Stress Testing** – Beyond capacity limits.
* **Scalability Testing** – Horizontal/vertical growth handling.
* **Reliability Testing** – Stability over time.
* **Security Testing** – Vulnerability & penetration testing.
* **Usability Testing** – User experience and accessibility.
* **Accessibility Testing** – WCAG, ADA compliance.
* **Compatibility Testing** – OS, browser, device combinations.
* **Localization/Internationalization Testing** – Language, currency, formatting.
* **Recovery/Failover Testing** – Disaster recovery validation.
* **Install/Uninstall Testing** – Deployment processes.

---

## **3. Specialized / Domain-Specific Testing**

* **API Testing** – REST/GraphQL validation.
* **Database Testing** – Schema, data integrity, performance.
* **Data Migration Testing** – Legacy → new system validation.
* **Configuration Testing** – Environment & settings combinations.
* **Compliance Testing** – Industry standards (e.g., HIPAA, PCI-DSS, ISO).
* **Mobile Testing** – Native, hybrid, responsive web.
* **Cross-Browser Testing** – Rendering, behaviour across browsers.
* **Hardware/Embedded Testing** – Firmware, devices, sensors.

---

## **4. Automation Scope Types**

* **Automated Functional Tests** – Playwright, Selenium, Cypress.
* **Automated Regression Packs** – Scheduled or triggered runs.
* **Automated API Suites** – Postman/Newman, REST Assured.
* **CI/CD Pipeline Tests** – Triggered in build pipelines.

---

## **5. Maintenance & Exploratory**

* **Exploratory Testing** – Unscripted, creative exploration.
* **Ad-hoc Testing** – No documentation, quick checks.
* **Confirmation/Retesting** – Verify defect fixes.
* **Session-Based Testing** – Time-boxed exploratory with charters.
* **Maintenance Testing** – After environment/config updates.

---

## **6. User & Business-Focused**

* **Beta Testing** – Pre-release user group.
* **Pilot Testing** – Limited scope rollout.
* **Operational Readiness Testing (ORT)** – Production readiness checks.
* **Business Process Testing (BPT)** – End-to-end process alignment.




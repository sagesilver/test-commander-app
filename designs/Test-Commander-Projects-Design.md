# Implement Firestore Collections & Security Rules for Projects (with RBAC)

We already have working `/organizations/{organizationId}` and `/users/{userId}` collections integrated into the app.

**Task:** Implement the next part of the MVP data model — the **Projects** collection and its subcollections — along with **role-based access control (RBAC)** checks in both Firestore rules and the application service layer.

## 1. Firestore Structure to Add

```text
/organizations/{organizationId}
  /projects/{projectId}
    name: string
    description: string
    status: enum(ACTIVE, INACTIVE)
    createdAt: timestamp
    createdBy: userId
    updatedAt: timestamp
    tags[]: string[]
    projectAdminIds[]: string[]
    metadata: { industry, type, priority }
    settings: { defaultFolderStructure: boolean, allowCrossProjectClone: boolean }
```

Later, these projects will have subcollections:

```text
/folders
/testCases
/regressionSuites
/testSets
/releases
/issues
```

but **for now only implement Projects** with an empty placeholder subcollection structure so future modules can attach.

### 2. RBAC Integration

- Roles are already defined (`APP_ADMIN`, `ORG_ADMIN`, `PROJECT_ADMIN`, etc.) in the `/users/{userId}` documents.
- Implement security rules so that:
  - Create is restricted to `APP_ADMIN` or `ORG_ADMIN` of that organization.
  - Update/Delete allowed to `APP_ADMIN`, `ORG_ADMIN`, or `PROJECT_ADMIN` (i.e., users listed in `projectAdminIds`).
  - Organization members can read project metadata only when `status == 'ACTIVE'`. Admin roles can read regardless (to enable reactivation of inactive projects).
- Use **role-scoped** queries:
  - `ORG_ADMIN` can read/write all projects in their org.
  - `PROJECT_ADMIN` can read/write only their assigned projects.
  - Others: read-only if part of the org and project is `ACTIVE`.

### 3. Application Layer Changes

- Create a `projectsService.js` (or equivalent) with:
  - `createProject(organizationId, projectData)` → Creates Firestore doc under `/organizations/{organizationId}/projects`.
  - `updateProject(organizationId, projectId, updates)` → Updates metadata, description, tags, settings.
  - `getProjectsForUser(user)` → Uses role to determine query scope; excludes `INACTIVE` by default unless explicitly reactivating and caller has admin privileges.
- Ensure all functions **check RBAC in code** before writing to Firestore to avoid relying solely on client-side UI restrictions.

### 4. Security Rules

- Add rules in `firestore.rules`:

```javascript
match /organizations/{organizationId}/projects/{projectId} {
  function isProjectAdmin() {
    return request.auth != null &&
           resource.data.projectAdminIds != null &&
           (request.auth.uid in resource.data.projectAdminIds);
  }

  allow read: if (
    // Org members can read only ACTIVE projects
    (isOrgMember(organizationId) && resource.data.status == 'ACTIVE') ||
    // Admin roles can read regardless (for reactivation, admin tasks)
    isAppAdmin() || isOrgAdmin(organizationId) || isProjectAdmin()
  );

  allow create: if isAppAdmin() || isOrgAdmin(organizationId);
  allow update, delete: if isAppAdmin() || isOrgAdmin(organizationId) || isProjectAdmin();
}
```

- Use existing `isAppAdmin()`, `isOrgAdmin()`, `isOrgMember()` helpers and add a simple `isProjectAdmin()` check (based on `projectAdminIds`).

### 5. Testing (Dev/Test Environment – No Emulator)

Manually verify in the dev/test Firebase project:

- ORG_ADMIN can create a project in their organization; created project has `status: 'ACTIVE'` by default.
- PROJECT_ADMIN listed in `projectAdminIds` can update but cannot create other projects.
- Regular org members can read only when `status == 'ACTIVE'`; they cannot write.
- INACTIVE projects are hidden from non-admins; APP_ADMIN/ORG_ADMIN/PROJECT_ADMIN can still read to reactivate.
- Non-org users are denied for all reads/writes.

### 6. Deliverables

- Updated `firestore.rules` with project-level access logic.
- New Firestore `projects` collection nested under `organizations`.
- Service layer functions for CRUD with integrated RBAC.
- Manual verification checklist executed in dev/test.

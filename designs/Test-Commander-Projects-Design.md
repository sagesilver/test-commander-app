> **Implement Firestore Collections & Security Rules for Projects (with RBAC)**
>
> We already have working `/organisations/{organisationId}` and `/users/{userId}` collections integrated into the app.
>
> **Task:** Implement the next part of the MVP data model — the **Projects** collection and its subcollections — along with **role-based access control (RBAC)** checks in both Firestore rules and the application service layer.
>
> ### 1. Firestore Structure to Add
>
> ```
> /organisations/{organisationId}
>   /projects/{projectId}
>     name: string
>     description: string
>     status: enum(ACTIVE, ARCHIVED)
>     createdAt: timestamp
>     createdBy: userId
>     updatedAt: timestamp
>     tags[]: string[]
>     metadata: { industry, type, priority }
>     settings: { defaultFolderStructure: boolean, allowCrossProjectClone: boolean }
> ```
>
> Later, these projects will have subcollections:
>
> ```
> /folders
> /testCases
> /regressionSuites
> /testSets
> /releases
> /issues
> ```
>
> but **for now only implement Projects** with an empty placeholder subcollection structure so future modules can attach.
>
> ### 2. RBAC Integration
>
> * Roles are already defined (`APP_ADMIN`, `ORG_ADMIN`, `PROJECT_ADMIN`, etc.) in the `/users/{userId}` documents.
> * Implement security rules so that:
>
>   * **Only** `APP_ADMIN`, `ORG_ADMIN` of that organisation, or `PROJECT_ADMIN` assigned to that project can create/update/delete projects.
>   * All other organisation members can read project metadata (for UI lists) but **not** modify.
> * Use **role-scoped** queries:
>
>   * `ORG_ADMIN` can read/write all projects in their org.
>   * `PROJECT_ADMIN` can read/write only their assigned projects.
>   * Others: read-only if part of the org.
>
> ### 3. Application Layer Changes
>
> * Create a `projectsService.js` (or equivalent) with:
>
>   * `createProject(organisationId, projectData)` → Creates Firestore doc under `/organisations/{organisationId}/projects`.
>   * `updateProject(organisationId, projectId, updates)` → Updates metadata, description, tags, settings.
>   * `getProjectsForUser(user)` → Uses role to determine query scope.
> * Ensure all functions **check RBAC in code** before writing to Firestore to avoid relying solely on client-side UI restrictions.
>
> ### 4. Security Rules
>
> * Add rules in `firestore.rules`:
>
> ```javascript
> match /organisations/{organisationId}/projects/{projectId} {
>   allow read: if isOrgMember(organisationId);
>   allow create, update, delete: if (
>     hasRole(organisationId, 'APP_ADMIN') ||
>     hasRole(organisationId, 'ORG_ADMIN') ||
>     hasProjectRole(organisationId, projectId, 'PROJECT_ADMIN')
>   );
> }
> ```
>
> * Implement `isOrgMember()`, `hasRole()`, `hasProjectRole()` helper functions in the rules.
>
> ### 5. Testing
>
> * Write Firestore emulator tests to confirm:
>
>   * An `ORG_ADMIN` can create a project in their org.
>   * A `PROJECT_ADMIN` can update but not create other projects in the same org.
>   * Regular users can read but not write.
>   * Non-org users get denied.
>
> ### 6. Deliverables
>
> * Updated `firestore.rules` with project-level access logic.
> * New Firestore `projects` collection nested under `organisations`.
> * Service layer functions for CRUD with integrated RBAC.
> * Emulator test suite for all role scenarios.

---

If you want, I can also prepare a **second prompt** for Cursor to immediately follow this — to wire **Releases** and **Sprints** under Projects — so you don’t lose momentum. Would you like me to prepare that next?

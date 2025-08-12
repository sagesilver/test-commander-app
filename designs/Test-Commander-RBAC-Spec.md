
# Test Commander – RBAC Specification (Updated)

## 1. Purpose
This document defines roles, permissions, and enforcement rules for Test Commander so developers can:
- Generate Firestore security rules
- Build UI conditionals
- Enforce role/permission checks in backend functions

---

## 2. Role Definitions

```json
{
  "APP_ADMIN": {
    "description": "Global superuser with full permissions across all organisations and projects.",
    "scope": "global",
    "permissions": ["*"]
  },
  "ORG_ADMIN": {
    "description": "Full administrative permissions within their organisation.",
    "scope": "organisation",
    "permissions": [
      "manage_projects",
      "manage_releases",
      "manage_sprints",
      "manage_folders",
      "manage_test_cases",
      "manage_test_sets",
      "manage_regression_suites",
      "execute_tests",
      "manage_defects",
      "view_reports",
      "manage_users"
    ]
  },
  "PROJECT_MANAGER": {
    "description": "Can create, manage, and edit their own projects within an organisation.",
    "scope": "organisation",
    "permissions": [
      "manage_projects",
      "manage_releases",
      "manage_sprints",
      "manage_folders",
      "manage_test_cases",
      "manage_test_sets",
      "manage_regression_suites",
      "execute_tests",
      "manage_defects",
      "view_reports"
    ]
  },
  "PROJECT_ADMIN": {
    "description": "Full control over a specific project.",
    "scope": "project",
    "permissions": [
      "manage_releases",
      "manage_sprints",
      "manage_folders",
      "manage_test_cases",
      "manage_test_sets",
      "manage_regression_suites",
      "execute_tests",
      "manage_defects",
      "view_reports"
    ]
  },
  "TEST_MANAGER": {
    "description": "Same level of access as a Project Manager.",
    "scope": "organisation",
    "permissions": [
      "manage_projects",
      "manage_releases",
      "manage_sprints",
      "manage_folders",
      "manage_test_cases",
      "manage_test_sets",
      "manage_regression_suites",
      "execute_tests",
      "manage_defects",
      "view_reports"
    ]
  },
  "TEST_ENGINEER": {
    "description": "Execute tests, record results, raise defects.",
    "scope": "project",
    "permissions": [
      "execute_tests",
      "view_reports",
      "manage_defects"
    ]
  },
  "ANALYST": {
    "description": "Same level of access as a Test Engineer.",
    "scope": "project",
    "permissions": [
      "execute_tests",
      "view_reports",
      "manage_defects"
    ]
  },
  "VIEWER": {
    "description": "Access to all information in a project but cannot add, create, or edit information.",
    "scope": "project",
    "permissions": [
      "view_reports"
    ]
  }
}
```

---

## 3. Permission Codes

```json
[
  "manage_users",
  "manage_projects",
  "manage_releases",
  "manage_sprints",
  "manage_folders",
  "manage_test_cases",
  "manage_test_sets",
  "manage_regression_suites",
  "execute_tests",
  "manage_defects",
  "view_reports"
]
```

---

## 4. User Document Fields

```json
{
  "userId": "string",
  "organisationId": "string",
  "roles": ["ORG_ADMIN", "PROJECT_MANAGER"],
  "permissions": ["manage_test_cases"], // explicit overrides
  "projects": ["projectId1", "projectId2"]
}
```

---

## 5. Firestore Security Rules Pattern

Example for `/projects/{projectId}/testCases/{testCaseId}`:

```javascript
match /projects/{projectId}/testCases/{testCaseId} {
  allow read: if hasPermission('view_reports', request.auth, projectId);
  allow create, update, delete: if hasPermission('manage_test_cases', request.auth, projectId);
}
```

`hasPermission` helper checks:
- Role → permission mapping
- Explicit permission overrides
- Org/project membership

---

## 6. UI Enforcement

- **Hide/disable** buttons & actions the user can’t perform.
- Pass `currentUser.permissions` into components.
- Use `can(permissionCode)` helper in both client & server.

---

## 7. Developer Implementation Notes

- Provide **role-to-permission JSON** and **permission list JSON** as constants in `/src/constants/rbac.ts`.
- Implement `can(user, permission, context)` util in `/src/utils/rbac.ts`.
- Mirror rules in Firestore security rules and backend APIs.
- Ensure any change to RBAC constants triggers regeneration of both UI helpers and Firestore rules.


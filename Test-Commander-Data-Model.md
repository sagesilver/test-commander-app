# Test Commander Data Model

## 1. High-Level Entity-Relationship Diagram (ERD)

**App Admin** (Super User)  
&nbsp;&nbsp;└── **Organisation**  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── **Org Admin** (User)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── **Users** (Regular Users)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── **Project**  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── **Release/Sprint**  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;└── **Test Run** (instance of running test case in a release/sprint)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── **Regression Suite**  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;└── **Test Case** (many per suite; a test case can belong to many suites)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── **Test Case**  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;├── **Test Step**  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;├── **Test Run** (one for each time the test case is run, in any release/sprint)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;└── **Linked Issue** (many-to-many, see Issue below)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── **Issue** (many per project; each may link to one or more test cases)

---

## 2. Entity Definitions & Key Fields

### App Admin (Super User)
- `appAdminId`: string (unique, default: "admin@testcommander.com")
- `email`: string
- `name`: string
- `role`: enum ("APP_ADMIN")
- `createdAt`: timestamp
- `lastLoginAt`: timestamp
- **Capabilities:**
  - Create/manage organizations
  - Access all organizations
  - System-wide administration
  - Global settings management

### Organisation
- `organisationId`: string (unique)
- `name`: string
- `description`: string
- `contactInfo`: object
  - `address`: string
  - `phone`: string
  - `website`: string
- `orgAdminId`: string (FK to User)
- `createdBy`: string (FK to App Admin)
- `createdAt`: timestamp
- `isActive`: boolean
- `settings`: object
  - `customFields`: array
  - `workflows`: array
  - `defaultUserRole`: string
  - `maxUsers`: number
  - `maxProjects`: number
- `subscription`: object
  - `plan`: string
  - `startDate`: date
  - `endDate`: date
  - `features`: array

### User
- `userId`: string (unique)
- `organisationId`: string (FK)
- `email`: string
- `name`: string
- `roles`: array of enums ("ORG_ADMIN", "ANALYST", "TEST_ENGINEER", "DEFECT_COORDINATOR")
- `isActive`: boolean
- `createdAt`: timestamp
- `lastLoginAt`: timestamp
- `profile`: object
  - `avatar`: string
  - `department`: string
  - `position`: string
  - `phone`: string
- `permissions`: array of permission strings

### Project
- `projectId`: string (unique)
- `organisationId`: string (FK)
- `name`: string
- `description`: string
- `createdBy`: string (FK to User - must be Org Admin)
- `createdAt`: timestamp
- `isActive`: boolean
- `members`: array of { userId: string, roles: array, addedAt: timestamp }
- `settings`: object
  - `customFields`: array
  - `workflows`: array
  - `testModel`: object
- `metadata`: object
  - `version`: string
  - `technology`: string
  - `platform`: string

### Release/Sprint
- `releaseId`: string (unique)
- `projectId`: string (FK)
- `name`: string
- `description`: string
- `type`: enum ("RELEASE", "SPRINT")
- `parentReleaseId`: string (FK, for sprints within releases)
- `startDate`: date
- `endDate`: date
- `status`: enum ("PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED")
- `createdBy`: string (FK to User)
- `createdAt`: timestamp
- `testCases`: array of TestCaseIDs
- `metrics`: object
  - `plannedTestCases`: number
  - `executedTestCases`: number
  - `passedTestCases`: number
  - `failedTestCases`: number

### Regression Suite
- `suiteId`: string (unique)
- `projectId`: string (FK)
- `name`: string
- `description`: string
- `testCaseIds`: array of TestCaseIDs

### Test Case
- `testCaseId`: string (unique)
- `projectId`: string (FK)
- `title`: string
- `description`: string
- `createdBy`: UserID
- `createdAt`: timestamp
- `requirements`: array (requirement IDs/refs)
- `regressionSuites`: array of SuiteIDs
- Relationships:
  - Has many Test Steps
  - Has many Test Runs
  - Links to many Issues

### Test Step
- `stepId`: string (unique)
- `testCaseId`: string (FK)
- `order`: int
- `action`: string
- `expectedResult`: string
- `attachments`: array (optional)
- `notes`: string

### Test Run
- `testRunId`: string (unique)
- `testCaseId`: string (FK)
- `releaseId`: string (FK)
- `executedBy`: UserID
- `executedAt`: timestamp
- `status`: enum (Passed, Failed, Blocked, Skipped)
- `testStepResults`: array of { stepId, status, actualResult, notes }
- `linkedIssueIds`: array of IssueIDs
- `attachments`: array

### Issue
- `issueId`: string (unique)
- `projectId`: string (FK)
- `title`: string
- `description`: string
- `status`: enum
- `severity`: enum
- `priority`: enum
- `createdBy`: UserID
- `createdAt`: timestamp
- `assignedTo`: UserID
- `linkedTestCaseIds`: array of TestCaseIDs
- `attachments`: array

---

## 3. Relationship Notes

- **Test Case ↔ Regression Suite:** Many-to-many.
- **Test Case ↔ Issue:** Many-to-many.
- **Test Case ↔ Test Run:** One-to-many.
- **Release/Sprint ↔ Test Run:** One-to-many.
- **Test Case ↔ Test Step:** One-to-many.
- **Project ↔ Issue:** One-to-many.

---

## 4. Example Firestore/NoSQL Structure


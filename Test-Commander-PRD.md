# Product Requirements Document (PRD): Test Commander

## 1. Product Overview

**Test Commander** is a modern, extensible platform for managing test cases, issues/defects, test scheduling, and quality reporting. It enables users to create, organise, execute, and report on complex test artefacts within a collaborative, cloud-based environment. Test Commander leverages Firebase for its backend and provides a clean, intuitive front-end designed for extensibility—allowing future modules (automation, requirements management, and more) to be plugged in.

The system operates on a multi-tenant architecture with the following hierarchy:
- **App Admin** (Super User) - System administrator with global access
- **Organizations** - Top-level tenants managed by Org Admins
- **Projects** - Work units within organizations
- **Releases/Sprints** - Time-bound work cycles within projects
- **Test Cases, Defects, etc.** - Core testing artifacts

---

## 2. Goals & Objectives

- Centralise management of test cases, defects/issues, and test schedules.
- Provide flexible, hierarchical test modelling (multi-layered categorisation).
- Support rigorous issue and defect management, reporting, and workflow.
- Deliver robust dashboards and reporting for test, defect, and schedule analytics.
- Enable easy integration of future modules (test execution, automation, requirements, etc.).
- Modern, responsive GUI for easy adoption by QA teams, developers, and business users.
- Multi-tenant architecture supporting multiple organizations with isolated data and workflows.

---

## 3. Target Users

### 3.1 User Roles & Hierarchy

**App Admin (Super User)**
- Email: admin@testcommander.com
- **Capabilities:**
  - Create and manage organizations
  - Access all organizations and data
  - System-wide administration and settings
  - Global reporting and analytics
  - User management across all organizations

**Org Admin**
- **Capabilities:**
  - Manage organization settings and users
  - Create and manage projects within their organization
  - Assign users to projects with specific roles
  - Organization-level reporting
  - Customize workflows and field sets

**Analyst**
- **Capabilities:**
  - Create and manage test cases
  - Analyze test results and data
  - Generate reports and insights
  - Access project data and analytics

**Test Engineer**
- **Capabilities:**
  - Create and execute test cases
  - Log and manage defects
  - Update test results and status
  - Access project data and reports

**Defect Coordinator**
- **Capabilities:**
  - Manage defect workflow and lifecycle
  - Assign defects to appropriate team members
  - Track defect resolution and status
  - Coordinate defect triage and prioritization

---

## 4. Core Features & Functional Requirements

### 4.1 App Admin Management

- **Organization Creation:**
  - Create new organizations with basic information
  - Assign org admin during creation
  - Set organization limits and subscription plans
  - Configure global settings and defaults

- **System Administration:**
  - Monitor all organizations and usage
  - Global user management and access control
  - System-wide reporting and analytics
  - Backup and data management
  - Global settings and configuration

### 4.2 Organization Management

- **Organization Setup:**
  - Organization profile and contact information
  - Custom branding and settings
  - User role definitions and permissions
  - Workflow templates and field sets
  - Subscription and billing management

- **User Management:**
  - Add/remove organization users
  - Assign multiple roles to users
  - User activity monitoring
  - Bulk user operations
  - User profile management

### 4.3 User & Security Management

- **Multi-level Authentication:**
  - App Admin: admin@testcommander.com
  - Organization-level user accounts
  - Role-based access control (RBAC)
  - Session management and security

- **Firebase User Creation (CORRECTED APPROACH):**
  - **CRITICAL: Server-side Auth user creation prevents APP_ADMIN logout**
  - **CRITICAL: Real UID from start prevents UUID mismatch**
  - **CRITICAL: Client-side email trigger ensures delivery**
  - Cloud Function creates Firebase Auth user + Firestore doc with real UID
  - Client triggers password reset email via Firebase's built-in system
  - User receives email and sets password via Firebase's flow
  - **Avoids: APP_ADMIN logout, UUID mismatch, white screen, email delivery failure**

- **Permission System:**
  - Granular permissions per role
  - Project-level access control
  - Data isolation between organizations
  - Audit trail of all user actions

### 4.4 Project Management

- **Project Creation:**
  - Project setup wizard (only by Org Admins)
  - Team member assignment with roles
  - Project templates and settings
  - Custom field configuration

- **Project Administration:**
  - Project settings and configuration
  - Team management and role assignments
  - Project-specific workflows
  - Resource allocation

### 4.5 Release/Sprint Management

- **Release Planning:**
  - Create releases with timelines
  - Define release scope and objectives
  - Assign test cases to releases
  - Release status tracking

- **Sprint Management:**
  - Create sprints within releases
  - Sprint backlog management
  - Velocity tracking and metrics
  - Sprint retrospective and planning

### 4.6 Test Modelling

- **Hierarchical Test Model:**  
  - Unlimited category layers: Organisation → Project → Function → Subsystem → (etc.) → Test Case.
  - Drag-and-drop or wizard-style model builder.
  - Each node = category; test cases attach only to lowest-level nodes.
  - Model, category, and test case CRUD operations.

### 4.3 Test Case Management

- Unique, auto-generated Test Case ID (TCID).
- Test case CRUD: add, edit, move, copy, delete.
- Fields: description, steps, expected results, requirements covered, linked defects, attachments, tags, etc.
- Versioning and history/audit of changes.
- Assignment to test cycles/phases for scheduling.
- Linkage to requirements for traceability.
- Attach multiple files or supporting evidence to any test case.

### 4.4 Issue/Defect Management

- Electronic form for logging new issues/defects (with mandatory/optional fields).
- System auto-generates unique Issue ID.
- Field support (expandable):  
  - Project, Module, Region, Release, Type, Title, Description, Severity, Priority, Status, Reporter, Assigned To, Version, Impact, Root Cause, Resolution, Alternative/Workaround, Steps, Isolation, Attachments, Investigation Notes, etc.
- Status workflow (with enforced transitions):  
  - Open → Under Investigation → On-Hold/Retest/Closed/Out of Scope, etc.
- Assignment, reassignment, and routing for investigation, action, and testing.
- Multiple attachments (file upload and/or external link).
- Full history/audit log of all changes and status transitions.

### 4.5 Work Queue & Personal Dashboard

- User-centric view of all assigned items (test cases, defects, actions).
- Sections for: investigation/action, development testing, QA testing, retest, etc.
- Quick links from dashboard to full record.
- Work queue auto-updates when items are reassigned or routed.

### 4.6 Scheduling & Test Execution

- **Test Schedules:**  
  - Projects can have multiple, named test schedules.
  - Each schedule includes start/end dates, phases (system, regression, integration, UAT, etc.), and cycles (runs).
  - Phases can be parallel or sequential.
- **Test Cycles:**  
  - Each phase includes multiple cycles; each cycle groups a set of test cases for execution.
  - Each test case in a cycle must have at least one execution result.
  - Link each result to responsible tester and execution metadata.
- **Test Case Effort Metrics:**  
  - Hours to construct (design/build).
  - Hours to execute (preparation, execution, results analysis).

### 4.7 Attachments & Evidence Management

- Multiple attachments per record (test case, defect/issue, schedule).
- Upload documents, images, logs, etc.
- Option to link to cloud/external files.
- View and delete attachments (with user permission checks).

### 4.8 Reporting & Analytics

- Built-in reports:
  - All items (test cases, incidents, etc.)
  - Open/Closed/Retest Issues
  - Issues by Severity/Priority/Project/Status/Workflow/Root Cause/Module
  - Test progress (per project, per phase, per tester)
  - Test coverage (requirements traced, executed/not executed, pass/fail)
  - User activity, assignment, routing, etc.
- Sorting, grouping, filtering on all key fields.
- Export to PDF/CSV.
- Interactive dashboards: graphs, charts (status breakdown, trends, SLA, metrics).
- Custom query support for advanced users.

### 4.9 Reference Data Administration

- Admin interface for managing lookup/reference lists:
  - Status, Severity, Priority, Type, Project, Module, Action, Version, Region, Root Cause, Resolution, Subsystem, etc.
- Add/edit/remove allowed values.
- Changes are tracked and auditable.
- Support for project-specific or global value sets.

### 4.10 Notifications & Workflow

- Automated in-app/email notifications for assignments, state changes, overdue items.
- Routing of issues and work items with notification to assigned users.
- Broadcast messages to all users (admin feature).

### 4.11 Suggestions & Improvement Requests

- Form for users to submit suggestions/enhancements.
- Admins can review, respond, and track suggestion statuses.
- Feedback visible to users.

### 4.12 Change History & Audit

- All changes tracked with timestamp, user, previous/new value.
- Full record-level history/audit log accessible to admins and (where permitted) end users.
- Printable and exportable history.

### 4.13 Integration & Extensibility

- Modular architecture for adding future capabilities:
  - Test automation integration (API, webhooks).
  - Requirements/design management module.
  - Automated test execution and result import.
  - External API for integration with CI/CD, bug trackers, and other systems.
- Future-proofed for mobile and external authentication (SSO, LDAP, etc.).

---

## 5. Field Value Reference Tables (Key Examples)

### Status (Workflow)
- Open, Under Investigation, On-Hold, Retest, Closed, Out of Scope

### Severity (Configurable)
- 1: Software Unusable / High
- 2: Major Function Disabled / Major
- 3: Minor Function Disabled / Medium
- 4: Cosmetic / Low
- (Optionally, 5–8 for extended/QA-specific severities)

### Type
- Change Request, Production, Problem, Training, Data, Development

### Priority
- 1: High/Critical, 2: Medium, 3: Low

### Root Cause
- Functional, System, Process, Data, Code, Documentation, Standards, Other, Duplicate, NAP (Not a Problem), Bad Unit, RCN (Root Cause Not Determined), Unknown

### Resolution
- Fixed, Duplicate, Won't Fix, Works as Designed, Not a Defect, Deferred, Out of Scope

### Subsystem/Module/Region/Version/Action/Category
- All maintained and customisable via admin panel

---

## 6. Test Model, Test Case, and Scheduling Concepts

- **Test Model:** Hierarchical, unlimited layers, with lowest node always the Test Case Layer.
- **Test Case:** Unique ID, characteristics/fields, linked to requirements, full CRUD/versioning, can be moved/copied within the model.
- **Test Scheduling:** Multiple schedules per project; each with phases, cycles, and execution runs; phases can be parallel or sequential; metrics for hours to construct and execute per test case.

---

## 7. Non-Functional Requirements

- Responsive, accessible GUI (WCAG 2.1 AA).
- Fast performance (target: <2s page load).
- Scalable to enterprise user counts and data volume.
- Secure authentication, data access, and audit.
- High availability and reliability.
- Cloud-native, leveraging Firebase for backend, storage, and auth.
- Comprehensive test coverage for core flows and field validations.

---

## 8. Technical Implementation Notes

### 8.1 Firebase User Creation - Critical Lessons Learned

**Problem Solved (3-Day Debugging Experience):**
The initial Firebase user creation approach caused critical issues:
- APP_ADMIN logout during user creation
- UUID mismatch between Firebase Auth and Firestore
- White screen after user login
- Email delivery failure

**Root Cause:**
- Client-side Auth user creation using `createUserWithEmailAndPassword`
- Temporary UID approach with later Firestore document update
- Server-side password reset link generation
- Auth/Firestore data inconsistency

**Corrected Approach:**
1. **Server-side Auth user creation** using Cloud Function Admin SDK
2. **Real UID from start** - Firestore document uses actual Firebase UID immediately
3. **Client-side email trigger** using `sendPasswordResetEmail()` from Firebase Auth
4. **Immediate Firestore doc creation** with real UID

**Implementation:**
```javascript
// Cloud Function (functions/index.js)
exports.createUserAndInvite = functions.https.onCall(async (data, context) => {
  // 1. Validate RBAC
  // 2. Create Firebase Auth user FIRST using admin.auth().createUser()
  // 3. Create Firestore user document with REAL UID immediately
  // 4. Return user data (NO password reset link generation)
});

// Client (src/services/userService.js)
const result = await createUserAndInvite(userData);
await sendPasswordResetEmail(auth, email, actionCodeSettings); // Client-side trigger
```

**Key Benefits:**
- ✅ No APP_ADMIN logout (Auth user creation is server-side)
- ✅ No UUID mismatch (Firestore doc uses real UID from start)
- ✅ Proper email delivery (Firebase's intended flow)
- ✅ Clean user experience (no white screens)

**Documentation:**
See `Test-Commander-Auth-Design.md` for complete implementation details.

---

## 9. Constraints & Assumptions

- Firebase is the backend (Firestore, Storage, Functions, Auth).
- Initial release desktop-focused, mobile/responsive support planned.
- Project field and category values are fully customisable per organisation/project.
- Existing test and issue records can be imported in bulk via CSV/XLSX.
- User roles, field value lists, and workflow transitions are admin-configurable.

---

## 10. Success Metrics

- Number of projects, test cases, and issues managed.
- Frequency of report and dashboard use.
- User engagement and feedback ratings.
- Adoption rate of new features/modules.
- Performance and uptime statistics.
- Reduction in manual tracking and reporting effort.

---

## 11. Open Questions / Further Definition

- Confirm required integrations for automation and requirements management.
- Define mobile support priorities and timeline.
- Clarify regulatory/compliance needs (if any).
- Establish final field list and mandatory/optional status for each artefact.
- Confirm data retention, backup, and export requirements.

---

Got it — here’s a **full Defects Module specification** for Cursor, built from your PRD, augmented data model, forms style guide, and my own recommendations to make it lean but enterprise-grade.

---

## **Defects Module – Design Specification**

### **1. Entity Definition**

**Collection Path:**
`/projects/{projectId}/issues/{issueId}`

**Core Fields:**

| Field                  | Type        | Description                            | Notes                  |
| ---------------------- | ----------- | -------------------------------------- | ---------------------- |
| `issueId`              | string (PK) | Unique, auto-generated Issue ID        | Format: `DEF-{seqNo}`  |
| `projectId`            | string (FK) | Links defect to a project              | Required               |
| `title`                | string      | Short, descriptive summary             | Max 150 chars          |
| `description`          | rich text   | Full details of the defect             | Markdown support       |
| `status`               | enum        | Workflow state                         | See ref data           |
| `severity`             | enum        | Business/technical impact              | See ref data           |
| `priority`             | enum        | Urgency to fix                         | See ref data           |
| `type`                 | enum        | Classification (bug, change, etc.)     | See ref data           |
| `rootCause`            | enum        | Cause category                         | See ref data           |
| `resolution`           | enum        | How issue was resolved                 | See ref data           |
| `reportedBy`           | userId      | Who raised it                          | Auto-filled            |
| `assignedTo`           | userId      | Current owner                          | Editable               |
| `reportedAt`           | timestamp   | When raised                            | Auto-filled            |
| `updatedAt`            | timestamp   | Last updated                           | Auto-filled            |
| `linkedTestCaseIds[]`  | array       | IDs of related test cases              | Many-to-many           |
| `linkedExecutionIds[]` | array       | IDs of related test executions         | Many-to-many           |
| `attachments[]`        | array       | File metadata objects                  | Path, name, size, type |
| `tags[]`               | array       | Global/project tags                    | Uses Tags module       |
| `customFields[]`       | array       | Org/project-defined extra fields       | See custom fields spec |
| `auditLog[]`           | array       | { userId, action, timestamp, details } | For history            |

---

### **2. Reference Data & Defaults**

Stored under `/stateDefinitions/issues/{stateId}` (editable via admin panel):

**Status Workflow (default):**

* Open → Under Investigation → In Progress → Resolved → Retest → Closed
* Branches: On Hold, Out of Scope, Duplicate
* Admins can add/remove states; must map valid transitions.

**Severity:**

* 1: Critical (System Unusable)
* 2: Major (Function Disabled)
* 3: Medium (Partial Function Loss)
* 4: Low (Minor/Cosmetic)

**Priority:**

* 1: High/Critical
* 2: Medium
* 3: Low

**Type:**

* Bug, Change Request, Data Issue, Environment, Documentation

**Root Cause:**

* Code, Data, Process, Requirements, Configuration, Other

**Resolution:**

* Fixed, Duplicate, Won’t Fix, Works as Designed, Deferred, Out of Scope

---

### **3. Standards & Validation Rules**

* **Title**: Required, ≤150 chars
* **Description**: Required for new defect
* **Severity, Priority, Status**: Required
* **Linked Test Cases**: Optional, but recommended when defect found during execution
* **Attachments**: Size limit (configurable), virus scan hook
* **Audit Logging**: Every field change logged with user/time

---

### **4. Form Entry – New/Edit Defect**

**Layout (per `Test-Commander-Forms-Design.md`):**

* **Section 1: Basic Info** (Title, Project, Status, Severity, Priority, Type)
* **Section 2: Description** (Markdown editor)
* **Section 3: Links** (Linked Test Cases, Linked Executions – multi-select)
* **Section 4: Root Cause/Resolution** (Root Cause, Resolution – visible when status=Resolved/Closed)
* **Section 5: Attachments** (multi-upload with previews)
* **Section 6: Tags** (multi-select from global/project list, inline add)
* **Section 7: Custom Fields** (rendered dynamically)
* **Section 8: Audit Trail** (read-only panel in View mode)

---

### **5. Recommended Extracts & Reports**

* **Defect Summary Report** – Count by status, severity, priority
* **Aging Report** – Days open per defect
* **Defects by Module/Root Cause**
* **Defects Linked to Failed Test Cases**
* **Defect Re-open Rate**
* **Defects per Sprint/Release**
* **MTTR (Mean Time to Resolution)**

All exportable to CSV/XLSX with filters applied.

---

### **6. Lean Organisational Workflows**

**Suggested Roles:**

* **Reporter**: Any role can log a defect
* **Defect Coordinator**: Manages triage, assignment, workflow transitions
* **Developer/Engineer**: Fixes defect, updates status/resolution
* **Tester**: Retests and closes

**Example Workflow:**

1. Reporter logs defect (Open)
2. Defect Coordinator triages → assigns to Engineer
3. Engineer fixes → marks as Resolved, sets Resolution
4. Tester retests → marks as Closed or reopens to In Progress

---

### **7. Relationships with Tests & Executions**

* **Test Case ↔ Defect**: Many-to-many
  *Link when defect found during manual/automated execution or during review*
* **Test Execution ↔ Defect**: Many-to-many
  *Captures exact run where defect observed*
* When defect linked to execution, UI shows context: run date, environment, execution result
* In Test Case View: show linked defects as colored pills (status color)
* In Defect View: show linked test cases/executions in related panel

---

### **8. UX & Grid Integration**

* Grid view per `Test-Commander-Grid-View.md` standards:

  * Columns: ID, Title, Status (pill), Severity (color badge), Priority (icon+badge), Assigned To (avatar), Linked TCs (count), Last Updated
  * Inline editing for Status, Priority, Assigned To
  * Bulk edit & export
  * Conditional formatting (red for high severity, overdue)

---

### **9. AI/Automation Opportunities (Future)**

* Auto-suggest severity/priority from description
* AI duplicate detection on defect creation
* Auto-link defects to executions via parsing logs/screenshots
* Workflow recommendations based on history


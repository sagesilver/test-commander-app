# Test Commander – Folder Management Specification

## 1. Overview
This document defines the folder management feature for the Test Case module in Test Commander. Folders are an organisational layer within a Project that allow unlimited nested hierarchy for structuring test cases. All roles can create and manage folders within a project.

## 2. Key Requirements

### 2.1 Folder Hierarchy
- Unlimited nesting (recursive parent-child structure).
- Each folder belongs to exactly one Project.
- Each test case belongs to exactly one folder.
- Root-level folder exists by default in each project.

### 2.2 Folder CRUD
- **Create**: Any role can create a folder at any level in the hierarchy.
- **Delete**:
  - If folder contains test cases, system prompts a warning.
  - Test cases in deleted folders are moved automatically to the root folder.
  - Deleting a folder deletes all its subfolders recursively.
- **Rename**: Folder names can be edited at any time.
- **Move**: Folders (and their contents) can be moved to another folder.

### 2.3 Firestore Data Model
```
/projects/{projectId}/folders/{folderId}
  parentFolderId: string | null
  name: string
  description: string
  createdAt: timestamp
  createdBy: userId

/projects/{projectId}/testCases/{testCaseId}
  folderId: FK to folder
```

### 2.4 UI Requirements
- **New Folder View in Test Case Screen**:
  - Folder tree panel on the **left** (compact like Windows Explorer).
  - Expand/collapse functionality for nested folders.
  - Context menu on right-click: Add Folder, Delete Folder, Rename Folder.
  - Drag-and-drop support for moving folders and test cases.
- **Test Case List/Grid View**:
  - Collapsible "Folder" column in GRID for filtering test cases by folder.
  - Create Test Case button **enabled only when a folder is selected**.
  - When a folder is selected, new test cases are created under that folder.
- **Test Case Detail Sidebar**:
  - Single-click on test case: Shows details in a sidebar on the right, including test steps (scrollable).
  - Double-click on test case: Opens sidebar in **edit mode**.

### 2.5 Bulk Operations
- Bulk delete of test cases is only available from the GRID view (future feature).
- Future enhancement: Inline editing of test cases directly in GRID view, bulk updates like Excel.

### 2.6 Roles & Permissions
- All roles (APP_ADMIN, ORG_ADMIN, PROJECT_ADMIN, TEST_ENGINEER, ANALYST, VIEWER) can create, rename, and delete folders.
- Only users with `manage_test_cases` permission can create or edit test cases.

## 3. Implementation Notes
- Folders should be stored as a separate collection within a Project in Firestore.
- Test Cases reference folders via `folderId`.
- Root folder is a virtual placeholder with `parentFolderId = null`.
- Tree view should lazy-load folders for performance on large projects.
- Ensure deletion safety net: **Never delete test cases when deleting a folder**.

---

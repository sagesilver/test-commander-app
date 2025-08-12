Here’s the prompt you can give Cursor to implement your **tagging system** for Test Commander, keeping in mind your MVP data model, UI styling rules, and the future backend integration.

---

**Prompt for Cursor:**

> Implement a **tagging system** for **Test Cases** and **Defects** in Test Commander.
> **Requirements:**
>
> ### Data / Mock Backend
>
> * For now, mock tags in local state or a mock API.
> * Each tag: `{ id: string, name: string, color: string }`.
> * Test Cases and Defects can have **one or many tags**.
> * Tags should be stored in an array in each record: `tags: string[]` (array of tag IDs).
> * Maintain a **global tag list** per project so users can reselect existing tags (simulate with static data now).
> * When exporting to CSV/XLSX/HTML, tags should be joined into a **single cell**, separated by commas.
>
> ### UI
>
> * **List/Grid Views:**
>
>   * Display tags as **pills** beside each record.
>   * Each pill = background color of tag, white text, small rounded pill style.
>   * Pills should be clickable (future filter action, but mock for now).
> * **Forms (New/Edit Test Case or Defect):**
>
>   * Multi-select dropdown to add/remove tags from the record.
>   * Dropdown options come from global tag list.
>   * Support adding a **new tag** inline (mock only for now).
> * **Search/Filter Panel:**
>
>   * Allow filtering by one or many tags.
>   * Matching is OR-based (if any selected tag matches the record’s tags, include it).
> * Use **Test-Commander-Forms-Design.md** styles:
>
>   * Match input-field styling and dark theme tokens (`card`, `surface`, `text-foreground`).
>   * Pills should follow the same border radius and color usage conventions as priority pills, but color-coded per tag.
>
> ### Export
>
> * Update CSV/XLSX export functions to include a `Tags` column.
> * Join tags by comma (`,`).
> * In Excel/XLSX, ensure they’re stored in one cell so they remain searchable.
>
> ### Future Integration (Just note in comments)
>
> * Tags will eventually be stored in Firestore under `/projects/{projectId}/tags/{tagId}`.
> * Test Cases & Defects will reference tags by ID.
> * Will integrate with augmented data model in `test_commander_augmented_data_model.md`.
>
> ### Deliverables
>
> * Mock data + UI for:
>
>   * List/Grid view with pills
>   * New/Edit form with multi-select tags
>   * Search/filter by tags
>   * Export CSV/XLSX/HTML with tags column
> * Code should be modular so future backend integration is straightforward.

Latest Update with Final Solution
We want to move to a final solution with persistant global tags within an organisation added by any user directly to the global list, added to test cases on create and edit (and to the global list), and we also want the ability to delete a tag from the global list. Tags deleted from global list can be kept associated against the test case. 
- tags within an organisation will also be available to the Defects (and later Design and Requirements) modules
- Hovering over a tag (in test case or in global list) should show a small grey x in the bottom right which allows you to remove that tag (from the test case or from the global list)
Got it — here’s the **updated Tagging System spec** rewritten to align with the **PRD** and **augmented data model**, removing mock data and making it production-ready with persistent, org-global tags.

---

# **Test Commander – Final Tagging System Specification**

**(Org-Global, Persistent, Firestore-Backed)**

## **1. Purpose**

Implement a persistent tagging system for Test Cases and Defects that:

* Is **global within an Organisation**.
* Can be **added by any signed-in user**.
* Is available for selection in **create/edit** forms.
* Allows **soft deletion** of tags from the global list.
* Keeps tags **linked to records** even after deletion from the global list.
* Is **searchable, filterable, and exportable**.

---

## **2. Data Model**

### **Firestore Structure**

```
/organisations/{orgId}/tags/{tagId}
/organisations/{orgId}/projects/{projectId}/testCases/{testCaseId}
/organisations/{orgId}/projects/{projectId}/issues/{issueId}
```

### **Tag Document**

```json
{
  "id": "string",            // Firestore doc ID
  "name": "string",          // Unique within org (case-insensitive)
  "color": "#RRGGBB",        // Tag color for pill UI
  "createdAt": "timestamp",
  "createdBy": "userId",
  "isDeleted": false,        // Soft delete flag
  "deletedAt": "timestamp?", // Set if isDeleted = true
  "lastUpdatedAt": "timestamp",
  "lastUpdatedBy": "userId"
}
```

> **Soft Delete Rationale:**
> Tags are hidden from selectors but remain resolvable for records that already use them.

---

### **Record Tag Fields**

Applied to **Test Cases** and **Defects**:

```json
"tags": ["tagId1", "tagId2"],
"tags_snapshot": {
  "tagId1": { "id": "tagId1", "name": "UI Bug", "color": "#E53935" },
  "tagId2": { "id": "tagId2", "name": "Critical Path", "color": "#1E88E5" }
}
```

* **`tags`** = IDs of global tags.
* **`tags_snapshot`** = Name/color at assignment time to preserve display/export if tag is later renamed or deleted.

---

## **3. Behaviour & Rules**

### **Creation**

* Any signed-in user in the organisation can:

  * Assign existing tags.
  * Create new tags inline in forms (added to global list immediately).
* Tag names are unique within an organisation (case-insensitive).

### **Editing**

* Org Admins / Project Admins can:

  * Rename tags.
  * Change tag color.

### **Deletion**

* Soft delete only (`isDeleted = true`):

  * Tag disappears from selectors.
  * Records keep the tag via `tags_snapshot`.

### **Display**

* Prefer live tag doc data.
* Fallback to `tags_snapshot` if tag doc is missing or soft-deleted.

---

## **4. UI Requirements**

### **Forms (Create/Edit Test Case/Defect)**

* **Multi-select dropdown** with:

  * Search by name.
  * Color swatch per tag.
  * Inline “Add new tag” option.
* Newly created tags appear instantly in the global list.

### **List/Grid Views**

* Render tags as **pills**:

  * Background = tag color.
  * Text = white.
  * Rounded edges.
  * Consistent with `Test-Commander-Style.md`.

### **Search/Filter**

* Filter panel supports multi-select tags.
* OR-based matching: record is shown if it has **any** selected tag.

### **Export**

* Include `Tags` column in CSV/XLSX/HTML.
* Join tag names with commas in a single cell.
* Use snapshot name if live tag is missing.

---

## **5. Security (Firestore Rules)**

* **Create Tag:** Any authenticated org member.
* **Edit/Delete Tag:** Org Admin or Project Admin.
* **Read Tags:** Any authenticated org member.
* **Assign Tags to Records:** Any user with permission to edit that record.

> Roles/permissions match **RBAC** in augmented model.

---

## **6. Firestore Indexes**

Recommended:

* `isDeleted` (for filtering active tags)
* Composite: `(organisationId, lowerName)` for uniqueness check.

---

## **7. Integration Points**

* **Data Model Alignment:**
  Works with `Test Case` and `Issue` entities in PRD.
* **UI Styling:**
  Pills and dropdowns follow `Test-Commander-Style.md`.
* **Future Use:**
  Extendable to Sprints, Releases, Regression Suites.

---

## **8. Done Criteria**

* ✅ Org-global tag list, persistent in Firestore.
* ✅ Inline tag creation from any Test Case/Defect form.
* ✅ Soft delete with retention of tags on records.
* ✅ Search/filter by tags in lists and grids.
* ✅ Tags included in all exports.

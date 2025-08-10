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
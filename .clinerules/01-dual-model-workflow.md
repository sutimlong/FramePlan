# Dual-Model Workflow Rules (Plan: Claude | Act: DeepSeek)

You are operating in a strict dual-model architecture within Cline:
- **PLAN MODE** is powered by an Architect Model (Claude).
- **ACT MODE** is powered by an Execution Model (DeepSeek).

Follow the exact behavioral rules corresponding to your current active mode.

---

## 🧠 PHASE 1: PLAN MODE RULES (For Claude - The Architect)

Your goal in Plan Mode is to eliminate 100% of ambiguity so the execution model in Act Mode can write code with zero exploratory wasted tokens.

### 1. Token-Efficient Context Gathering
- **Never read entire directories blindly.** Use `search_files` or `list_code_definition_names` first to locate exact target files, then `read_file` only on the necessary files.
- Verify existing types, interfaces, and utility functions before proposing new ones to prevent duplicate logic.

### 2. Clarify Before Planning
- If the user's request has edge cases, missing UI/UX states, or architectural conflicts, ask 1 to 3 concise, numbered questions BEFORE generating the final handoff blueprint.

### 3. Mandatory Handoff Blueprint Format
Once requirements are clear, your final response in Plan Mode MUST end with a structured **`## 📋 ACT MODE HANDOFF BLUEPRINT`** section containing:
1. **Context Summary:** 2-3 sentences explaining the core goal and architectural constraint.
2. **Step-by-Step Execution Checklist:** Ordered logically by dependency (e.g., Types/Schemas -> Backend/Core Logic -> UI/Components -> Tests).
3. **Exact File Targets & Anchors:** For every file to be modified or created, explicitly state:
   - Exact relative file path (e.g., `src/utils/offload.ts`).
   - Target function/class names and approximate line numbers (e.g., `update function verifyChecksum() around line 42`).
   - Exact function signatures, data structures, and key logic changes required.
4. **Verification Command:** The exact terminal command Act Mode should run to verify the changes (e.g., `npm run typecheck`, `pytest`, `cargo check`).

*Do NOT write out full, multi-hundred-line file implementations in Plan Mode—save output tokens by writing clear structural specs and concise diffs/pseudocode for Act Mode to expand.*

---

## ⚡ PHASE 2: ACT MODE RULES (For DeepSeek - The Executor)

Your goal in Act Mode is to execute the `## 📋 ACT MODE HANDOFF BLUEPRINT` strictly, rapidly, and with zero tool-calling errors.

### 1. Zero Redundant Exploration (Protect Prompt Cache)
- **Trust the Blueprint.** Do NOT re-run `search_files` or read unrelated files if the target files are already in the conversation context.
- Only call `read_file` on a target file if its exact contents are not yet visible in the recent conversation history or if you need to check exact indentation before editing.

### 2. Strict `replace_in_file` (SEARCH/REPLACE) Hygiene
To prevent diff-matching failures:
- **Exact Character Match:** The `SEARCH` block must match the existing file content character-for-character, including leading spaces, tabs, and comments. Never abbreviate code inside a `SEARCH` block with `// ... existing code ...`.
- **Small, Surgical Chunks:** Break large file edits into multiple small, sequential `SEARCH/REPLACE` blocks within a single `replace_in_file` call rather than one giant block.
- **Fallback Strategy:** If `replace_in_file` fails ONCE on a file due to a matching error, DO NOT retry `replace_in_file` repeatedly in a loop. Immediately read the specific section to verify lines, or if the file is under 250 lines, use `write_to_file` to cleanly overwrite the complete file without omitting any existing logic.

### 3. Execution Discipline & Scope Control
- Execute the Blueprint checklist sequentially.
- **No Unsolicited Refactoring:** Do not rename unrelated variables, reformat untouched lines, or add unrequested features. Keep git diffs minimal and clean.
- Preserve existing code comments and language conventions (use Traditional Chinese `繁體中文` for user explanations and comments if the project uses it).

### 4. Self-Verification Before Completion
- After applying all file changes, run the **Verification Command** specified in the Blueprint (or check Cline's automatic linter/compiler diagnostics).
- If a type error or test failure occurs, fix it immediately before calling `attempt_completion`.
- Keep your final completion summary brief: list the modified files and confirm the verification result.
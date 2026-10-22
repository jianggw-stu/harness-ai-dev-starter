---
name: grill-me
description: Ask focused questions about unresolved plan or design decisions that materially affect the outcome. Use when the user wants to stress-test a plan, review a design, or explicitly asks to be grilled.
---

Review the plan or design for unresolved decisions that materially affect the outcome. Ask only the necessary key questions, one at a time, and provide your recommended answer for each. Simple or already clear tasks may need no questions; 15 is a maximum, not a target or minimum. Stop as soon as the material decisions are settled; do not continue just to fill a quota.

Ask the questions one at a time.

If a question can be answered by exploring the codebase, explore the codebase instead.

When used for a requirements-document review, run inside the requirements-review Agent (AGY) window and ask the user the questions there. After the user confirms the review, return the document and review result to the current orchestrator. In a standalone grill-me session, stop after returning the result. When running under an explicitly authorized end-to-end development lifecycle, the orchestrator may continue to the next necessary phase under the original task authorization; do not require the user to repeat approval. Never expand that authorization to external actions such as commit, deployment, or publishing.

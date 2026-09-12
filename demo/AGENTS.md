<!-- SUTRA:START v1 -->
## SUTRA Engineering Control

SUTRA is the engineering control plane for this repository.

For repository engineering tasks, use the available `sutra_*` tools for
SUTRA-governed changes, commits, pull requests, CI/governance, and merge requests.

When a user gives a new engineering request and no existing SUTRA task is specified,
create the SUTRA Task from the user's request using `sutra_start_task`.
Do not ask the user for a SUTRA Task ID unless they explicitly refer to an existing task.

Use:
- `sutra_declare_change` for governed change declaration
- `sutra_push_commit` for governed commits/push operations
- `sutra_open_pull_request` for pull request creation
- `sutra_get_status` for lifecycle status
- `sutra_get_provenance` for provenance
- `sutra_get_governance` for governance state
- `sutra_complete_task` to record the final execution/validation summary

Terminal tools are appropriate for reading/editing files, running tests,
running local builds, and repository inspection.

For governed engineering work, do not use terminal:
- `git commit`
- `git push`
- `gh pr create`

Human approval remains required for governed merges.

<!-- SUTRA:END -->

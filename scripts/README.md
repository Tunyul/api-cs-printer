# Scripts

This folder contains utility scripts used by developers and operators.

Guidelines:
- Files that are destructive (truncate/remove data) require setting `SAFE_RUN=1` in the environment to run.
- Do not commit scripts with hard-coded credentials.
- Run scripts from project root: `node scripts/<script>.js`

Common scripts:
- seed_*: data seeding scripts
- reset-*: reset DB scripts
- recalc-*: recalculation utilities
- truncate-*: destructive operations (see safety notes)

Safety example:
```
if (!process.env.SAFE_RUN) {
  console.error('This script is destructive. Set SAFE_RUN=1 to run.');
  process.exit(1);
}
```

# PR fixture: renovate bumps yaml 2.3.4 to 2.4.1

Synthetic dependency PR opened by a bot. The only change is the version in
`package.json` and the lockfile. The repository uses `parse` and `stringify`
from the package in two files. The release notes for 2.4.0 and 2.4.1 add an
optional `stringKeys` option and fix a bug in comment preservation; no exported
symbol, default or engine range changed. The declared Node engine range is
unchanged and satisfied. Nothing else in the repository is affected.

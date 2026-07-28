# GitHub Packages Workflows

This folder contains the manual workflows used to publish and clean up the
`@semoss/*` library packages in GitHub Packages.

## Published packages

These workflows operate on the six reusable libraries under `libs/`:

- `@semoss/i18n`
- `@semoss/sdk`
- `@semoss/ui`
- `@semoss/shared`
- `@semoss/renderer`
- `@semoss/chat`

## Publish workflow

Workflow file: `publish-github-packages.yml`

Inputs:

- `branch`: git branch to publish from
- `channel`: prerelease channel and npm dist-tag, for example `preview` or `dev`

What it does:

1. Checks out the requested branch.
2. Rewrites all six package versions to a unique branch-specific prerelease.
3. Rewrites internal `@semoss/*` dependency versions to that same published set.
4. Builds the packages that emit `dist/` output.
5. Publishes the packages to GitHub Packages in dependency order.

Version format:

- Base version `1.0.0-beta.43`
- Published version `1.0.0-beta.43.preview.my-branch.152.1`

That version format prevents collisions across branches and reruns.

Authentication:

- Publishing uses the workflow `GITHUB_TOKEN` with `packages:write` permission.
- The package scope `@semoss` must match the GitHub owner that will own the
  published packages.

## Delete workflow

Workflow file: `delete-github-packages.yml`

Inputs:

- `branch`: branch whose published package versions should be removed
- `channel`: channel used when the versions were published
- `dry_run`: when `true`, only lists matching versions; when `false`, deletes them

How matching works:

- The delete workflow sanitizes the branch and channel the same way as the
  publish workflow.
- It deletes package versions whose version string contains
  `channel.branch.runNumber.runAttempt` prefix data, which is enough to target
  versions created from a given branch/channel pair.

Authentication:

- Deletion uses the `SEMOSS_GITHUB_PAT` repository secret.
- That token should have package admin/delete access for the GitHub owner that
  hosts the packages.

Recommended usage:

1. Run the delete workflow once with `dry_run: true` to verify the matches.
2. Run it again with `dry_run: false` to actually remove those versions.

## Downstream installs

Other repositories that consume these packages need `.npmrc` entries like:

```ini
@semoss:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Then they can install the published versions with `pnpm add`.
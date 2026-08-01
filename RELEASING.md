# Releasing

Two things ship from this repo: the package `@apostel/bedrock` on npm, and the
documentation at <https://bedrock.sams.land>. Both are automated; both need a
one-time setup that only you can do, because both need credentials.

Everything marked **you** below is a manual step outside this repository.

---

## Part 1 — npm

### One-time

1. **Own the scope.** `@apostel` must exist and be yours.

   ```bash
   npm login
   npm org create apostel        # skip if @apostel is your username
   npm whoami                    # confirm
   ```

   If `@apostel` is already taken by someone else, the name in `package.json`
   has to change — it is the only place it appears.

2. **Choose how CI authenticates.** Two options, and the first is better:

   **Trusted publishing (OIDC).** No token to leak or rotate. On npmjs.com →
   the package's *Settings* → *Trusted publishers*, add:

   | field | value |
   | --- | --- |
   | Repository | `Sam-Apostel/bedrock-ui` |
   | Workflow | `.github/workflows/release.yml` |
   | Environment | *(leave empty)* |

   A package must exist before it can have settings, so this needs one manual
   `npm publish` first — see *First release* below.

   **Automation token.** Simpler to set up, worse to live with. npmjs.com →
   *Access Tokens* → *Generate* → **Automation** (it bypasses 2FA, which a
   *Publish* token does not). Then in GitHub → *Settings* → *Secrets and
   variables* → *Actions* → *New repository secret*, name it `NPM_TOKEN`.

   `.github/workflows/release.yml` already reads `NPM_TOKEN` and already
   requests `id-token: write`, so either route works with no edit.

3. **Provenance is already on.** `package.json` sets
   `publishConfig.provenance: true`, which makes npm attach a signed statement
   linking the tarball to the commit and workflow that built it. It only works
   from CI, which is why the first manual publish needs `--no-provenance`.

### First release

The package does not exist yet, so this one is by hand:

```bash
npm version 0.1.0            # writes package.json, commits, tags v0.1.0
npm run verify               # format, lint, types, graph, build, 102 tests
npm publish --no-provenance  # access: public is already in package.json
git push --follow-tags
```

Then go back and add the trusted publisher from step 2.

### Every release after that

```bash
npm version patch|minor|major
git push --follow-tags
```

The tag is the trigger. `.github/workflows/release.yml` runs `npm ci`, installs
Chromium, runs the whole verify chain, and publishes — so a release that fails a
test does not go out.

### Before the first release, decide these

- **The scope name.** `@apostel/bedrock` is what the README, the docs and all
  24 registry items say. Changing it later means changing the registry too,
  which people will have already installed.
- **`0.1.0`, not `1.0.0`.** Several things in `docs/gaps.md` are open questions
  whose answers change public API. Semver before 1.0 lets those move.
- **Whether `Dialog` keeps its current bundle.** `npm pack --dry-run` shows what
  ships: `dist/`, `README.md`, `LICENSE`. No source maps of the tests, no
  registry, no docs.

---

## Part 2 — bedrock.sams.land

The site is built by `npm run docs:build` into `site/`, and deployed by
`.github/workflows/docs.yml` on every push to `main`. It serves the docs, the
live compat page, and `r/` — so the shadcn registry and the documentation are
the same host.

### One-time

1. **Turn on Pages with Actions as the source.** GitHub → *Settings* → *Pages* →
   *Build and deployment* → *Source*: **GitHub Actions**. Not "Deploy from a
   branch" — the workflow uploads an artifact, and the branch option ignores it.

2. **Point DNS at GitHub.** In whatever manages `sams.land`, add:

   | type | name | value |
   | --- | --- | --- |
   | `CNAME` | `bedrock` | `sam-apostel.github.io` |

   A subdomain takes a `CNAME` record. (An apex domain would need four `A`
   records instead; this is not that.) The value is the *user* Pages host, with
   no repository path and no trailing slash.

3. **Tell GitHub the domain.** *Settings* → *Pages* → *Custom domain*, enter
   `bedrock.sams.land`, save. The build already writes a `CNAME` file into
   `site/`, so this survives every deploy.

4. **Wait for the certificate, then force HTTPS.** GitHub issues one once DNS
   resolves — usually minutes, occasionally an hour. When *Enforce HTTPS* stops
   being greyed out, tick it.

### Checking it worked

```bash
dig +short bedrock.sams.land          # → sam-apostel.github.io, then an IP
curl -sI https://bedrock.sams.land | head -1
curl -s https://bedrock.sams.land/r/dialog.json | head -c 80
```

The third one matters most: if it 404s, the registry URLs in the docs are wrong
and `npx shadcn add` will fail for everyone.

### Adding a page

Write markdown in `docs/`. It is picked up automatically and gets a page at
`/<name>.html`. To put it in the sidebar, add a line to `NAV` in
`scripts/build-docs.mjs`.

`docs/compat.html` is copied verbatim rather than rendered — it feature-detects
in the reader's browser, and a generator wrapping it would break that.

---

## What is deliberately not automated

- **Version bumps.** `npm version` is a human decision; nothing infers semver
  from commit messages here.
- **Changelog entries.** `CHANGELOG.md` is written, not generated. It says what
  changed for a consumer, which a commit list does not.
- **The `main` branch.** There is no release branch and no backporting. Tag what
  is on `main`.

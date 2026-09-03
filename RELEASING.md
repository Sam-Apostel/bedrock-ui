# Releasing

Two things ship from this repo, both automated, both needing a one-time setup
that only you can do because both need credentials.

| Ships | Where | Driven by |
| --- | --- | --- |
| `@apostel/bedrock` | npm | changesets, on merge to `main` |
| The documentation | <https://bedrock.sams.land> | GitHub Pages, on push to `main` |

Everything marked **you** below is a manual step outside this repository.

---

## Part 1: npm

The setup below is done and `0.1.0` is published; this is the record of how, and
what to repeat. Roughly ten minutes from scratch.

### 1. Own the scope

`@apostel` must exist and be yours.

```bash
npm login
npm org create apostel        # skip if @apostel is already your username
npm whoami
```

`@apostel/bedrock` is claimed and published. The name appears in the README, the
docs, the agent skill and all 24 registry items, so changing it now would break
everyone who has installed one, so it is settled.

### 2. Give CI a token

npmjs.com → *Access Tokens* → *Generate New Token* → **Granular Access Token**:

| field | value |
| --- | --- |
| Expiration | your call; it must have one |
| Packages and scopes | *Read and write*, limited to `@apostel/*` |
| Bypass 2FA | **ticked**, because without it a CI publish fails once 2FA is on |

Then GitHub → *Settings* → *Secrets and variables* → *Actions* → *New
repository secret*, named `NPM_TOKEN`.

### 3. Let Actions open pull requests

GitHub → *Settings* → *Actions* → *General* → *Workflow permissions* → tick
**Allow GitHub Actions to create and approve pull requests**.

> Without it the release workflow runs, the tests pass, and opening the version
> PR fails at the last step, which reads like a broken workflow rather than a
> missing checkbox. It cost three failed runs before anyone spotted it.

### 4. Push, then merge the PR it opens

That is the release.

```bash
git push origin main
```

The workflow runs the whole verify chain, sees the queued changesets, and opens
a **Version packages** PR that bumps `0.0.0` → `0.1.0` and writes
`CHANGELOG.md`. Merge it. The workflow runs again, finds nothing queued, and
publishes.

Watch it under the *Actions* tab; the publish step is the one that takes about
two minutes, because it runs the full Playwright suite again through
`prepublishOnly` before npm sees anything.

### Every release after that

Identical, minus the setup. When you change something a consumer would notice,
add a changeset in the same PR:

```bash
npm run changeset
```

It asks for the bump (patch, minor or major) and for a description. Write that
for someone *using* the package, not for someone reading the diff; it becomes
the changelog entry verbatim. Tests, docs and internal refactors need no
changeset.

From there:

1. Merge your PR to `main`.
2. The workflow opens a **Version packages** PR with the bump and the changelog.
3. Merge that. The workflow runs again, finds nothing queued, and publishes.

Nobody types a version number, and nothing ships without a note saying why.
`npx changeset status` shows what is queued without changing anything.

### Optional: drop the token later

Once the package exists on npm, you can switch to **trusted publishing** and
delete `NPM_TOKEN` entirely: no credential to leak, rotate, or find expired at
an inconvenient moment.

npmjs.com → the package → *Settings* → *Trusted Publisher*:

| field | value |
| --- | --- |
| Repository | `Sam-Apostel/bedrock-ui` |
| Workflow | `release.yml` |
| Environment | *(leave empty)* |

The workflow already requests `id-token: write` and already upgrades npm, which
matters: trusted publishing needs npm ≥ 11.5.1 and Node ≥ 22.14, and Node 22
ships npm 10.x. Without that upgrade the OIDC exchange never happens and the
publish quietly falls back to looking for a token that is no longer there.

Delete the secret once a publish has succeeded without it. The workflow reads
the secret through `NODE_AUTH_TOKEN`, and an unset secret is an empty string
that npm ignores, so nothing needs editing.

### Why changesets rather than a tag

A tag encodes a decision, "this is a minor", at the moment you release, which
is the moment you have least context. A changeset encodes it in the PR that
caused it, when you still remember whether the prop rename was breaking. The
changelog then writes itself from those notes rather than from commit subjects,
which is why `CHANGELOG.md` here is one heading and a pointer.

### Before you publish, decide these

- **The scope name**, as above. It is the one thing that is expensive to change
  after the fact.
- **`0.1.0`, not `1.0.0`.** Several things in [known gaps](./docs/known-gaps.md) are open questions
  whose answers change public API. Semver before 1.0 leaves room for them, and
  the queued changeset is a `minor`, which from `0.0.0` gives `0.1.0`.
- **What ships.** `npm pack --dry-run` lists it: `dist/`, `skills/`,
  `README.md`, `LICENSE`. No tests, no registry sources, no docs.

---

## Part 2: bedrock.sams.land

The site is built by `npm run docs:build` into `site/`, and deployed by
`.github/workflows/docs.yml` on every push to `main`. It serves the docs, the
live compat page, and `r/`, so the shadcn registry and the documentation are
the same host.

### One-time

1. **Turn on Pages with Actions as the source.** GitHub → *Settings* → *Pages* →
   *Build and deployment* → *Source*: **GitHub Actions**. Not "Deploy from a
   branch": the workflow uploads an artifact, and the branch option ignores it.

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
   resolves, usually minutes and occasionally an hour. When *Enforce HTTPS* stops
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

The browser-support matrix is generated from `docs/compat.json`, which carries
the minimum versions from MDN's compat data. `docs/compat.md` embeds it with an
HTML comment naming `support-matrix`, which written out here would expand into the
matrix itself, which is how it first got embedded in this page by accident. The
live column is measured in the reader's own browser by an inline script.

---

## What is deliberately not automated

- **Deciding the bump.** Changesets asks; it does not infer semver from commit
  messages. Whether a prop rename is breaking is a judgement, and the person who
  made the change is the one who knows.
- **Merging the version PR.** That is the release. Leaving it open is how you
  batch several changes into one version.
- **Branching.** There is no release branch and no backporting. What is on
  `main` is what ships.

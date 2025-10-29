# OIDC Trusted Publishing Setup

This project uses **OIDC Trusted Publishing** for secure, token-free npm package publishing via GitHub Actions.

## Overview

**Trusted Publishing** allows GitHub Actions to authenticate with npm using OpenID Connect (OIDC) instead of long-lived authentication tokens. This:
- ✅ Eliminates token expiration issues (no more 90-day token rotation)
- ✅ Enhances security (no stored credentials)
- ✅ Provides audit trails (GitHub manages authentication)
- ✅ Automatically generates provenance statements

## Initial Setup (Required)

### Step 1: Perform First Publish with Token

The GitHub Actions workflow is currently configured with `NPM_TOKEN` for the initial publish. This is necessary because npm requires a package to exist before configuring trusted publishers.

1. **Make a commit with a conventional message**:
   ```bash
   git commit -m "feat: initial release"
   ```

2. **Push to main**:
   ```bash
   git push origin main
   ```

3. **Monitor the workflow** at: https://github.com/mikegreiling/run-elsewhere/actions

The first publish will use your NPM token stored in GitHub secrets.

### Step 2: Configure Trusted Publisher on npm

Once the package is published, configure GitHub Actions as a trusted publisher on npmjs.com.

1. **Go to package settings**:
   - Visit: https://npmjs.com/package/run-elsewhere/access

2. **Add trusted publisher** (Manage Publishing):
   - Click "Add trusted publisher"
   - Select **GitHub Actions**
   - Fill in:
     - **GitHub owner**: `mikegreiling`
     - **Repository name**: `run-elsewhere`
     - **Workflow file name**: `release.yml`
     - **Environment name**: (leave blank to allow any environment)
   - Click **Add**

3. **Verify** it appears in the list of trusted publishers

### Step 3: Remove NPM Token Secret (Optional but Recommended)

Once trusted publishing is configured, you can remove the NPM_TOKEN secret for even tighter security:

```bash
gh secret remove NPM_TOKEN -R mikegreiling/run-elsewhere
```

If you remove it, update `.releaserc.json` to disable the npm plugin's token requirement. However, semantic-release will still work because npm CLI will use OIDC.

## How It Works

### With OIDC Trusted Publishing

```
1. Push commit to main
   ↓
2. GitHub Actions workflow runs
   ↓
3. GitHub generates OIDC token for this workflow run
   ↓
4. npm CLI uses OIDC token (no NPM_TOKEN needed!)
   ↓
5. npm registry verifies:
   - Request came from GitHub Actions
   - Repository is mikegreiling/run-elsewhere
   - Workflow file is release.yml
   ↓
6. Package published with provenance
```

### Why No Token Needed?

The GitHub Actions environment automatically provides OIDC identity through `ACTIONS_ID_TOKEN_REQUEST_URL` and `ACTIONS_ID_TOKEN_REQUEST_TOKEN` environment variables. npm CLI 11.5.1+ uses these automatically.

## Verification

### Check OIDC is Working

After the first publish with token, make another commit:

```bash
git commit --allow-empty -m "chore: test OIDC publishing"
git push origin main
```

Watch the workflow. If it succeeds **without using the NPM_TOKEN**, then OIDC is working!

You can verify in the workflow logs:
- Look for npm messages about OIDC
- Check npm registry for new version published

### Verify Provenance

Each package published with OIDC includes provenance statements. Check them:

```bash
npm view run-elsewhere provenanceFile
```

Or visit: https://npmjs.com/package/run-elsewhere/provenance

## Troubleshooting

### "trusted publisher not found"

**Cause**: Trusted publisher not configured on npm, or settings don't match.

**Solution**:
1. Check npm package settings at https://npmjs.com/package/run-elsewhere/access
2. Verify GitHub owner, repository, and workflow file name match exactly
3. Ensure workflow has `id-token: write` permission (already in release.yml)

### "npm: error ERR! code E401"

**Cause**: OIDC token not being generated or npm version too old.

**Solution**:
1. Verify npm version is 11.5.1+
   - Workflow includes: `npm install -g npm@latest` (already present)
2. Check GitHub Actions permissions include `id-token: write` (already present)

### Still need token for CI/CD?

If you're installing private packages in CI/CD, you can use a **read-only token**:

```bash
npm token create --read-only
```

This token is only for *installing* private packages, not publishing. Set it as `NPM_READ_TOKEN` if needed.

## Workflow Behavior

### With NPM_TOKEN configured:

```yaml
- name: Release
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}  # Used by semantic-release
  run: pnpm semantic-release
```

The `NPM_TOKEN` is available but npm CLI will prefer OIDC if both are available.

### Transitioning Away from NPM_TOKEN

When you're confident OIDC is working:

1. Remove the secret:
   ```bash
   gh secret remove NPM_TOKEN -R mikegreiling/run-elsewhere
   ```

2. The workflow will still work because semantic-release and npm CLI will use OIDC

## Additional Resources

- [npm Trusted Publishers Docs](https://docs.npmjs.com/trusted-publishers)
- [GitHub OIDC Documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [npm Provenance Documentation](https://docs.npmjs.com/generating-provenance-statements)

## References

- npm 11.5.1+ required for OIDC support
- GitHub Actions automatically provides OIDC tokens for runner environments
- Trusted publishers eliminate the need for token rotation policies

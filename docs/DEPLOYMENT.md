# Deploying Han Framework Documentation to GitHub Pages

This guide explains how to deploy the VitePress documentation to GitHub Pages.

## Prerequisites

- A GitHub repository for your project
- Node.js and npm installed locally
- Git configured and repository pushed to GitHub

## Deployment Options

### Option 1: Automatic Deployment with GitHub Actions (Recommended)

This method automatically deploys your documentation whenever you push to the main branch.

#### Step 1: Configure GitHub Pages

1. Go to your GitHub repository
2. Click on **Settings** → **Pages**
3. Under **Build and deployment**:
   - Source: Select **GitHub Actions**
4. Save the settings

#### Step 2: Update Base Path (if needed)

If deploying to a project repository (e.g., `username.github.io/repo-name`), update the base path in `.vitepress/config.mts`:

```typescript
export default defineConfig({
  base: '/your-repo-name/', // e.g., '/han-framework/'
  // ... rest of config
})
```

If deploying to a user/organization site (e.g., `username.github.io`), use:

```typescript
export default defineConfig({
  base: '/',
  // ... rest of config
})
```

#### Step 3: Push to GitHub

The GitHub Actions workflow (`.github/workflows/deploy-docs.yml`) will automatically:

1. Build the documentation
2. Deploy to GitHub Pages
3. Make it available at `https://username.github.io/repo-name/`

```bash
git add .
git commit -m "chore: setup GitHub Pages deployment"
git push origin main
```

#### Step 4: Verify Deployment

1. Go to your repository's **Actions** tab
2. Wait for the "Deploy VitePress Documentation" workflow to complete
3. Visit your documentation at `https://username.github.io/repo-name/`

### Option 2: Manual Deployment

If you prefer to deploy manually:

#### Step 1: Build the documentation

```bash
cd docs
npm run docs:build
```

#### Step 2: Deploy using gh-pages

Install gh-pages:

```bash
npm install -D gh-pages
```

Add deploy script to `docs/package.json`:

```json
{
  "scripts": {
    "docs:dev": "vitepress dev",
    "docs:build": "vitepress build",
    "docs:preview": "vitepress preview",
    "docs:deploy": "gh-pages -d .vitepress/dist"
  }
}
```

Deploy:

```bash
npm run docs:deploy
```

#### Step 3: Configure GitHub Pages

1. Go to **Settings** → **Pages**
2. Under **Build and deployment**:
   - Source: Select **Deploy from a branch**
   - Branch: Select **gh-pages** → **/ (root)**
3. Save and wait a few minutes

Your site will be available at `https://username.github.io/repo-name/`

## Troubleshooting

### 404 Error on Assets

If you see 404 errors for CSS/JS files, check your `base` configuration:

```typescript
// For project repo (username.github.io/repo-name)
base: '/repo-name/'

// For user/org site (username.github.io)
base: '/'
```

### Build Fails in GitHub Actions

Check the Actions log for errors. Common issues:

1. **Missing dependencies**: Ensure `package-lock.json` is committed
2. **Node version**: Workflow uses Node 20, ensure compatibility
3. **Build errors**: Test locally with `npm run docs:build`

### Changes Not Appearing

1. Clear your browser cache
2. Wait a few minutes for GitHub Pages to update
3. Check the Actions tab to ensure deployment succeeded

## Custom Domain

To use a custom domain:

1. Add a `docs/public/CNAME` file with your domain:
   ```
   docs.yoursite.com
   ```

2. Configure DNS:
   - Add a CNAME record pointing to `username.github.io`

3. Go to **Settings** → **Pages**
   - Enter your custom domain
   - Enable "Enforce HTTPS"

## Local Preview

Test the production build locally:

```bash
cd docs
npm run docs:build
npm run docs:preview
```

Visit `http://localhost:4173` to preview.

## Updating Documentation

Simply push changes to the main branch:

```bash
git add .
git commit -m "docs: update documentation"
git push origin main
```

GitHub Actions will automatically rebuild and redeploy.

## Resources

- [VitePress Deployment Guide](https://vitepress.dev/guide/deploy)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

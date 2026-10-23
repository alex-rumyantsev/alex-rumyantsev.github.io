# Renew the sync token

The workflow `.github/workflows/sync-projects.yml` uses the secret `PORTFOLIO_SYNC_TOKEN` to read private repositories. The token expires after 90 days. When it expires, the workflow fails and `data/projects.json` stops updating.

## Renew

1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.
2. Token name: `portfolio-sync`. Resource owner: `alex-rumyantsev`. Expiration: 90 days.
3. Repository access: "Only select repositories", then select every private repository shown on the site.
4. Repository permissions: add "Metadata" (Read-only). Without any permission, GitHub saves the token as public-only.
5. Click "Generate token" and copy it. GitHub shows it only once.
6. Repository `alex-rumyantsev.github.io` → Settings → Secrets and variables → Actions → `PORTFOLIO_SYNC_TOKEN` → update the value → save.
7. Actions → "sync projects" → "Run workflow". The run must be green.
8. Delete the old token in Developer settings. Set a calendar reminder one week before the new expiry date.

## Show or hide a repository

Add or remove the topic `portfolio` on the repository.

## Never

Never put the token in code, issues or chat.

<p align="center">
  <h3 align="center">gist-bird</h3>
  <p align="center">Update a pinned gist to contain the latest tweets of a user</p>
</p>

---

## ⚠️ X (Twitter) API v2 — Requirements

This project now uses the **X API v2** (formerly Twitter API v2). The legacy v1.1 `statuses/user_timeline` endpoint is no longer accessible on free-tier apps.

To read another user's public timeline you need **at minimum the [X API Basic plan](https://developer.twitter.com/en/products/twitter-api)** ($100 / month), which provides:
- A **Bearer Token** for app-only authentication
- Up to 10,000 tweet reads per month

If you only need to read your **own** account's tweets you can use **OAuth 1.0a** credentials (Consumer Key/Secret + Access Token/Secret) with an app that has the appropriate read permissions.

---

## Setup

### Prep work

1. Create a new public GitHub Gist at https://gist.github.com/ — note the ID in the URL.
2. Generate a GitHub access token with the `gist` scope: https://github.com/settings/tokens/new
3. Create an app on the **X Developer Portal**: https://developer.twitter.com/en/apps/create
4. From the app dashboard, copy the **Bearer Token** (recommended) **or** generate an Access Token & Secret if you want to use OAuth 1.0a.

### Project setup

1. Fork this repo.
2. Edit the environment variables in `.github/workflows/main.yml` (the canonical workflow, runs every 5 min):

   > **Note:** The repo also contains a legacy reference copy at `.github/workflow/schedule.yml` (configured for every 10 min). GitHub Actions will **not** load it automatically from that path; if you want to use it, move or copy it into `.github/workflows/` and update it in the same way.

   - **TWITTER_USER:** The handle of the X account to track (without `@`).
   - **GIST_ID:** The ID portion from your gist URL: `https://gist.github.com/<user>/`**`<gist-id>`**.

3. Go to the repo **Settings > Secrets and variables > Actions** and add:

   | Secret | Description |
   |---|---|
   | `GH_TOKEN` | GitHub access token (gist scope) |
   | `TWITTER_BEARER_TOKEN` | X app Bearer Token (**recommended**) |
   | `TWITTER_CONSUMER_KEY` | *(OAuth 1.0a alternative)* Consumer API key |
   | `TWITTER_CONSUMER_SECRET` | *(OAuth 1.0a alternative)* Consumer secret |
   | `TWITTER_ACCESS_TOKEN_KEY` | *(OAuth 1.0a alternative)* Access token |
   | `TWITTER_ACCESS_TOKEN_SECRET` | *(OAuth 1.0a alternative)* Access token secret |

   > **Note:** Set either `TWITTER_BEARER_TOKEN` **or** all four OAuth 1.0a secrets — you don't need both.


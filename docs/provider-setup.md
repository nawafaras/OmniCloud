# Provider credential setup

This guide explains how to create credentials for the cloud providers supported by OmniCloud.

Keep this guide separate from the main `README.md` so the README stays short while provider-specific setup can stay detailed.

## Redirect URIs used by OmniCloud

Use these callback URLs while running OmniCloud locally:

| Provider | Redirect URI |
| --- | --- |
| Google Drive | `http://localhost:8787/api/accounts/google/callback` |
| OneDrive | `http://localhost:8787/api/accounts/onedrive/callback` |
| Dropbox | `http://localhost:8787/api/accounts/dropbox/callback` |
| MEGA | Not applicable |

If you change the API port or deploy the API to another domain, update the redirect URIs in both the provider dashboard and `backend/.env`.

## Environment variables

Add the credentials to `backend/.env`:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8787/api/accounts/google/callback

ONEDRIVE_CLIENT_ID=
ONEDRIVE_CLIENT_SECRET=
ONEDRIVE_TENANT_ID=common
ONEDRIVE_REDIRECT_URI=http://localhost:8787/api/accounts/onedrive/callback

DROPBOX_CLIENT_ID=
DROPBOX_CLIENT_SECRET=
DROPBOX_REDIRECT_URI=http://localhost:8787/api/accounts/dropbox/callback
```

MEGA does not use OAuth client credentials in OmniCloud. MEGA accounts are connected from the app UI using email, password, and optional 2FA code.

## Google Drive

### 1. Open Google Cloud Console

Open:

`https://console.cloud.google.com/`

Sign in with the Google account that will own the OAuth app.

### 2. Create or select a project

1. Click the project selector in the top bar.
2. Click **New Project** if you do not already have one.
3. Name it, for example `OmniCloud Local`.
4. Open the project.

### 3. Enable the Google Drive API

1. Go to **APIs & Services** → **Library**.
2. Search for **Google Drive API**.
3. Open it.
4. Click **Enable**.

### 4. Configure the OAuth consent screen

1. Go to **APIs & Services** → **OAuth consent screen**.
2. Choose **External** for personal/local use unless you are using a Google Workspace internal app.
3. Fill the required app information.
4. Add yourself as a test user if the app is in testing mode.
5. Save the consent screen.

### 5. Create OAuth client credentials

1. Go to **APIs & Services** → **Credentials**.
2. Click **Create Credentials** → **OAuth client ID**.
3. Choose **Web application**.
4. Name it, for example `OmniCloud API Local`.
5. Under **Authorized redirect URIs**, add:

   ```text
   http://localhost:8787/api/accounts/google/callback
   ```

6. Click **Create**.

### 6. Copy values into `.env`

Google shows a **Client ID** and **Client secret**.

Use them like this:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8787/api/accounts/google/callback
```

### Notes

- The redirect URI must match exactly.
- If the OAuth app is in testing mode, only test users can connect.
- Do not commit `.env`.

## OneDrive

OneDrive uses Microsoft Entra ID app registrations.

### 1. Open Microsoft Entra admin center

Open:

`https://entra.microsoft.com/`

You can also reach app registrations from Azure Portal:

`https://portal.azure.com/`

### 2. Create an app registration

1. Go to **Applications** → **App registrations**.
2. Click **New registration**.
3. Name it, for example `OmniCloud Local`.
4. For **Supported account types**, choose one of:
   - **Accounts in any organizational directory and personal Microsoft accounts** for broad local testing.
   - **Personal Microsoft accounts only** if you only need personal OneDrive accounts.
5. Under **Redirect URI**, choose **Web**.
6. Add:

   ```text
   http://localhost:8787/api/accounts/onedrive/callback
   ```

7. Click **Register**.

### 3. Copy the client ID

On the app overview page, copy:

- **Application (client) ID** → `ONEDRIVE_CLIENT_ID`
- **Directory (tenant) ID** → can be used as `ONEDRIVE_TENANT_ID`

For personal accounts and broad testing, `ONEDRIVE_TENANT_ID=common` is usually easiest.

### 4. Create a client secret

1. Open **Certificates & secrets**.
2. Click **New client secret**.
3. Add a description, for example `OmniCloud local secret`.
4. Choose an expiration.
5. Click **Add**.
6. Copy the **Value** immediately.

Use the **Value** as `ONEDRIVE_CLIENT_SECRET`, not the Secret ID.

### 5. Configure API permissions

1. Open **API permissions**.
2. Click **Add a permission**.
3. Choose **Microsoft Graph**.
4. Choose **Delegated permissions**.
5. Add file-related permissions needed by OmniCloud, such as:

   ```text
   Files.ReadWrite.All
   offline_access
   User.Read
   ```

6. Save the permissions.

### 6. Copy values into `.env`

```env
ONEDRIVE_CLIENT_ID=your_application_client_id
ONEDRIVE_CLIENT_SECRET=your_client_secret_value
ONEDRIVE_TENANT_ID=common
ONEDRIVE_REDIRECT_URI=http://localhost:8787/api/accounts/onedrive/callback
```

### Notes

- Use the client secret **Value**, not the Secret ID.
- If you use a specific tenant ID, only accounts allowed by that tenant configuration can connect.
- Some organization accounts may require admin consent.

## Dropbox

Dropbox uses an app key and app secret. In OmniCloud they map to:

- **App key** → `DROPBOX_CLIENT_ID`
- **App secret** → `DROPBOX_CLIENT_SECRET`

### 1. Open Dropbox App Console

Open:

`https://www.dropbox.com/developers/apps`

Sign in with the Dropbox account that will own the app.

### 2. Create an app

1. Click **Create app**.
2. For **Choose an API**, select **Scoped access**.
3. For access type, choose one:
   - **Full Dropbox** if OmniCloud should access the user's whole Dropbox.
   - **App folder** if OmniCloud should only access a dedicated app folder.
4. Give the app a unique name, for example `OmniCloud Local`.
5. Click **Create app**.

### 3. Add redirect URI

1. Open the app **Settings** tab.
2. Find **OAuth 2** → **Redirect URIs**.
3. Add:

   ```text
   http://localhost:8787/api/accounts/dropbox/callback
   ```

4. Save or click **Add**.

### 4. Copy app key and app secret

In the **Settings** tab:

- Copy **App key** into `DROPBOX_CLIENT_ID`.
- Click **Show** near **App secret**, then copy it into `DROPBOX_CLIENT_SECRET`.

### 5. Enable permissions

1. Open the **Permissions** tab.
2. Enable these scopes:

   ```text
   account_info.read
   files.metadata.read
   files.content.read
   files.content.write
   ```

3. Click **Submit** if Dropbox asks you to submit permission changes.

### 6. Copy values into `.env`

```env
DROPBOX_CLIENT_ID=your_dropbox_app_key
DROPBOX_CLIENT_SECRET=your_dropbox_app_secret
DROPBOX_REDIRECT_URI=http://localhost:8787/api/accounts/dropbox/callback
```

### Notes

- Dropbox calls the OAuth client ID an **App key**.
- The redirect URI must match exactly.
- OmniCloud requests offline access so it can keep using a refresh token.

## MEGA

MEGA does not require creating a developer OAuth application for OmniCloud.

### How MEGA connection works

1. Start OmniCloud.
2. Open the **Penyimpanan** page.
3. Click **Hubungkan** → **MEGA**.
4. Enter:
   - MEGA email
   - MEGA password
   - 2FA code if your account uses two-factor authentication
5. Submit the form.

OmniCloud stores the MEGA session and credentials encrypted in the local SQLite database so it can sync and perform file operations later.

### Notes

- There is no `MEGA_CLIENT_ID` or `MEGA_CLIENT_SECRET` for this implementation.
- Keep your local `.env` and SQLite database private.
- If MEGA returns `EAGAIN`, it means MEGA is temporarily busy or unavailable. Try connecting again later.

## After editing `.env`

Restart the API server so the new values are loaded:

```text
npm run dev
```

Then open OmniCloud and connect accounts from the **Penyimpanan** page.

## Troubleshooting

### Redirect URI mismatch

If a provider says the redirect URI is invalid, verify that the value in the provider dashboard exactly matches the value in `.env`.

### Missing client secret

For OneDrive, use the client secret **Value**, not the Secret ID.

For Dropbox, use **App secret**, not the app name.

### Google app is blocked or unavailable

Make sure the OAuth consent screen is configured and that your Google account is added as a test user while the app is in testing mode.

### OneDrive consent fails

Some Microsoft work or school accounts require admin consent. Use a personal Microsoft account or ask the tenant admin to approve the requested permissions.

### Dropbox refresh token is missing

Make sure you are using the OmniCloud connect flow. The backend requests offline access automatically.

### MEGA temporary error

`EAGAIN` means the MEGA service is temporarily busy or unavailable. Wait a few moments and try again.

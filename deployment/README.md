# nginx configs

One file per domain, installed on the host by hand. They change rarely and a bad
one takes the site down, so CI does not touch them — it only ships content into
the directory they point at.

| Domain | Serves | Backed by |
|---|---|---|
| `api.citations.mnavasardian.com` | the JSON API | proxy to the Docker server on `127.0.0.1:9003` |
| `legal.citations.mnavasardian.com` | privacy policy, account deletion | static files in `$APP_DIR/legal` |

Only the second is in this repo. The API config predates it and lives only on the
server — copy it in when convenient so both are versioned:

```bash
scp michael@YOUR_HOST:/etc/nginx/sites-available/api.citations.mnavasardian.com.conf \
    deployment/
```

## First-time setup for the legal domain

Everything here is once-only. After it, pushes to `client/docs/legal/**` publish
on their own.

**1. DNS** — add **two** `A` records, both pointing at the same IP as the API
subdomain:

| Name | |
|---|---|
| `legal.citations` | the canonical host |
| `www.legal.citations` | redirects to the canonical host |

Both must resolve before certbot will issue, because it validates each name
separately:

```bash
dig +short legal.citations.mnavasardian.com
dig +short www.legal.citations.mnavasardian.com
```

**2. Create the content directory and let nginx reach it.** nginx runs as
`www-data` and must be able to traverse every parent, which home directories
usually block:

```bash
ssh michael@YOUR_HOST
mkdir -p ~/apps/citations-widget-app/legal
chmod o+x /home/michael /home/michael/apps /home/michael/apps/citations-widget-app
chmod o+x /home/michael/apps/citations-widget-app/legal
```

**3. Install the config with only the port-80 block active.** The `443` block
references a certificate that does not exist yet, and nginx refuses to load a
config pointing at a missing `ssl_certificate`. So comment out the second
`server { ... }` block for now.

Copy the file from your machine, then enable it on the host. `sites-available`
holds the file; `sites-enabled` holds a symlink to it, and nginx only reads
`sites-enabled` — that is the split that lets you disable a site without
deleting its config:

```bash
# from your machine, in the repo
scp deployment/legal.citations.mnavasardian.com.conf michael@YOUR_HOST:/tmp/

# on the host
sudo mv /tmp/legal.citations.mnavasardian.com.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/legal.citations.mnavasardian.com.conf \
           /etc/nginx/sites-enabled/legal.citations.mnavasardian.com.conf
sudo nginx -t && sudo systemctl reload nginx
```

`nginx -t` first, always. A reload with a broken config is refused and the old
workers keep serving, but `restart` would take **every** site down, the API
included.

**4. Issue the certificate with `certonly`, not `--nginx`.**

```bash
sudo certbot certonly --webroot -w /var/www/html \
  -d legal.citations.mnavasardian.com \
  -d www.legal.citations.mnavasardian.com
```

Both `-d` flags are required: the `443` block answers for either name, and nginx
will fail TLS for any name the certificate does not cover. The first `-d` names
the directory under `/etc/letsencrypt/live/`, which is what the config points at.

`certbot --nginx` would rewrite the config in place and stamp it
`# managed by Certbot`. Since this file is version-controlled, those edits would
be invisible in git and clobbered the next time you copy it up. `certonly` only
issues and renews the certificate; the `location /.well-known/acme-challenge/`
block in the port-80 server is what lets it validate, and it is also what makes
automatic renewal keep working.

Then uncomment the `443` block, copy the file up again, and reload:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

**5. Publish the content.** Push any change under `client/docs/legal/`, or run
the workflow manually from the Actions tab. Then check:

```bash
curl -sI https://legal.citations.mnavasardian.com/privacy | head -3
curl -sI https://legal.citations.mnavasardian.com/delete-account | head -3

# www must answer and redirect, not fail TLS
curl -sI https://www.legal.citations.mnavasardian.com/privacy | head -3
```

The first two return `200`. The `www` one returns `301` to the bare host — that
is correct; one canonical URL, no duplicate page.

The `.html` forms work too — `try_files $uri $uri.html` serves either, which is
what keeps the pages' relative cross-links working.

## What the pipeline does

`.github/workflows/deploy.yml` has a `package-legal` job gated on a
`client/docs/legal/**` path filter. It tars the directory — no build, no
toolchain, no dependencies — and the deploy job rsyncs it into
`$APP_DIR/legal/` with `--delete`, so a file removed from the repo also leaves
the server.

No releases, no symlink, no rollback mechanics: these are two hand-written HTML
files, and git is the history. To revert, revert the commit and push. No nginx
reload is needed after a deploy.

The two layers are fully independent — editing the privacy policy does not
rebuild Docker, and a server change does not republish the policy.

## Why CI does not deploy the nginx configs

It ships *content* into `$APP_DIR/legal`, never anything under `/etc/nginx`.
That is deliberate:

- It would need passwordless `sudo` for `cp`, `nginx -t` and `systemctl reload`
  over SSH, widening what a leaked deploy key can do from "overwrite two HTML
  files" to "reconfigure the web server".
- nginx configs are global. A reload applies every enabled site at once, so a
  mistake in this file is a mistake for the API too.
- The file changes roughly never; the pages change occasionally.

The cost is that the repo copy can drift from `/etc/nginx/sites-available/`.
Worth checking when you touch it:

```bash
ssh michael@YOUR_HOST 'cat /etc/nginx/sites-available/legal.citations.mnavasardian.com.conf' \
  | diff - deployment/legal.citations.mnavasardian.com.conf && echo "in sync"
```

# Publish on GitHub Pages

1. Create a new GitHub repository (for example `my-firm-website`).
2. Put the contents of this folder at the root of that repository (`index.html`, `styles.css`, `script.js`, `config.js`, `vendor-qrcode.js`, `favicon.svg`, `.nojekyll`).
3. On GitHub: Settings > Pages > Build and deployment > Source: "Deploy from a branch", Branch: `main`, folder: `/ (root)`.
4. After a minute the site is live at `https://<your-username>.github.io/<repository-name>/`.

## Before going live

- Fill in `config.js`: firm name, phone, WhatsApp, address, UPI ID.
- Set `showThemePicker: false` and pick a `theme`.
- Replace every `₹ X,XXX` in the Fees section of `index.html`, and delete the yellow "Sample fees" note.

## Adding a domain later

1. Settings > Pages > Custom domain: enter your domain.
2. At your domain provider, add a CNAME record for `www` pointing to `<your-username>.github.io`
   (and the four GitHub A records for the bare domain; see GitHub's "Managing a custom domain" docs).
3. Tick "Enforce HTTPS" once it becomes available.

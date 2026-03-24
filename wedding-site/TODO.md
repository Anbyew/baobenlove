# TODO: Connect baoben.love to Netlify

Currently `baoben.love` points to the old GitHub Pages site.
The new React wedding site is deployed at **https://baobenlove.netlify.app**.

## Steps to cut over

1. Go to **Squarespace** → Domains → baoben.love → DNS Settings
2. Add/update these DNS records:

   | Type  | Host  | Value                    |
   |-------|-------|--------------------------|
   | A     | @     | 75.2.60.5                |
   | CNAME | www   | baobenlove.netlify.app   |

3. Wait for DNS propagation (a few minutes to a few hours)
4. Netlify auto-provisions the SSL cert once it detects the records
5. Verify at https://baoben.love

## Notes
- Netlify site: https://app.netlify.com/projects/baobenlove
- GitHub Pages will stop serving the domain but the repo is unaffected
- The CNAME file in the repo root can be removed after cutover

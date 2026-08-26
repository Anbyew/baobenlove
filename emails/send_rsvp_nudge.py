"""
RSVP Nudge Email Sender — Gmail API / OAuth2
Short, elegant follow-up reminder with the September 1 deadline restated,
sent only to households that have not yet RSVPed, fetched live from the
production database (via SSH to the EC2 host).

Usage:
  python send_rsvp_nudge.py            # dry run — lists recipients, sends nothing
  python send_rsvp_nudge.py --preview  # browser preview (first recipient)
  python send_rsvp_nudge.py --test <email>  # send one real email to a specific address
  python send_rsvp_nudge.py --send     # actually send
"""

import base64
import csv
import json
import subprocess
import sys
import tempfile
import webbrowser
from datetime import datetime
from pathlib import Path
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

# ── CONFIG ────────────────────────────────────────────────────────────────────
SENDER_EMAIL = "bellabenbao@gmail.com"
BASE_DIR     = Path(__file__).parent.parent
CREDS_PATH   = BASE_DIR / "emails" / "credentials.json"
TOKEN_PATH   = BASE_DIR / "emails" / "token.json"
LOG_PATH     = Path(__file__).parent / "rsvp_nudge_log.csv"

SSH_HOST        = "baobenlove"
DB_PATH_REMOTE  = "/home/ubuntu/app/server/data/wedding.db"

SCOPES        = ["https://www.googleapis.com/auth/gmail.send"]
EMAIL_SUBJECT = "A Gentle RSVP Reminder"
RSVP_URL      = "https://baoben.love/rsvp"

# Addresses to skip even though the household shows as pending in the database.
EXCLUDE_EMAILS = {
    "bellabenbao@gmail.com",       # same inbox the reminder sends from
    "164092802@qq.com",            # Ms. Xiaoxiao Xu and Guest — excluded per request
    "monet-xu@ti.com",             # Ms. Xiaoxiao Xu and Guest — excluded per request
    "18ssyy@163.com",              # Ms. Yao Shan and Guest — excluded per request
    "marciamcham@aol.com",         # Mrs. Marcia McHam — excluded per request
    "info@kellyaltierweddings.com",# Ms. Kelly Altier — vendor address, excluded per request
}
# ─────────────────────────────────────────────────────────────────────────────


def get_gmail_service():
    creds = None
    if TOKEN_PATH.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(CREDS_PATH), SCOPES)
            creds = flow.run_local_server(port=0)
        TOKEN_PATH.write_text(creds.to_json())
    return build("gmail", "v1", credentials=creds)


def fetch_pending_recipients():
    """Live query of production: households that have not yet RSVPed."""
    query = (
        "SELECT party_name, emails FROM invites "
        "WHERE attendance NOT IN ('yes','no') OR attendance IS NULL "
        "ORDER BY party_name;"
    )
    result = subprocess.run(
        ["ssh", "-o", "ConnectTimeout=8", SSH_HOST, f"sqlite3 -json {DB_PATH_REMOTE} \"{query}\""],
        capture_output=True, text=True, check=True,
    )
    rows = json.loads(result.stdout or "[]")

    recipients = []
    for row in rows:
        name = row["party_name"]
        emails = json.loads(row["emails"])
        for email in emails:
            if email.strip().lower() in EXCLUDE_EMAILS:
                continue
            recipients.append({"name": name, "email": email.strip()})
    return recipients


def build_html_body(name: str) -> str:
    return f"""
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Georgia, 'Times New Roman', serif; font-size: 16px; line-height: 1.75; color: #2a2a2a; max-width: 600px; margin: auto; padding: 24px;">

<p style="margin: 0 0 22px;">Dear {name},</p>

<p style="margin: 0 0 22px;">We hope this note finds you well.</p>

<p style="margin: 0 0 22px;">
  As our wedding at Longwood Gardens draws near, we find that we have not yet had
  the pleasure of receiving your reply. We would be most grateful to hear from you
  by <strong>September 1, 2026, at 11:59 PM AOE</strong>.
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 26px; border-left: 2px solid #FFDC7F; background-color: #fbfaf7;">
  <tr>
    <td style="padding: 16px 22px;">
      <p style="margin: 0; font-size: 15px; color: #2a2a2a;">
        Kindly send your response at
        <a href="{RSVP_URL}" style="color: #78B7D0; text-decoration: none; border-bottom: 1px solid #78B7D0;">baoben.love/rsvp</a>,
        using <strong>BellaBenBao2026</strong> to enter.
      </p>
    </td>
  </tr>
</table>

<p style="margin: 0 0 30px;">
  If our invitation has, by some misadventure of the post, not reached you, please
  do let us know and we shall gladly send another. Likewise, should the website
  prove less accommodating than we hope, a reply to this note will find us readily
  at hand.
</p>

<p style="margin: 0 0 4px;">
  With our warmest affection,<br>
  Yuwei &amp; Ben
</p>

<p style="margin: 28px 0 0; font-style: italic; font-size: 13px; color: #9a9a9a;">
  Optimum attingitur. Amor infinitus est.
</p>

</body>
</html>
"""


def build_plain_body(name: str) -> str:
    return f"""Dear {name},

We hope this note finds you well.

As our wedding at Longwood Gardens draws near, we find that we have not yet had the pleasure of receiving your reply. We would be most grateful to hear from you by September 1, 2026, at 11:59 PM AOE.

Kindly send your response at {RSVP_URL}, using BellaBenBao2026 to enter.

If our invitation has, by some misadventure of the post, not reached you, please do let us know and we shall gladly send another. Likewise, should the website prove less accommodating than we hope, a reply to this note will find us readily at hand.

With our warmest affection,
Yuwei & Ben

Optimum attingitur. Amor infinitus est.
"""


def build_message(name: str, email: str) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = EMAIL_SUBJECT
    msg["From"]    = SENDER_EMAIL
    msg["To"]      = email
    msg.attach(MIMEText(build_plain_body(name), "plain"))
    msg.attach(MIMEText(build_html_body(name), "html"))
    return msg


def print_recipient_list(recipients: list):
    header = f"{'NAME ON ENVELOPE':<52} {'EMAIL'}"
    sep    = "-" * len(header)
    print(sep)
    print(header)
    print(sep)
    for r in recipients:
        print(f"{r['name']:<52} {r['email']}")
    print(sep)
    print(f"Total: {len(recipients)} email(s) across pending households\n")


def write_send_log(recipients: list):
    fieldnames = ["timestamp", "name", "email"]
    write_header = not LOG_PATH.exists()
    with open(LOG_PATH, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if write_header:
            writer.writeheader()
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        for r in recipients:
            writer.writerow({"timestamp": ts, "name": r["name"], "email": r["email"]})
    print(f"Log written → {LOG_PATH}")


def preview():
    recipients = fetch_pending_recipients()
    if not recipients:
        print("No pending recipients found.")
        return
    r = recipients[0]
    html = build_html_body(r["name"])
    with tempfile.NamedTemporaryFile(suffix=".html", delete=False, mode="w", encoding="utf-8") as f:
        f.write(html)
        path = f.name
    print(f"Preview for: {r['name']} <{r['email']}>")
    webbrowser.open(f"file://{path}")


def lookup_name_for_email(email: str) -> str | None:
    """Look up the real party_name on file for a given email address, if any."""
    query = (
        "SELECT party_name FROM invites WHERE EXISTS "
        f"(SELECT 1 FROM json_each(emails) WHERE value = '{email.strip().lower()}') LIMIT 1;"
    )
    result = subprocess.run(
        ["ssh", "-o", "ConnectTimeout=8", SSH_HOST, f"sqlite3 {DB_PATH_REMOTE} \"{query}\""],
        capture_output=True, text=True, check=True,
    )
    name = result.stdout.strip()
    return name or None


def send_test(to_email: str):
    """Send one real email to a specific address, using that household's real name on file."""
    name = lookup_name_for_email(to_email)
    if not name:
        print(f"No invite record found for {to_email} — aborting rather than guess a name.")
        return
    service = get_gmail_service()
    msg = build_message(name, to_email)
    raw = {"raw": base64.urlsafe_b64encode(msg.as_bytes()).decode()}
    service.users().messages().send(userId="me", body=raw).execute()
    print(f"Test email sent → {to_email} (addressed to \"{name}\")")


def main():
    if "--preview" in sys.argv:
        preview()
        return

    if "--test" in sys.argv:
        i = sys.argv.index("--test")
        if i + 1 >= len(sys.argv):
            print("Usage: python send_rsvp_nudge.py --test <email>")
            return
        send_test(sys.argv[i + 1])
        return

    recipients = fetch_pending_recipients()
    if not recipients:
        print("No pending recipients found.")
        return

    print_recipient_list(recipients)

    if "--send" not in sys.argv:
        print("Dry run only — nothing was sent. Re-run with --send to actually send.")
        return

    service = get_gmail_service()
    sent = 0
    for r in recipients:
        try:
            msg = build_message(r["name"], r["email"])
            raw = {"raw": base64.urlsafe_b64encode(msg.as_bytes()).decode()}
            service.users().messages().send(userId="me", body=raw).execute()
            sent += 1
            print(f"Sent → {r['name']} <{r['email']}>")
        except Exception as e:
            print(f"FAILED → {r['name']} <{r['email']}>: {e}")

    write_send_log(recipients)
    print(f"\nDone. {sent}/{len(recipients)} sent.")


if __name__ == "__main__":
    main()

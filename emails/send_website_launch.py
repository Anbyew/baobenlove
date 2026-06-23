"""
Wedding Website Launch Email Sender — Gmail API / OAuth2
Reads testList.tsv, fills in template, and sends emails from bellabenbao@gmail.com

Usage:
  python send_website_launch.py           # dry run (default)
  python send_website_launch.py --preview # open browser preview
  python send_website_launch.py --send    # actually send (set DRY_RUN = False first)
"""

import base64
import csv
import re
import sys
import webbrowser
import tempfile
from pathlib import Path
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from urllib.parse import urlencode

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

# ── CONFIG ────────────────────────────────────────────────────────────────────
SENDER_EMAIL = "bellabenbao@gmail.com"
BASE_DIR     = Path(__file__).parent.parent
XLSX_PATH    = BASE_DIR / "guests.tsv"
CREDS_PATH   = BASE_DIR / "emails" / "credentials.json"
TOKEN_PATH   = BASE_DIR / "emails" / "token.json"

DRY_RUN = True  # ← set to False (and pass --send) to actually send

# Leave empty to send to all guests; populate to restrict to a test subset.
TEST_EMAILS: list[str] = [
    "bellabenbao@gmail.com",
    "info@kellyaltierweddings.com",
    "ltouger@cox.net",
    "jakrakoff@gmail.com",
    "bkrakoff@gmail.com"
]
# ─────────────────────────────────────────────────────────────────────────────

SCOPES          = ["https://www.googleapis.com/auth/gmail.send"]
EMAIL_SUBJECT   = "[TEST] A Little Prelude to Our Celebration on Oct 3, 2026"
WEBSITE_BASE_URL = "https://www.baoben.love/"
INVITE_SOURCE   = "website_launch"


def build_guest_id(name: str, row_number: int) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
    return f"{normalized or 'guest'}_{row_number}"


def build_email_slug(email: str) -> str:
    local_part = email.split("@", 1)[0]
    normalized = re.sub(r"[^a-z0-9]+", "_", local_part.lower()).strip("_")
    return normalized or "email"


def build_tracked_website_url(guest_id: str) -> str:
    query = urlencode(
        {
            "src": INVITE_SOURCE,
            "guest": guest_id,
            "utm_source": "website_launch_email",
            "utm_medium": "email",
            "utm_campaign": "website_launch",
        }
    )
    return f"{WEBSITE_BASE_URL}?{query}"


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


def build_html_body(name: str, website_url: str) -> str:
    return f"""
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Georgia, serif; font-size: 16px; line-height: 1.8; color: #2a2a2a; max-width: 640px; margin: auto; padding: 24px;">

<p>Dear {name},</p>

<p>As we joyfully count down to October 3, 2026, we are delighted to share something we've been quietly tending with love &#8212; our wedding website, created in anticipation of our celebration at Longwood Gardens.</p>

<p style="margin: 24px 0;">
  <strong>Website:</strong> <a href="{website_url}" style="color: #78B7D0;">baoben.love</a><br>
  <strong>Password:</strong> BellaBenBao2026
</p>

<p>Within its pages, you'll find travel and accommodation details, a few glimpses into our story, and a small preview of the weekend we so look forward to sharing with you.</p>

<p>Formal invitations and RSVP details will arrive by mail in the coming months. Until then, please consider this our heartfelt early welcome. We cannot wait for us all to gather and for this beautiful day to blossom together.</p>

<p>With all our love and warm anticipation,<br>
Yuwei &amp; Ben</p>

</body>
</html>
"""


def build_plain_body(name: str, website_url: str) -> str:
    return f"""Dear {name},

As we joyfully count down to October 3, 2026, we are delighted to share something we've been quietly tending with love — our wedding website, created in anticipation of our celebration at Longwood Gardens.

Website: {website_url}
Password: BellaBenBao2026

Within its pages, you'll find travel and accommodation details, a few glimpses into our story, and a small preview of the weekend we so look forward to sharing with you.

Formal invitations and RSVP details will arrive by mail in the coming months. Until then, please consider this our heartfelt early welcome. We cannot wait for us all to gather and for this beautiful day to blossom together.

With all our love and warm anticipation,
Yuwei & Ben
"""


def load_recipients():
    with open(XLSX_PATH, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f, delimiter="\t")
        rows = list(reader)

    allowed = {e.lower() for e in TEST_EMAILS} if TEST_EMAILS else None

    recipients = []
    for row_number, row in enumerate(rows, start=2):
        name       = row.get("Name on Envelope")
        emails_raw = row.get("Email")
        if not name or not emails_raw:
            continue
        emails = [e.strip() for e in str(emails_raw).split(",") if e.strip()]
        if allowed:
            emails = [e for e in emails if e.lower() in allowed]
        if not emails:
            continue
        base_guest_id = build_guest_id(str(name), row_number)
        for email in emails:
            guest_id = f"{base_guest_id}_{build_email_slug(email)}"
            recipients.append(
                {
                    "name": name,
                    "email": email,
                    "guest_id": guest_id,
                    "website_url": build_tracked_website_url(guest_id),
                }
            )
    return recipients


def build_message(name: str, email: str, website_url: str) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = EMAIL_SUBJECT
    msg["From"]    = SENDER_EMAIL
    msg["To"]      = email
    msg.attach(MIMEText(build_plain_body(name, website_url), "plain"))
    msg.attach(MIMEText(build_html_body(name, website_url), "html"))
    return msg


def preview():
    recipients = load_recipients()
    if not recipients:
        print("No recipients found.")
        return
    r = recipients[0]
    html = build_html_body(r["name"], r["website_url"])
    with tempfile.NamedTemporaryFile(suffix=".html", delete=False, mode="w", encoding="utf-8") as f:
        f.write(html)
        path = f.name
    print(f"Preview for: {r['name']} <{r['email']}>")
    print(f"Tracked URL: {r['website_url']}")
    webbrowser.open(f"file://{path}")


def main():
    if "--preview" in sys.argv:
        preview()
        return

    recipients = load_recipients()
    print(f"Found {len(recipients)} recipients.\n")

    if DRY_RUN:
        for r in recipients:
            print(f"[DRY RUN] To: {r['email']}  |  Name: {r['name']}  |  Link: {r['website_url']}")
        print("\nDry run complete. Set DRY_RUN = False and pass --send to actually send.")
        return

    if "--send" not in sys.argv:
        print("Safety check: pass --send to actually send emails (and set DRY_RUN = False).")
        return

    if not CREDS_PATH.exists():
        raise FileNotFoundError(
            f"credentials.json not found at {CREDS_PATH}\n"
            "Follow the setup instructions in send_emails.py."
        )

    service = get_gmail_service()

    for r in recipients:
        msg = build_message(r["name"], r["email"], r["website_url"])
        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
        service.users().messages().send(userId="me", body={"raw": raw}).execute()
        print(f"Sent to: {r['email']}  |  Name: {r['name']}")

    print("\nAll emails sent!")


if __name__ == "__main__":
    main()

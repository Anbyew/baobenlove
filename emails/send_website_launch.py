"""
Wedding Website Launch Email Sender — Gmail API / OAuth2
Reads guests.tsv, fills in template, and sends emails from bellabenbao@gmail.com

Usage:
  python send_website_launch.py                         # dry run (all guests)
  python send_website_launch.py --batch "Ben/Friends"   # dry run one batch
  python send_website_launch.py --preview               # browser preview (first recipient)
  python send_website_launch.py --batch "Ben/Friends" --send  # actually send a batch

Available batches (Affiliation/Relation):
  Ben/Colleagues  Ben/Family  Ben/Family Friends  Ben/Friends
  Yuwei/Colleagues  Yuwei/Family  Yuwei/Friends
  Both/Friends
"""

import base64
import csv
import sys
import webbrowser
import tempfile
from datetime import datetime
from pathlib import Path
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage


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

DRY_RUN = False  # ← set to False (and pass --send) to actually send

# Households that have never logged in — resend targets only.
TEST_EMAILS: list[str] = [
    "atticuschristensen@gmail.com","lingluanwh@gmail.com","markgreenfield93@gmail.com",
    "axelkalbach@gmail.com","faithclayton@gmail.com","andrei.alexan@gmail.com",
    "matthew.v.ellison@gmail.com","danjcollins@gmail.com","noahkrakoff@gmail.com",
    "sarahkrakoff@gmail.com","lucyjaneck@gmail.com","jyenkin@aol.com",
    "gtilde@yahoo.com","dyenkin@yahoo.com","lefflers@aol.com",
    "dleffler0603@gmail.com","jessicaleffler@gmail.com","joshuaaleffler@gmail.com",
    "jkornhau13@gmail.com","michael.kornhauser@gmail.com","tougerrs@msn.com",
    "melissa.touger@gmail.com","juliet4816@gmail.com","davidtouger@hotmail.com",
    "murphyluzi@gmail.com","awf7@columbia.edu","harryahill@gmail.com",
    "laurabrooksbrown@gmail.com","marctlaurab@gmail.com","chris.rhodes45@gmail.com",
    "sharonleerhodes@gmail.com","jane.e.stein66@gmail.com","marciamcham@aol.com",
    "dorothee_newbern@hotmail.com","joymendenhall@gmail.com","aj3@princeton.edu",
    "essbeard@gmail.com","megabyteification@gmail.com","obrnmrk@gmail.com",
    "samcookie9@gmail.com","xuan.e.wu@gmail.com","cranberrylobster@gmail.com",
    "klupiloff@gmail.com","rebecca.janssen@outlook.de","florian.dahlhausen@gmail.com",
    "chaijy@umich.edu","vivwylai@gmail.com","baohk@126.com",
    "nickbao743@gmail.com","13276753627@139.com","13857520003@139.com",
    "yutian_sun@163.com","15868141610@163.com","jminlee@umich.edu",
    "ctrenton@umich.edu","liubovs@umich.edu","michaelito03@gmail.com",
    "zhang.nuda@gmail.com","alicequ16@gmail.com","elisawtsai@gmail.com",
    "barroytman@gmail.com","18ssyy@163.com","164092802@qq.com",
    "monet-xu@ti.com","hwang@jd21.law.harvard.edu","c071132@gmail.com",
    "daiyp@umich.edu","xinywa@umich.edu","yukw777@gmail.com",
    "jed970610@gmail.com","cpbara@umich.edu","bellabenbao@gmail.com",
]
# ─────────────────────────────────────────────────────────────────────────────

LOG_PATH        = Path(__file__).parent / "send_log.csv"

SCOPES          = ["https://www.googleapis.com/auth/gmail.send"]
EMAIL_SUBJECT   = "With All Our Love, Before October 3rd"
WEBSITE_BASE_URL = "https://www.baoben.love/"
SEAL_PATH       = BASE_DIR / "assets" / "AI" / "seal_sm.png"


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
Yuwei &amp; Ben<br>
<img src="cid:seal" alt="" width="48" style="margin-top: 8px; display: block;">
</p>

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


def parse_batch_arg() -> tuple[str, str] | None:
    """Return (affiliation, relation) from --batch "Affiliation/Relation", or None."""
    for i, arg in enumerate(sys.argv):
        if arg == "--batch" and i + 1 < len(sys.argv):
            raw = sys.argv[i + 1]
            parts = raw.split("/", 1)
            if len(parts) != 2:
                print(f"Error: --batch value must be 'Affiliation/Relation', got: {raw!r}")
                sys.exit(1)
            return parts[0].strip(), parts[1].strip()
    return None


def load_recipients(batch: tuple[str, str] | None = None):
    with open(XLSX_PATH, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f, delimiter="\t")
        rows = list(reader)

    allowed = {e.lower() for e in TEST_EMAILS} if TEST_EMAILS else None

    recipients = []
    for row in rows:
        name          = (row.get("Name on Envelope") or "").strip()
        emails_raw    = (row.get("Email") or "").strip()
        affiliation   = (row.get("Affiliation") or "").strip()
        relation      = (row.get("Relation") or "").strip()

        if not name or not emails_raw:
            continue

        if batch and (affiliation.lower() != batch[0].lower()
                      or relation.lower() != batch[1].lower()):
            continue

        emails = [e.strip() for e in emails_raw.split(",") if e.strip()]
        if allowed:
            emails = [e for e in emails if e.lower() in allowed]
        if not emails:
            continue

        for email in emails:
            recipients.append(
                {
                    "name":        name,
                    "email":       email,
                    "affiliation": affiliation,
                    "relation":    relation,
                    "website_url": WEBSITE_BASE_URL,
                }
            )
    return recipients


def print_recipient_list(recipients: list, label: str = ""):
    header = f"{'NAME ON ENVELOPE':<45} {'EMAIL':<40} {'BATCH'}"
    sep    = "-" * len(header)
    if label:
        print(f"\n{label}")
    print(sep)
    print(header)
    print(sep)
    for r in recipients:
        batch_tag = f"{r['affiliation']}/{r['relation']}"
        print(f"{r['name']:<45} {r['email']:<40} {batch_tag}")
    print(sep)
    print(f"Total: {len(recipients)} email(s)\n")


def write_send_log(recipients: list, batch_label: str):
    fieldnames = ["timestamp", "batch", "name", "email", "affiliation", "relation"]
    write_header = not LOG_PATH.exists()
    with open(LOG_PATH, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if write_header:
            writer.writeheader()
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        for r in recipients:
            writer.writerow({
                "timestamp":   ts,
                "batch":       batch_label,
                "name":        r["name"],
                "email":       r["email"],
                "affiliation": r["affiliation"],
                "relation":    r["relation"],
            })
    print(f"Log written → {LOG_PATH}")


def build_message(name: str, email: str, website_url: str) -> MIMEMultipart:
    msg = MIMEMultipart("related")
    msg["Subject"] = EMAIL_SUBJECT
    msg["From"]    = SENDER_EMAIL
    msg["To"]      = email

    alt = MIMEMultipart("alternative")
    alt.attach(MIMEText(build_plain_body(name, website_url), "plain"))
    alt.attach(MIMEText(build_html_body(name, website_url), "html"))
    msg.attach(alt)

    with open(SEAL_PATH, "rb") as f:
        img = MIMEImage(f.read())
        img.add_header("Content-ID", "<seal>")
        img.add_header("Content-Disposition", "inline", filename="seal.png")
        msg.attach(img)

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

    batch = parse_batch_arg()
    batch_label = f"{batch[0]}/{batch[1]}" if batch else "ALL"

    recipients = load_recipients(batch)

    if not recipients:
        print(f"No recipients found for batch: {batch_label}")
        return

    if DRY_RUN or "--send" not in sys.argv:
        print_recipient_list(recipients, label=f"[DRY RUN] Batch: {batch_label}")
        if "--send" not in sys.argv:
            print("Dry run complete. Pass --send (and set DRY_RUN = False) to actually send.")
        return

    if not CREDS_PATH.exists():
        raise FileNotFoundError(
            f"credentials.json not found at {CREDS_PATH}\n"
            "Follow the setup instructions in send_emails.py."
        )

    service = get_gmail_service()

    sent = []
    for r in recipients:
        msg = build_message(r["name"], r["email"], r["website_url"])
        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
        service.users().messages().send(userId="me", body={"raw": raw}).execute()
        print(f"Sent → {r['email']}  ({r['name']})")
        sent.append(r)

    print_recipient_list(sent, label=f"Emails sent — Batch: {batch_label}")
    write_send_log(sent, batch_label)


if __name__ == "__main__":
    main()

"""
RSVP Confirmation Email Sender — Gmail API / OAuth2
Sends each household that RSVPed Yes a summary of exactly what they submitted
on the RSVP form — guest names, meal choices, dietary notes, Welcome Dinner,
transportation — and invites them to flag anything that needs correcting,
fetched live from the production database (via SSH to the EC2 host).
Households who RSVPed No are not sent this email.

Usage:
  python send_rsvp_confirmation.py            # dry run — lists recipients, sends nothing
  python send_rsvp_confirmation.py --preview  # browser preview (first recipient)
  python send_rsvp_confirmation.py --test <email>   # send one real email to this address
  python send_rsvp_confirmation.py --send     # actually send to everyone who RSVPed Yes
"""

import html
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
LOG_PATH     = Path(__file__).parent / "rsvp_confirmation_log.csv"

SSH_HOST        = "baobenlove"
DB_PATH_REMOTE  = "/home/ubuntu/app/server/data/wedding.db"

SCOPES        = ["https://www.googleapis.com/auth/gmail.send"]
EMAIL_SUBJECT = "Your RSVP Is All Set, Until We Gather in October"

# Addresses to skip even though the household shows as RSVPed in the database.
EXCLUDE_EMAILS = {
    "bellabenbao@gmail.com",  # same inbox this sends from
}

MAIN_COURSE_LABELS = {
    "cod": "Sesame Roasted Black Cod",
    "duck": "Pan Seared Pennsylvania Duck Breast",
    "wellington": "Heirloom Carrot & Leek Wellington",
    "childrens": "Children's Meal",
}
VEGETARIAN_COURSES = {"wellington"}

TRANSPORTATION_LABELS = {
    "yes": "Yes",
    "no": "No",
    "tbd": "To be determined",
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


def meal_label(guest: dict) -> str:
    course = guest.get("mainCourse", "")
    if course == "other":
        other = (guest.get("mainCourseOther") or "").strip()
        return other or "Other (not specified)"
    return MAIN_COURSE_LABELS.get(course, "Not selected")


def dietary_note(guest: dict) -> str:
    """The dietary note shown for a guest — their own note if given, else an
    inferred 'Vegetarian' when they chose the vegetarian entrée, else a dash."""
    restriction = (guest.get("dietaryRestrictions") or "").strip()
    if restriction:
        return restriction
    if guest.get("mainCourse") in VEGETARIAN_COURSES:
        return "Vegetarian"
    return "—"


def greeting_names(guests: list, fallback: str) -> str:
    """'Jane & Alex' / 'Jane, Alex & Sam' style greeting from guest first names,
    falling back to the informal or formal party name when there are none on file."""
    first_names = [g.get("firstName", "").strip() for g in guests if (g.get("firstName") or "").strip()]
    if not first_names:
        return fallback
    if len(first_names) == 1:
        return first_names[0]
    return ", ".join(first_names[:-1]) + " & " + first_names[-1]


def fetch_rsvped_recipients():
    """Live query of production: households that RSVPed Yes. Households who
    RSVPed No are excluded — this email is only for confirming attending guests."""
    query = (
        "SELECT party_name, informal_name, emails, attendance, guest_count, guests, "
        "transportation, welcome_dinner_attendance, rehearsal_dinner "
        "FROM invites "
        "WHERE attendance = 'yes' AND submitted_at IS NOT NULL "
        "ORDER BY party_name;"
    )
    result = subprocess.run(
        ["ssh", "-o", "ConnectTimeout=8", SSH_HOST, f"sqlite3 -json {DB_PATH_REMOTE} \"{query}\""],
        capture_output=True, text=True, check=True,
    )
    rows = json.loads(result.stdout or "[]")

    recipients = []
    for row in rows:
        emails = json.loads(row["emails"] or "[]")
        for email in emails:
            email = email.strip()
            if email.lower() in EXCLUDE_EMAILS:
                continue
            recipients.append({**row, "email": email})
    return recipients


def build_guests_html(guests: list) -> str:
    rows = []
    for g in guests:
        name = html.escape(f"{g.get('firstName', '')} {g.get('lastName', '')}".strip())
        if g.get("ageGroup") == "under21":
            name += ' <span style="font-weight: normal; color: #7a7a7a;">(Under 21)</span>'
        meal = html.escape(meal_label(g))
        note = html.escape(dietary_note(g))
        rows.append(f"""
  <tr>
    <td style="padding: 10px 14px; border-bottom: 1px solid #e8e5df; font-weight: bold;">{name}</td>
    <td style="padding: 10px 14px; border-bottom: 1px solid #e8e5df;">{meal}</td>
    <td style="padding: 10px 14px; border-bottom: 1px solid #e8e5df; color: #5a5a5a;">{note}</td>
  </tr>""")
    return "".join(rows)


def build_html_body(row: dict) -> str:
    attendance = row.get("attendance")
    guests = json.loads(row.get("guests") or "[]")
    guest_count = row.get("guest_count")
    invited_to_welcome_dinner = row.get("rehearsal_dinner") == "Yes"
    welcome_dinner_answer = row.get("welcome_dinner_attendance") or ""
    transportation = TRANSPORTATION_LABELS.get(row.get("transportation") or "", "Not specified")

    fallback_name = row.get("informal_name") or row["party_name"]
    name = html.escape(greeting_names(guests, fallback_name))

    if attendance == "no":
        details_html = """
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 26px; border-left: 2px solid #FFDC7F; background-color: #fbfaf7;">
  <tr>
    <td style="padding: 16px 22px;">
      <p style="margin: 0; font-size: 15px; color: #2a2a2a;">
        We have you down as <strong>unable to join us</strong> on October 3.
      </p>
    </td>
  </tr>
</table>
"""
    else:
        guest_rows_html = build_guests_html(guests)
        welcome_dinner_html = ""
        if invited_to_welcome_dinner:
            wd_label = {"yes": "Attending", "no": "Not attending"}.get(welcome_dinner_answer, "Not yet answered")
            welcome_dinner_html = f"""
<p style="margin: 0 0 8px;"><strong>Welcome Dinner — Friday, October 2:</strong> {wd_label}</p>"""

        details_html = f"""
<p style="margin: 0 0 18px;">
  Attending: <strong>{guest_count}</strong> guest{'s' if guest_count != 1 else ''}
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 22px; border-collapse: collapse; background-color: #fbfaf7; border: 1px solid #e8e5df;">
  <tr style="background-color: #f0ede6;">
    <td style="padding: 10px 14px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.03em; color: #7a7a7a;">Guest</td>
    <td style="padding: 10px 14px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.03em; color: #7a7a7a;">Meal Selection</td>
    <td style="padding: 10px 14px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.03em; color: #7a7a7a;">Dietary Notes</td>
  </tr>
  {guest_rows_html}
</table>

{welcome_dinner_html}
<p style="margin: 0 0 8px;"><strong>Transportation:</strong> {transportation}</p>
"""

    closing_html = (
        "Until then, we'll be thinking of you, and hope our paths cross again soon."
        if attendance == "no" else
        "Until then, there is nothing more to do but look forward to October. We are so "
        "grateful that you will be part of the day, and cannot wait to celebrate with you."
    )

    return f"""
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Georgia, 'Times New Roman', serif; font-size: 16px; line-height: 1.75; color: #2a2a2a; max-width: 600px; margin: auto; padding: 24px;">

<p style="margin: 0 0 22px;">Dear {name},</p>

<p style="margin: 0 0 22px;">
  Just a little note that your RSVP has reached us, and that we have everything
  below noted for October 3.
</p>

{details_html}

<p style="margin: 26px 0 22px;">
  As our RSVP period draws to a close, if anything should change, however
  small, please do let us know at your earliest convenience.
</p>

<p style="margin: 0 0 30px;">
  {closing_html}
</p>

<p style="margin: 0 0 4px;">
  With much love,<br>
  Emily &amp; Ben
</p>

</body>
</html>
"""


def build_guests_plain(guests: list) -> str:
    lines = []
    for g in guests:
        name = f"{g.get('firstName', '')} {g.get('lastName', '')}".strip()
        if g.get("ageGroup") == "under21":
            name += " (Under 21)"
        meal = meal_label(g)
        note = dietary_note(g)
        line = f"  {name}\t{meal}\t{note}"
        lines.append(line)
    return "\n".join(lines)


def build_plain_body(row: dict) -> str:
    attendance = row.get("attendance")
    guests = json.loads(row.get("guests") or "[]")
    guest_count = row.get("guest_count")
    invited_to_welcome_dinner = row.get("rehearsal_dinner") == "Yes"
    welcome_dinner_answer = row.get("welcome_dinner_attendance") or ""
    transportation = TRANSPORTATION_LABELS.get(row.get("transportation") or "", "Not specified")

    fallback_name = row.get("informal_name") or row["party_name"]
    name = greeting_names(guests, fallback_name)

    if attendance == "no":
        details = "We have you down as unable to join us on October 3."
    else:
        details_parts = [
            f"Attending: {guest_count} guest{'s' if guest_count != 1 else ''}",
            "",
            "GUEST\tMEAL SELECTION\tDIETARY NOTES",
            build_guests_plain(guests),
        ]
        if invited_to_welcome_dinner:
            wd_label = {"yes": "Attending", "no": "Not attending"}.get(welcome_dinner_answer, "Not yet answered")
            details_parts += ["", f"Welcome Dinner — Friday, October 2: {wd_label}"]
        details_parts += ["", f"Transportation: {transportation}"]
        details = "\n".join(details_parts)

    closing = (
        "Until then, we'll be thinking of you, and hope our paths cross again soon."
        if attendance == "no" else
        "Until then, there is nothing more to do but look forward to October. We are so grateful that you will be part of the day, and cannot wait to celebrate with you."
    )

    return f"""Dear {name},

Just a little note that your RSVP has reached us, and that we have everything below noted for October 3.

{details}

As our RSVP period draws to a close, if anything should change, however small, please do let us know at your earliest convenience.

{closing}

With much love,
Emily & Ben
"""


def build_message(row: dict) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = EMAIL_SUBJECT
    msg["From"]    = SENDER_EMAIL
    msg["To"]      = row["email"]
    msg.attach(MIMEText(build_plain_body(row), "plain"))
    msg.attach(MIMEText(build_html_body(row), "html"))
    return msg


def print_recipient_list(recipients: list):
    header = f"{'PARTY NAME':<48} {'ATTENDING':<10} {'EMAIL'}"
    sep    = "-" * (len(header) + 20)
    print(sep)
    print(header)
    print(sep)
    for r in recipients:
        print(f"{r['party_name']:<48} {r['attendance']:<10} {r['email']}")
    print(sep)
    print(f"Total: {len(recipients)} email(s) across households who RSVPed Yes\n")


def write_send_log(recipients: list):
    fieldnames = ["timestamp", "party_name", "attendance", "email"]
    write_header = not LOG_PATH.exists()
    import csv
    with open(LOG_PATH, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if write_header:
            writer.writeheader()
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        for r in recipients:
            writer.writerow({
                "timestamp": ts,
                "party_name": r["party_name"],
                "attendance": r["attendance"],
                "email": r["email"],
            })
    print(f"Log written → {LOG_PATH}")


def preview():
    recipients = fetch_rsvped_recipients()
    if not recipients:
        print("No recipients found who RSVPed Yes.")
        return
    r = recipients[0]
    html_body = build_html_body(r)
    with tempfile.NamedTemporaryFile(suffix=".html", delete=False, mode="w", encoding="utf-8") as f:
        f.write(html_body)
        path = f.name
    print(f"Preview for: {r['party_name']} <{r['email']}>")
    webbrowser.open(f"file://{path}")


def lookup_row_for_email(email: str) -> dict | None:
    """Look up the full invite row on file for a given email address, if any."""
    query = (
        "SELECT party_name, informal_name, emails, attendance, guest_count, guests, "
        "transportation, welcome_dinner_attendance, rehearsal_dinner FROM invites WHERE EXISTS "
        f"(SELECT 1 FROM json_each(emails) WHERE value = '{email.strip().lower()}') LIMIT 1;"
    )
    result = subprocess.run(
        ["ssh", "-o", "ConnectTimeout=8", SSH_HOST, f"sqlite3 -json {DB_PATH_REMOTE} \"{query}\""],
        capture_output=True, text=True, check=True,
    )
    rows = json.loads(result.stdout or "[]")
    if not rows:
        return None
    row = rows[0]
    row["email"] = email.strip()
    return row


def send_test(to_email: str):
    """Send one real email to a specific address, using that household's real data on file."""
    row = lookup_row_for_email(to_email)
    if not row:
        print(f"No invite record found for {to_email} — aborting rather than guess.")
        return
    attendance = row.get("attendance")
    if attendance != "yes":
        state = "has not RSVPed yet" if attendance != "no" else "RSVPed No"
        print(f"{to_email} {state} — this email is only for guests who RSVPed Yes, skipping.")
        return
    service = get_gmail_service()
    msg = build_message(row)
    import base64
    raw = {"raw": base64.urlsafe_b64encode(msg.as_bytes()).decode()}
    service.users().messages().send(userId="me", body=raw).execute()
    print(f"Test email sent → {to_email} (party \"{row['party_name']}\")")


def main():
    if "--preview" in sys.argv:
        preview()
        return

    if "--test" in sys.argv:
        i = sys.argv.index("--test")
        if i + 1 >= len(sys.argv):
            print("Usage: python send_rsvp_confirmation.py --test <email>")
            return
        send_test(sys.argv[i + 1])
        return

    recipients = fetch_rsvped_recipients()
    if not recipients:
        print("No recipients found who RSVPed Yes.")
        return

    print_recipient_list(recipients)

    if "--send" not in sys.argv:
        print("Dry run only — nothing was sent. Re-run with --send to actually send.")
        return

    service = get_gmail_service()
    sent = 0
    for r in recipients:
        try:
            msg = build_message(r)
            import base64
            raw = {"raw": base64.urlsafe_b64encode(msg.as_bytes()).decode()}
            service.users().messages().send(userId="me", body=raw).execute()
            sent += 1
            print(f"Sent → {r['party_name']} <{r['email']}>")
        except Exception as e:
            print(f"FAILED → {r['party_name']} <{r['email']}>: {e}")

    write_send_log(recipients)
    print(f"\nDone. {sent}/{len(recipients)} sent.")


if __name__ == "__main__":
    main()

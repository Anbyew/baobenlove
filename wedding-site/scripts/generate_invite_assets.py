#!/usr/bin/env python3
"""
Generate household invite tokens, website URLs, QR codes, and Supabase import CSV.

Default source data comes from ../emails/testList.csv so printed invitations can
share the same guest list as the rest of the project.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import secrets
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable

import qrcode


ROOT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_INPUT = ROOT_DIR / "emails" / "testList.csv"
DEFAULT_OUTPUT_DIR = ROOT_DIR / "wedding-site" / "generated" / "invites"
DEFAULT_BASE_URL = "https://www.baoben.love/"


@dataclass
class InviteRecord:
  status: str
  affiliation: str
  relation: str
  guest_name: str
  envelope_name: str
  email: str

  @property
  def stable_key(self) -> str:
    return f"{normalize_text(self.envelope_name)}|{normalize_text(self.email)}"

  @property
  def display_name(self) -> str:
    return self.envelope_name or self.guest_name

  @property
  def guest_names(self) -> list[str]:
    names = split_guest_names(self.guest_name)
    return names or [self.display_name]


def normalize_text(value: str) -> str:
  return re.sub(r"\s+", " ", str(value or "").replace("\xa0", " ")).strip()


def slugify(value: str) -> str:
  normalized = normalize_text(value).lower()
  slug = re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")
  return slug or "guest"


def split_guest_names(value: str) -> list[str]:
  normalized = normalize_text(value)
  if not normalized:
    return []

  parts = re.split(r"\s*(?:&|and)\s*", normalized)
  cleaned = [part.strip(" ,") for part in parts if part.strip(" ,")]
  return cleaned


def load_existing_tokens(path: Path) -> Dict[str, dict]:
  if not path.exists():
    return {}

  with path.open(encoding="utf-8") as handle:
    payload = json.load(handle)

  records = payload.get("invites", [])
  return {
    str(record.get("stable_key", "")): record
    for record in records
    if record.get("stable_key")
  }


def load_records(csv_path: Path) -> Iterable[InviteRecord]:
  with csv_path.open(encoding="utf-8-sig", newline="") as handle:
    reader = csv.DictReader(handle)
    for row in reader:
      envelope_name = normalize_text(row.get("Name on Envelope", ""))
      email = normalize_text(row.get("Email", "")).lower()
      guest_name = normalize_text(row.get("Name", ""))

      if not envelope_name or not email:
        continue

      yield InviteRecord(
        status=normalize_text(row.get("Status", "")),
        affiliation=normalize_text(row.get("Affiliation", "")),
        relation=normalize_text(row.get("Relation", "")),
        guest_name=guest_name,
        envelope_name=envelope_name,
        email=email,
      )


def create_qr_code_png(url: str, destination: Path) -> None:
  qr = qrcode.QRCode(
    version=None,
    error_correction=qrcode.constants.ERROR_CORRECT_M,
    box_size=10,
    border=4,
  )
  qr.add_data(url)
  qr.make(fit=True)

  image = qr.make_image(fill_color="black", back_color="white")
  image.save(destination)


def build_invite_url(base_url: str, token: str) -> str:
  trimmed_base = base_url.rstrip("/")
  return f"{trimmed_base}/?invite={token}"


def main() -> None:
  parser = argparse.ArgumentParser()
  parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
  parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
  parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
  parser.add_argument("--contact-email", default="wedding@baokrakoff.com")
  args = parser.parse_args()

  csv_path = args.input.resolve()
  output_dir = args.output_dir.resolve()
  qr_dir = output_dir / "qr"
  qr_dir.mkdir(parents=True, exist_ok=True)

  manifest_path = output_dir / "invite_manifest.json"
  existing_tokens = load_existing_tokens(manifest_path)

  invites: list[dict] = []

  for index, record in enumerate(load_records(csv_path), start=1):
    existing = existing_tokens.get(record.stable_key, {})
    token = existing.get("token") or secrets.token_urlsafe(18)
    slug = existing.get("slug") or f"{index:03d}-{slugify(record.display_name)}"
    invite_url = build_invite_url(args.base_url, token)
    qr_filename = f"{slug}.png"
    qr_path = qr_dir / qr_filename

    create_qr_code_png(invite_url, qr_path)

    invite = {
      "stable_key": record.stable_key,
      "token": token,
      "slug": slug,
      "status": record.status,
      "affiliation": record.affiliation,
      "relation": record.relation,
      "party_name": record.display_name,
      "primary_email": record.email,
      "secondary_email": "",
      "guest_names": record.guest_names,
      "max_guests": len(record.guest_names),
      "invite_url": invite_url,
      "fallback_url": f"{args.base_url.rstrip('/')}/rsvp",
      "contact_email": args.contact_email,
      "qr_code_path": str(qr_path.relative_to(ROOT_DIR)),
    }
    invites.append(invite)

  output_dir.mkdir(parents=True, exist_ok=True)

  with manifest_path.open("w", encoding="utf-8") as handle:
    json.dump(
      {
        "base_url": args.base_url,
        "contact_email": args.contact_email,
        "invites": invites,
      },
      handle,
      indent=2,
      ensure_ascii=True,
    )
    handle.write("\n")

  printable_csv_path = output_dir / "printable_invites.csv"
  with printable_csv_path.open("w", encoding="utf-8", newline="") as handle:
    writer = csv.DictWriter(
      handle,
      fieldnames=[
        "party_name",
        "primary_email",
        "invite_url",
        "fallback_url",
        "qr_code_path",
        "contact_email",
      ],
    )
    writer.writeheader()
    for invite in invites:
      writer.writerow(
        {
          "party_name": invite["party_name"],
          "primary_email": invite["primary_email"],
          "invite_url": invite["invite_url"],
          "fallback_url": invite["fallback_url"],
          "qr_code_path": invite["qr_code_path"],
          "contact_email": invite["contact_email"],
        }
      )

  supabase_csv_path = output_dir / "supabase_invites.csv"
  with supabase_csv_path.open("w", encoding="utf-8", newline="") as handle:
    writer = csv.DictWriter(
      handle,
      fieldnames=[
        "token",
        "party_name",
        "primary_email",
        "secondary_email",
        "guest_names",
        "max_guests",
      ],
    )
    writer.writeheader()
    for invite in invites:
      writer.writerow(
        {
          "token": invite["token"],
          "party_name": invite["party_name"],
          "primary_email": invite["primary_email"],
          "secondary_email": invite["secondary_email"],
          "guest_names": json.dumps(invite["guest_names"], ensure_ascii=True),
          "max_guests": invite["max_guests"],
        }
      )

  print(f"Generated {len(invites)} invites")
  print(f"Manifest: {manifest_path.relative_to(ROOT_DIR)}")
  print(f"Printable CSV: {printable_csv_path.relative_to(ROOT_DIR)}")
  print(f"Supabase CSV: {supabase_csv_path.relative_to(ROOT_DIR)}")
  print(f"QR codes: {qr_dir.relative_to(ROOT_DIR)}")


if __name__ == "__main__":
  main()

#!/usr/bin/env python3
"""
HireGenius Master Key Rotation Utility.

Rotates the at-rest AES-256-GCM master encryption key for all stored AI provider credentials.

BACKUP PROCEDURE BEFORE ROTATION:
1. Export the current AI_CONFIG_MASTER_KEY to a secure offline secrets vault (e.g. AWS Secrets Manager, 1Password).
2. Take a MongoDB snapshot/dump of the `ai_provider_credentials` collection:
     mongodump --uri="<MONGODB_URI>" --collection=ai_provider_credentials --out=backup_creds/
3. Generate a new 32-byte base64 master key:
     python -c "import os, base64; print(base64.b64encode(os.urandom(32)).decode())"
4. Run this script first with --dry-run:
     python scripts/rotate_master_key.py --new-key="<NEW_B64_KEY>" --new-key-id="v2" --dry-run
5. Perform live rotation:
     python scripts/rotate_master_key.py --new-key="<NEW_B64_KEY>" --new-key-id="v2"
6. Update AI_CONFIG_MASTER_KEY in your server environment / deployment configuration.
"""

import argparse
import asyncio
import base64
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure root directory is in sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir / "hiregenius-ai-ml-service"))

# Load service env
load_dotenv(dotenv_path=root_dir / "hiregenius-ai-ml-service" / ".env")

from app.config import settings
from app.db.mongodb import mongo_manager
from app.ai_config.crypto import (
    EncryptedCredentialPayload,
    decrypt_api_key,
    encrypt_api_key,
)
from app.ai_config.secret_store import SecretStore, default_secret_store


class DynamicSecretStore(SecretStore):
    """Temporary secret store capable of resolving both old and new master keys during rotation."""

    def __init__(self, old_key_bytes: bytes, old_key_id: str, new_key_bytes: bytes, new_key_id: str):
        self.old_key_bytes = old_key_bytes
        self.old_key_id = old_key_id
        self.new_key_bytes = new_key_bytes
        self.new_key_id = new_key_id

    def get_current_master_key_id(self) -> str:
        return self.new_key_id

    def get_master_key(self, master_key_id: str = None) -> bytes:
        target_id = master_key_id or self.new_key_id
        if target_id == self.new_key_id:
            return self.new_key_bytes
        elif target_id == self.old_key_id or target_id == "v1":
            return self.old_key_bytes
        raise ValueError(f"Unknown master_key_id: {target_id}")


async def rotate_keys(new_key_b64: str, new_key_id: str, dry_run: bool = False) -> int:
    new_key_clean = new_key_b64.strip()
    try:
        new_key_bytes = base64.b64decode(new_key_clean)
        if len(new_key_bytes) != 32:
            raise ValueError(f"New master key must decode to exactly 32 bytes (got {len(new_key_bytes)})")
    except Exception as e:
        print(f"ERROR: Invalid --new-key format: {e}", file=sys.stderr)
        return 1

    # Connect to MongoDB
    await mongo_manager.connect()
    coll = mongo_manager.get_collection("ai_provider_credentials")
    if coll is None:
        print("ERROR: Cannot connect to MongoDB ai_provider_credentials collection.", file=sys.stderr)
        return 1

    old_key_id = default_secret_store.get_current_master_key_id()
    old_key_bytes = default_secret_store.get_master_key(old_key_id)

    rot_store = DynamicSecretStore(
        old_key_bytes=old_key_bytes,
        old_key_id=old_key_id,
        new_key_bytes=new_key_bytes,
        new_key_id=new_key_id,
    )

    cursor = coll.find({})
    records = []
    async for doc in cursor:
        records.append(doc)

    print(f"\n[Master Key Rotation] Found {len(records)} credential records to process.")
    print(f"Mode: {'DRY RUN (No changes will be written)' if dry_run else 'LIVE PRODUCTION'}")
    print(f"Current Key ID: {old_key_id} -> New Key ID: {new_key_id}\n")

    success_count = 0
    failure_count = 0

    for doc in records:
        provider = doc["_id"]
        rec_version = doc.get("record_version", 1)
        print(f"Processing provider '{provider}'...", end=" ")

        try:
            # 1. Decrypt with old key
            payload = EncryptedCredentialPayload(
                ciphertext_b64=doc["ciphertext_b64"],
                nonce_b64=doc["nonce_b64"],
                master_key_id=doc.get("master_key_id", old_key_id),
                last4=doc.get("last4", "****"),
                fingerprint=doc.get("fingerprint", ""),
            )
            plain_key = decrypt_api_key(
                payload=payload,
                provider=provider,
                record_version=rec_version,
                secret_store=rot_store,
            )

            # 2. Re-encrypt with new key
            new_payload = encrypt_api_key(
                plain_key=plain_key,
                provider=provider,
                record_version=rec_version,
                secret_store=rot_store,
            )

            # 3. Update DB if not dry run
            if not dry_run:
                await coll.update_one(
                    {"_id": provider},
                    {
                        "$set": {
                            "ciphertext_b64": new_payload.ciphertext_b64,
                            "nonce_b64": new_payload.nonce_b64,
                            "master_key_id": new_key_id,
                        }
                    },
                )
            print(f"SUCCESS (last4: ***{new_payload.last4})")
            success_count += 1
        except Exception as e:
            print(f"FAILED: {e}")
            failure_count += 1

    print(f"\nSummary: {success_count} succeeded, {failure_count} failed.")

    if not dry_run and success_count > 0:
        audit_coll = mongo_manager.get_collection("ai_config_audit")
        if audit_coll is not None:
            await audit_coll.insert_one({
                "event": "MASTER_KEY_ROTATED",
                "acting_admin_id": "CLI_SCRIPT",
                "note": f"Rotated master key to {new_key_id}. Processed {success_count} records.",
            })

    await mongo_manager.close()
    return 0 if failure_count == 0 else 1


def main():
    parser = argparse.ArgumentParser(description="Rotate AES-256-GCM Master Key for AI credentials.")
    parser.add_argument("--new-key", required=True, help="New base64-encoded 32-byte master key")
    parser.add_argument("--new-key-id", default="v2", help="Identifier for the new key (default: 'v2')")
    parser.add_argument("--dry-run", action="store_true", help="Simulate without modifying database records")
    args = parser.parse_args()

    exit_code = asyncio.run(rotate_keys(new_key_b64=args.new_key, new_key_id=args.new_key_id, dry_run=args.dry_run))
    sys.exit(exit_code)


if __name__ == "__main__":
    main()

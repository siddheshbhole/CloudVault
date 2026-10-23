import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings

class EncryptionService:
    def __init__(self, master_key_b64: str = None):
        key_str = master_key_b64 or settings.CLOUDVAULT_MASTER_KEY_B64
        try:
            self.key = base64.b64decode(key_str)
            if len(self.key) != 32:
                raise ValueError("AES-256 key must be exactly 32 bytes.")
        except Exception as e:
            raise ValueError(f"Invalid Base64 master key: {e}")
        self.aesgcm = AESGCM(self.key)

    def encrypt_block(self, plaintext: bytes) -> tuple[bytes, str, str]:
        """
        Encrypts a plaintext block using AES-256-GCM with a fresh 12-byte (96-bit) nonce.
        Returns: (ciphertext_with_tag, nonce_b64, checksum_hex)
        """
        nonce = os.urandom(12)  # 96 bits recommended for GCM
        # AESGCM.encrypt appends the 16-byte authentication tag to the ciphertext
        ciphertext = self.aesgcm.encrypt(nonce, plaintext, None)
        nonce_b64 = base64.b64encode(nonce).decode('utf-8')
        import hashlib
        checksum = hashlib.sha256(plaintext).hexdigest()
        return ciphertext, nonce_b64, checksum

    def decrypt_block(self, ciphertext: bytes, nonce_b64: str) -> bytes:
        """
        Decrypts an AES-256-GCM ciphertext using the given nonce.
        Throws InvalidTag exception if tampered or wrong key.
        """
        nonce = base64.b64decode(nonce_b64)
        return self.aesgcm.decrypt(nonce, ciphertext, None)

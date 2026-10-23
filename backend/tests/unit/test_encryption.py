import pytest
import os
import base64
from cryptography.exceptions import InvalidTag
from app.services.encryption_service import EncryptionService

def test_encryption_and_decryption_match():
    key_b64 = base64.b64encode(os.urandom(32)).decode()
    service = EncryptionService(key_b64)

    plaintext = b"Super secret cloud vault project file content"
    ciphertext, nonce_b64, checksum = service.encrypt_block(plaintext)

    assert ciphertext != plaintext
    decrypted = service.decrypt_block(ciphertext, nonce_b64)
    assert decrypted == plaintext

def test_encryption_unique_nonces():
    key_b64 = base64.b64encode(os.urandom(32)).decode()
    service = EncryptionService(key_b64)

    plaintext = b"Constant content"
    c1, nonce1, _ = service.encrypt_block(plaintext)
    c2, nonce2, _ = service.encrypt_block(plaintext)

    assert nonce1 != nonce2
    assert c1 != c2

def test_tampered_ciphertext_fails():
    key_b64 = base64.b64encode(os.urandom(32)).decode()
    service = EncryptionService(key_b64)

    plaintext = b"Integrity verified data"
    ciphertext, nonce_b64, _ = service.encrypt_block(plaintext)

    # Tamper with 1 byte of ciphertext
    tampered_bytes = bytearray(ciphertext)
    tampered_bytes[0] ^= 0xFF
    tampered_ciphertext = bytes(tampered_bytes)

    with pytest.raises(Exception):
        service.decrypt_block(tampered_ciphertext, nonce_b64)

import base64
import os
import json
from typing import Dict, Any, Union
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from backend.config import settings

class EnvelopeEncryptor:
    def __init__(self, secret_key: str = None):
        if secret_key is None:
            secret_key = settings.AES_SECRET_KEY
        
        # Ensure secret key is correct length (16, 24, or 32 bytes)
        # Pad or truncate to 32 bytes (256-bit encryption key)
        self.key = secret_key.encode('utf-8')[:32].ljust(32, b'\0')
        self.aesgcm = AESGCM(self.key)

    def encrypt_string(self, plaintext: str) -> str:
        """Encrypts a plaintext string to base64 format using AES-GCM-256."""
        if not plaintext:
            return ""
        nonce = os.urandom(12)  # Recommended 12 bytes nonce for AES-GCM
        encrypted_bytes = self.aesgcm.encrypt(nonce, plaintext.encode('utf-8'), None)
        # Combine nonce and ciphertext for base64 storage
        combined = nonce + encrypted_bytes
        return base64.b64encode(combined).decode('utf-8')

    def decrypt_string(self, ciphertext_b64: str) -> str:
        """Decrypts a base64 ciphertext back to a plaintext string."""
        if not ciphertext_b64:
            return ""
        try:
            combined = base64.b64decode(ciphertext_b64.encode('utf-8'))
            nonce = combined[:12]
            ciphertext = combined[12:]
            decrypted_bytes = self.aesgcm.decrypt(nonce, ciphertext, None)
            return decrypted_bytes.decode('utf-8')
        except Exception as e:
            # Fallback or pass exception in case key mismatches
            raise ValueError(f"Decryption failed: {str(e)}")

    def encrypt_dict(self, data: Dict[str, Any]) -> str:
        """Serializes and encrypts a dictionary structure."""
        serialized = json.dumps(data)
        return self.encrypt_string(serialized)

    def decrypt_dict(self, ciphertext_b64: str) -> Dict[str, Any]:
        """Decrypts and parses base64 ciphertext into a dictionary."""
        plaintext = self.decrypt_string(ciphertext_b64)
        if not plaintext:
            return {}
        return json.loads(plaintext)

# Singleton Instance
encryptor = EnvelopeEncryptor()

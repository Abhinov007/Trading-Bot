import pytest
from src.auth import hash_password, verify_password, create_access_token, decode_access_token


def test_hash_password_returns_string():
    hashed = hash_password("secret123")
    assert isinstance(hashed, str)


def test_hash_is_not_plaintext():
    hashed = hash_password("secret123")
    assert hashed != "secret123"


def test_hash_is_different_each_time():
    # bcrypt uses a random salt — same password produces different hashes
    h1 = hash_password("secret123")
    h2 = hash_password("secret123")
    assert h1 != h2


def test_verify_password_correct():
    hashed = hash_password("mypassword")
    assert verify_password("mypassword", hashed) is True


def test_verify_password_wrong():
    hashed = hash_password("mypassword")
    assert verify_password("wrongpassword", hashed) is False


def test_verify_password_empty_string():
    hashed = hash_password("mypassword")
    assert verify_password("", hashed) is False


def test_create_access_token_returns_string():
    token = create_access_token({"sub": "user@example.com"})
    assert isinstance(token, str)


def test_create_access_token_is_jwt_format():
    token = create_access_token({"sub": "user@example.com"})
    # JWT has 3 parts separated by dots
    assert len(token.split(".")) == 3


def test_decode_access_token_valid():
    token = create_access_token({"sub": "user@example.com"})
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "user@example.com"


def test_decode_access_token_invalid():
    result = decode_access_token("not.a.valid.token")
    assert result is None


def test_decode_access_token_tampered():
    token = create_access_token({"sub": "user@example.com"})
    tampered = token[:-5] + "XXXXX"
    assert decode_access_token(tampered) is None

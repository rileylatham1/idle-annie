from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Optional as _Optional

DESCRIPTOR: _descriptor.FileDescriptor

class AuthCodeRequest(_message.Message):
    __slots__ = ("code",)
    CODE_FIELD_NUMBER: _ClassVar[int]
    code: str
    def __init__(self, code: _Optional[str] = ...) -> None: ...

class AuthResponse(_message.Message):
    __slots__ = ("session_token", "success")
    SESSION_TOKEN_FIELD_NUMBER: _ClassVar[int]
    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    session_token: str
    success: bool
    def __init__(self, session_token: _Optional[str] = ..., success: bool = ...) -> None: ...

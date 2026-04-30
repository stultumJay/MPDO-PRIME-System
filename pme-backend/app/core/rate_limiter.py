from slowapi import Limiter
from slowapi.util import get_remote_address

# This shared limiter uses the caller IP address as the key
# Routes can import this later when they need to enforce request throttling
limiter = Limiter(key_func=get_remote_address)
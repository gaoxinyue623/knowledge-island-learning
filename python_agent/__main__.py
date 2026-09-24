import uvicorn
from .app import create_app
from .config import settings_from_env

if __name__ == "__main__":
    settings = settings_from_env()
    # Do not trust X-Forwarded-For: access control uses the actual socket peer.
    uvicorn.run(create_app(settings), host=settings.host, port=settings.port,
                proxy_headers=False, workers=1, log_level="info")

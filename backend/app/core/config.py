from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    ANTHROPIC_API_KEY: str
    RAPIDAPI_KEY: str
    RAPIDAPI_HOST: str = "jsearch.p.rapidapi.com"

    RESEND_API_KEY: str
    EMAIL_FROM: str = "alerts@resumematch.app"

    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "resumes"

    class Config:
        env_file = ".env"


settings = Settings()

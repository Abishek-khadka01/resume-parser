from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    ANTHROPIC_API_KEY: str
    RAPIDAPI_KEY: str
    RAPIDAPI_HOST: str = "jsearch.p.rapidapi.com"
    RAPIDAPI_BASE_URL: str = "https://jsearch.p.rapidapi.com"
    LINKEDIN_JOBS_RAPIDAPI_HOST: str = "linkedin-job-search-api.p.rapidapi.com"
    LINKED_IN_RAPID_API_KEY: str | None = None
    LINKED_IN_RAPID_API_HOST: str | None = None
    BASE_RAPID_REQUEST_URL: str = "https://linkedin-job-search-api.p.rapidapi.com"

    RESEND_API_KEY: str
    EMAIL_FROM: str = "alerts@resumematch.app"

    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "resumes"

    GOOGLE_ORIGIN_URL : str
    GOOGLE_REDIRECT_URL : str
    GOOGLE_CLIENT_ID : str
    GOOGLE_CLIENT_SECRET : str
    SCOPES : str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

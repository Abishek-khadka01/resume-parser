from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "google/gemma-4-26b-a4b-it:free"
    HF_TOKEN: str = ""
    RAPIDAPI_KEY: str
    JSEARCH_RAPIDAPI_HOST: str = "jsearch.p.rapidapi.com"
    JSEARCH_BASE_URL: str = "https://jsearch.p.rapidapi.com"

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

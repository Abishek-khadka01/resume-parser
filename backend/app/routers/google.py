from os import environ as env
from dotenv import load_dotenv, find_dotenv

import httpx

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from authlib.integrations.starlette_client import OAuth

from app.core.database import get_db
from app.core.security import create_access_token
from app.models.user import User


load_dotenv(find_dotenv())

router = APIRouter()


oauth = OAuth()

oauth.register(
    name="google",
    client_id=env.get("GOOGLE_CLIENT_ID"),
    client_secret=env.get("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={
        "scope": "openid email profile",
        "prompt": "select_account",
    },
)


class GoogleAuthRequest(BaseModel):
    code: str


@router.get("/login")
async def google_login(request: Request):

    try:
        google = oauth.create_client("google")
        redirect_url = env.get("GOOGLE_REDIRECT_URL")
        return  await google.create_authorization_url(
            redirect_url
        )
        

    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )



async def get_user_details_from_google(access_token: str):
    async with httpx.AsyncClient() as client:

        response = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={
                "Authorization": f"Bearer {access_token}"
            }
        )

    response.raise_for_status()

    data = response.json()

    return {
        "google_id": data["sub"],
        "email": data.get("email"),
        "name": data.get("name"),
        "picture": data.get("picture"),
        "email_verified": data.get("email_verified", False),
    }


def save_user(
    user_info: dict,
    db: Session
):

    existing_user = (
        db.query(User)
        .filter(User.provider_id == user_info["google_id"])
        .first()
    )

    if existing_user:
        return existing_user

    email_user = (
        db.query(User)
        .filter(User.email == user_info["email"])
        .first()
    )

    if email_user:

        email_user.provider_id = user_info["google_id"]
        email_user.auth_provider = "google"

        db.commit()
        db.refresh(email_user)

        return email_user

    new_user = User(
        email=user_info["email"],
        auth_provider="google",
        provider_id=user_info["google_id"],
        password_hash=None,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user



@router.post("/callback")
async def google_callback(
    body: GoogleAuthRequest,
    db: Session = Depends(get_db),
):
    try:

        code = body.code
        print("the code received is ", code )
        token_response_data = {
            "code": code,
            "client_id": env.get("GOOGLE_CLIENT_ID"),
            "client_secret": env.get("GOOGLE_CLIENT_SECRET"),
            "redirect_uri": env.get("GOOGLE_REDIRECT_URL"),
            "grant_type": "authorization_code",
        }

        async with httpx.AsyncClient() as client:

            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data=token_response_data,
            )

        token_response.raise_for_status()

        tokens = token_response.json()

        print("the tokens is ", tokens)
        access_token_google = tokens["access_token"]

        user_info = await get_user_details_from_google(
            access_token_google
        )

        print("the user info is ", user_info)

        user = save_user(
            user_info=user_info,
            db=db,
        )

        app_access_token = create_access_token(
            {
                "sub": str(user.id),
                "email": user.email,
            }
        )

        return {
            "user": {
                "id": str(user.id),
                "email": user.email,
                "name": user_info.get("name"),
                "picture": user_info.get("picture"),
                "provider": "google",
            },
            "access_token": app_access_token,
            "token_type": "bearer",
        }

    except httpx.HTTPStatusError as e:
        print("the httpx exception ", e )
        raise HTTPException(
            status_code=400,
            detail=f"Google OAuth error: {e.response.text}",
        )

    except Exception as e:
        print("The exception occured", e )
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )
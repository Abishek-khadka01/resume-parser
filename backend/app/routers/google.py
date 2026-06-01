
from app.core.security import create_access_token
from app.core.database import get_db
from sqlalchemy.orm import Session
from pydantic import BaseModel
from authlib.integrations.httpx_client import OAuth2Client
from fastapi import APIRouter, Depends , HTTPException, FastAPI 
from starlette.requests import Request
from os import environ as env
from dotenv import load_dotenv, find_dotenv
from authlib.integrations.starlette_client import OAuth
import httpx 


load_dotenv(find_dotenv())

class GoogleAuthRequest(BaseModel):
    code : str


router= APIRouter() 
oauth = OAuth()

oauth.register(
    name="google", 
    client_id=env.get("GOOGLE_CLIENT_ID"),
    client_secret=env.get("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": 'openid email profile',
     'prompt': 'select_account' 
    },
)


@router.get("/login")
async def getGoogleUrlwithCallBack(request :Request):
    try:
        google = oauth.create_client("google")
        callback_url = env.get("GOOGLE_REDIRECT_URL")   
        return await google.create_authorization_url(callback_url)
    except Exception as e:
        print(str(e))
        raise HTTPException(status_code=500, detail=str(e))


oauth_client = OAuth2Client(
    client_id=env.get("GOOGLE_CLIENT_ID"),
    client_secret=env.get("GOOGLE_CLIENT_SECRET"),
    token_endpoint_url="https://accounts.google.com/o/oauth2/token",
    userinfo_endpoint="https://www.googleapis.com/oauth2/v3/userinfo",
)
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

@router.post("/callback")
async def google_callback(body : GoogleAuthRequest):
    code = body.code 
      
    url = "https://oauth2.googleapis.com/token"

    data = {
        "code": code,
        "client_id": env.get('GOOGLE_CLIENT_ID'),
        "client_secret": env.get('GOOGLE_CLIENT_SECRET'),
        "redirect_uri": env.get("GOOGLE_REDIRECT_URL"),
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, data=data)

    details =  response.json()
    
    user = await get_user_details_from_google(details["access_token"])

    # creating of the custom accesstoken and not the users 
    access_token = create_access_token({
        "sub": str(user["sub"]), "email": user["email"]}
    )

    return {
        "user": user,
        "access_token": access_token,
        "token_type": "bearer",
    }   

    




async def get_user_details_from_google(access_token: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={
                "Authorization": f"Bearer {access_token}"
            }
        )

    response.raise_for_status()

    user = response.json()

    return {
        "google_id": user["sub"],
        "email": user.get("email"),
        "name": user.get("name"),
        "picture": user.get("picture"),
        "email_verified": user.get("email_verified", False)
    }



def save_user(idtoken :str , otherdetails, db : Session = Depends(get_db))->None:
    try:

    
    except:
        
    





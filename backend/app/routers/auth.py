from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.models.profile import Profile
from app.schemas.user import UserCreate, UserOut , UserLogin
from app.core.security import verify_password
from app.core.config import Settings
from fastapi import Response

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=201)
def register(body: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=body.email, password_hash=hash_password(body.password), auth_provider="local")
    db.add(user)
    db.flush()
    db.add(Profile(user_id=user.id))
    db.commit()
    db.refresh(user)
    return user




@router.post('/login')
def userLogin(request : UserLogin, db : Session = Depends(get_db)): 
    user = db.query(User).filter(User.email == request.email).first() 
    if not user: 
        raise HTTPException(status_code=400, detail='User do not exists')
    print(user)
    checkpassword : bool = verify_password(request.password, user['password_hash'] )
    
    if not checkpassword:
        raise HTTPException(status_code=400, detail="Invalid Credentials")
    
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {
        "user" : user , 
        "access_token": token,
        "token_type": "bearer"}
    
    
@router.post('/logout')
def logout(response : Response):
    # This is done by the frontend to remove the accesstoken and the refreshtokenn from the cookie 
    # if exists
    response.delete_cookie("refreshToken")
  
    return {
        "message" :"User logout successful"
    }
    
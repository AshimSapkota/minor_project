
from fastapi import FastAPI, File, UploadFile, HTTPException,Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from typing import List
import uuid  # To generate unique IDs for each request
from datetime import datetime, timedelta
from utils import preprocess_folder, predictResume, extract_email_from_text, extract_text_from_pdf, model, cos_sim, Preprocessfile

# Dummy user database
fake_users_db = {
    "admin": {
        "username": "admin",
        "full_name": "Admin User",
        "password" : "admin123",
        "role": "admin",
    },
    "user": {
        "username": "user",
        "full_name": "Regular User",
        "password" : "user123",
        "role": "user",
    },
}

SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (POST, GET, OPTIONS, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Temporary folder to store uploaded files
UPLOAD_FOLDER = "temp"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme=OAuth2PasswordBearer(tokenUrl="token")

# Function to clean up old request folders before processing a new one
def cleanup_old_folders():
    # List all folders in the UPLOAD_FOLDER and remove them if they are older than a specific threshold
    for folder_name in os.listdir(UPLOAD_FOLDER):
        folder_path = os.path.join(UPLOAD_FOLDER, folder_name)
        if os.path.isdir(folder_path):
            shutil.rmtree(folder_path, ignore_errors=True)

class User(BaseModel):
    username: str
    full_name: str
    role: str


# def verify_password(plain_password, hashed_password):
#     return pwd_context.verify(plain_password, hashed_password)


def authenticate_user(username: str, password: str):
    user = fake_users_db.get(username)
    if not user or user['password']!= password :
        return None
    return User(**user)


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = fake_users_db.get(username)
        if user is None:
            raise HTTPException(status_code=401, detail="Invalid user")
        return User(**user)
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")


@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user.username, "role": user.role}, 
                                       expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}


@app.get("/users/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.post("/upload/")
async def upload_files(resumes: List[UploadFile], job_description: UploadFile = File(...),current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "user"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    try:
        # Clean up old folders before processing the new request
        cleanup_old_folders()

        # Generate a unique ID for this request
        request_id = str(uuid.uuid4())
        request_folder = os.path.join(UPLOAD_FOLDER, request_id)
        os.makedirs(request_folder, exist_ok=True)

        # Save the job description PDF
        job_description_path = os.path.join(request_folder, job_description.filename)
        with open(job_description_path, "wb") as buffer:
            shutil.copyfileobj(job_description.file, buffer)

        # Save the resume PDFs
        resume_folder = os.path.join(request_folder, "resumes")
        os.makedirs(resume_folder, exist_ok=True)
        for resume in resumes:
            resume_path = os.path.join(resume_folder, resume.filename)
            with open(resume_path, "wb") as buffer:
                shutil.copyfileobj(resume.file, buffer)

        # Preprocess the job description
        jobdes = Preprocessfile(job_description_path)

        # Preprocess the resumes
        preprocessed_resumes = preprocess_folder(resume_folder)

        # Encode the job description
        job_embedding = model.encode(jobdes)

        # Encode the resumes
        resume_texts = [resume for resume, filename, email, resume_title, name in preprocessed_resumes]
        resume_embeddings = model.encode(resume_texts)

        # Calculate similarity scores
        similarity_scores = cos_sim(job_embedding, resume_embeddings)
        similarity_scores = similarity_scores.flatten().tolist()

        # Rank resumes
        ranked_resumes = sorted(zip(preprocessed_resumes, similarity_scores), key=lambda x: x[1], reverse=True)

        # Create a DataFrame for the results
        results = []
        for (resume_text, filename, email, resume_title,name), score in ranked_resumes:
            results.append({
                "Name": name,
                "Resume Filename" : filename,
                "Email": email,
                "Category": resume_title,
                "Similarity Score": round(score * 100, 2)  # Convert to percentage
            })

        # Return the results as JSON
        return JSONResponse(content={"results": results, "request_id": request_id})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout route to inform client to discard the token."""
    # In a stateless JWT system, logout is just removing the token on the client side.
    return {"message": "Successfully logged out. Please remove your token from storage."}


@app.get("/download/{request_id}/{filename}")
async def download_file(request_id: str, filename: str):
    """Serve resumes for download"""
    file_path = os.path.join(UPLOAD_FOLDER, request_id, "resumes", filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, filename=filename)
    raise HTTPException(status_code=404, detail="File not found")   

@app.get("/")
def read_root():
    return {"message": "Resume Matcher Backend"}

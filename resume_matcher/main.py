
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from typing import List
import uuid  # To generate unique IDs for each request
from utils import preprocess_folder, predictResume, extract_email_from_text, extract_text_from_pdf, model, cos_sim, Preprocessfile

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

# Function to clean up old request folders before processing a new one
def cleanup_old_folders():
    # List all folders in the UPLOAD_FOLDER and remove them if they are older than a specific threshold
    for folder_name in os.listdir(UPLOAD_FOLDER):
        folder_path = os.path.join(UPLOAD_FOLDER, folder_name)
        if os.path.isdir(folder_path):
            shutil.rmtree(folder_path, ignore_errors=True)

@app.post("/upload/")
async def upload_files(resumes: List[UploadFile], job_description: UploadFile = File(...)):
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

# %%
from gensim.models import Word2Vec
import string
import re
import os
import collections
from os import listdir
from os.path import isfile, join
from joblib import dump, load
import pickle
from io import StringIO
import pandas as pd
from collections import Counter
import en_core_web_sm
nlp = en_core_web_sm.load()
from spacy.matcher import PhraseMatcher
from itertools import chain
import textract
from gensim.models import Word2Vec
import string
import re
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import gensim
from gensim.models.phrases import Phraser, Phrases
import nltk
import collections
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import CountVectorizer
nltk.download('punkt')
nltk.download('stopwords')
import fitz
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import make_pipeline
from joblib import dump
import torch
from torch.utils.data import DataLoader
from sentence_transformers import SentenceTransformer, InputExample, losses, evaluation
from sentence_transformers import datasets as st_datasets
from sentence_transformers.evaluation import EmbeddingSimilarityEvaluator
from sklearn.model_selection import train_test_split
from sentence_transformers.util import cos_sim

def cleanResume(resumeText):
    resumeText = re.sub(r'http\S+\s*', ' ', resumeText)  # Removing URLs
    resumeText = re.sub(r'RT|cc', ' ', resumeText)  # Removing 'RT' and 'cc'
    resumeText = re.sub(r'#\S+', '', resumeText)  # Removing hashtags
    resumeText = re.sub(r'@\S+', '  ', resumeText)  # Replacing mentions with spaces
    resumeText = re.sub(r'[!"#$%&\'()*+,-./:;<=>?@[\]^_`{|}~]', ' ', resumeText)  # Removing punctuation
    resumeText = re.sub(r'[^\x00-\x7f]', ' ', resumeText)  # Removing non-ASCII characters
    resumeText = re.sub(r'\s+', ' ', resumeText)  # Replacing multiple spaces with a single space
    return resumeText

def Preprocessfile(filename):
  text = textract.process(filename)
  text= text.decode('utf-8').replace("\\n", " ")
  # print(text)
  x=[]
  tokens=word_tokenize(text)
  tok=[w.lower() for w in tokens]
  table=str.maketrans('','',string.punctuation)
  strpp=[w.translate(table) for w in tok]
  words=[word for word in strpp if word.isalpha()]
  stop_words=set(stopwords.words('english'))
  words=[w for w in words if not w in stop_words]
  x.append(words)
  # print(x)
  res=" ".join(chain.from_iterable(x))
  return res




def predictResume(filename):
  text = textract.process(filename)
  text= text.decode('utf-8').replace("\\n", " ")
  text=cleanResume(text)
  text=[text]
  text=np.array(text)
  vectorizer = pickle.load(open("vectorizer.pickle", "rb"))
  resume = vectorizer.transform(text)
  model = load('model.joblib') 
  result=model.predict(resume)
  labeldict={
    0:'Arts',
    1:'Automation Testing',
    2:'Operations Manager',
    3:'DotNet Developer',
    4:'Civil Engineer',
    5:'Data Science',
    6:'Database',
    7:'DevOps Engineer',
    8:'Business Analyst',
    9:'Health and fitness',
    10:'HR',
    11:'Electrical Engineering',
    12:'Java Developer',
    13:'Mechanical Engineer',
    14:'Network Security Engineer',
    15:'Blockchain ',
    16:'Python Developer',
    17:'Sales',
    18:'Testing',
    19:'Web Designing'
  }
  return result[0]


model = SentenceTransformer('C:/Users/ashim/OneDrive/Desktop/project/fine_tuned_bert')


def extract_email_from_text(text):
    # Define a regex pattern for email extraction
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    # Find all matching emails
    match=re.search(email_pattern, text)
    # Return the first email found or an empty string if no email is found
    if match:
        return match.group(0)
    else:
        return ""


def extract_text_from_pdf(pdf_path):
    # Open the PDF file
    doc = fitz.open(pdf_path)
    text = ""
    
    # Extract text from all pages of the PDF
    for page_num in range(doc.page_count):
        page = doc.load_page(page_num)
        text += page.get_text()
    # print(text)
    return text

def extract_name(resume_text):
    # Regular expression for detecting names (assumes first and last name)
    name_pattern = r'\b([A-Z][a-z]+)\s([A-Z][a-z]+)\b'
    
    # Search for a match
    match = re.search(name_pattern, resume_text)
    
    if match:
        # Return the full name (first + last)
        return match.group(0)
    else:
        return " " 
        
# Function to preprocess all the PDF files in the folder and place them as a list of strings along with filenames
def preprocess_folder(folder_path):
    # Initialize an empty list to store the preprocessed resumes and their filenames
    preprocessed_resumes = []
    # emails=[]

    for resume_file in os.listdir(folder_path):
        # Ensure that the file is a PDF
        if resume_file.endswith('.pdf'):
            resume_path = os.path.join(folder_path, resume_file)
            resume = Preprocessfile(resume_path)  # Process the resume text
            resume_text=extract_text_from_pdf(resume_path)
            name=extract_name(resume_text)
            email=extract_email_from_text(resume_text)
            resume_title=predictResume(resume_path)
            preprocessed_resumes.append((resume, resume_file,email,resume_title,name))  # Store tuple of (resume_text, filename)
            # emails.append(email) # Store tuple of (resume_text, filename)
    return preprocessed_resumes

# Define the path to the folder containing resumes
# resume_folder = "C:/Users/ashim/OneDrive/Desktop/project/resume"  # Replace with the path to your folder containing resumes
# job_description_path = "C:/Users/ashim/OneDrive/Desktop/project/hr.txt"  # Path to your job description file

# # Preprocess the job description outside the loop
# jobdes = Preprocessfile(job_description_path)
# # print(jobdes)
# print('******************')
# job_embedding = model.encode(jobdes)

# # Preprocess the resumes and store both text and filenames
# preprocessed_resumes= preprocess_folder(resume_folder)

# resume_texts = [resume for resume, filename,email,resume_title in preprocessed_resumes]

# # Encode the resume texts
# resume_embeddings = model.encode(resume_texts)

# # Calculate similarity scores
# similarity_scores = cos_sim(job_embedding, resume_embeddings)
# similarity_scores = similarity_scores.flatten().tolist()  # Ensures a 1D list

# # Sort resumes based on similarity score
# ranked_resumes = sorted(zip(preprocessed_resumes, similarity_scores), key=lambda x: x[1], reverse=True)

# #
# df_results = pd.DataFrame(
#     [(filename, email,resume_title, score) for (resume_text, filename, email,resume_title), score in ranked_resumes],
#     columns=["Resume Filename", "Email","category","Similarity Score"]
# )


# # Print the results dataframe
# print(df_results)


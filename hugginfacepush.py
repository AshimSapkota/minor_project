from huggingface_hub import HfApi

# Define repository details
model_folder = "./fine_tuned_bert/"  # Path to your fine-tuned model folder
repo_id = "maashimho/tuned_for_project"  # Your Hugging Face repo ID

# Initialize API
api = HfApi()

# Upload entire folder to the repository
api.upload_folder(
    folder_path=model_folder,  # Local directory to upload
    path_in_repo="",  # Upload at the root of the repo
    repo_id=repo_id,  # Repository ID
    repo_type="model"  # Ensure it's a model repository
)

print("Model uploaded successfully!")

import subprocess
import os
import shutil
import zipfile

def create_transformers_layer():
    # Create a temporary directory for the layer
    layer_dir = "transformers_layer"
    python_dir = os.path.join(layer_dir, "python")
    
    if os.path.exists(layer_dir):
        shutil.rmtree(layer_dir)
    
    os.makedirs(python_dir)
    
    # Install transformers to the layer directory
    subprocess.check_call([
        "pip", "install", 
        "transformers==4.44.2", 
        "requests==2.31.0",
        "python-dotenv==1.0.0",
        "-t", python_dir
    ])
    
    # Create a zip file
    shutil.make_archive("transformers_layer", "zip", layer_dir)
    
    print(f"Layer created: {os.path.abspath('transformers_layer.zip')}")
    print("Upload this file to an S3 bucket for use with Lambda Layers")

if __name__ == "__main__":
    create_transformers_layer()
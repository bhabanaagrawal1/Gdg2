from flask import Flask, request, jsonify
from PIL import Image
import torch
from torchvision import models, transforms

app = Flask(__name__)

# Load model
model = models.resnet18(pretrained=True)
model.eval()
model = torch.nn.Sequential(*list(model.children())[:-1])

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])

def get_embedding(image):
    image = transform(image).unsqueeze(0)
    with torch.no_grad():
        return model(image).flatten()

def cosine_similarity(a, b):
    return torch.nn.functional.cosine_similarity(a, b, dim=0).item()


@app.route("/compare", methods=["POST"])
def compare():
    try:
        print("FILES RECEIVED:", request.files)   # 👈 ADD THIS

        if "query_image" not in request.files or "target_image" not in request.files:
            print("Missing images!")              # 👈 ADD THIS
            return jsonify({"error": "Images missing"}), 400

        img1 = Image.open(request.files["query_image"]).convert("RGB")
        img2 = Image.open(request.files["target_image"]).convert("RGB")

        emb1 = get_embedding(img1)
        emb2 = get_embedding(img2)

        similarity = cosine_similarity(emb1, emb2)

        return jsonify({"similarity": float(similarity)})

    except Exception as e:
        print("ERROR:", str(e))                   # 👈 ADD THIS
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=5000, debug=True)
from flask import Flask, request
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client
import os

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)

# Enable CORS
CORS(app)

# Connect to Supabase
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# Home route
@app.route("/")
def home():
    return {
        "message": "Voya Backend Running"
    }

# Test route
@app.route("/hello")
def hello():
    return {
        "message": "hello afreen"
    }

# Test database read
@app.route("/test-db")
def test_db():

    data = supabase.table("users").select("*").execute()

    return {
        "success": True,
        "data": data.data
    }

# Test database insert
@app.route("/signup-test")
def signup_test():

    result = supabase.table("users").insert({
        "email": "afreen@test.com"
    }).execute()

    return {
        "success": True,
        "user": result.data
    }

# Actual signup API
@app.route("/send-otp", methods=["POST"])
def send_otp():
    email = request.json["email"]

    supabase.auth.sign_in_with_otp({
        "email": email
    })

    return {"success": True}

#verify otp
@app.route("/verify-otp", methods=["POST"])
def verify_otp():
    return {"success": True}

# Run app
if __name__ == "__main__":
    app.run(debug=True)
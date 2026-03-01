from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuizAnswers(BaseModel):
    q1: int
    q2: int
    q3: int

@app.get("/")
def health_check():
    return {"status": "The Brain is online and ready for chaos."}

@app.post("/api/quiz")
def calculate_budget(answers: QuizAnswers):
# dummy data for now ( will replace after implementing the model)
    return {
        "persona": "Uber Eats Addict",
        "monthly_limit": 500.00,
        "recommended_theme": "brainrot"
    }
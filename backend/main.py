import os
import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.cluster import KMeans
from supabase import Client, create_client

# 1. Environment & Database Setup
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 2. FastAPI App Initialization
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Pydantic Models (Input Validation)
class QuizAnswers(BaseModel):
    user_id: str
    username: str  
    takeout_frequency: int
    impulse_buy_score: int
    entertainment_spend: int
    selected_theme: str


class ExpenseTracker(BaseModel):
    user_id: str
    amount: float
    description: str


class PersonaGenerator:
    def __init__(self) -> None:
        self.core_by_cluster = {
            0: "Saver",
            1: "Balanced",
            2: "Spender",
        }

        self.suffix_candidates = [
            "of the SkipTheDishes",
            "the Gacha-Lord",
            "the Math-Wizard",
            "of Midnight Checkouts",
            "the Coupon Raider",
            "of Infinite Tabs",
            "the Cart Hoarder",
            "of the 2AM Deals",
        ]

    def _prefix_from_volume(self, takeout: int, impulse: int, entertainment: int) -> str:
        volume_score = takeout + impulse + entertainment
        if volume_score <= 9:
            return "Micro"
        if volume_score <= 16:
            return "Macro"
        if volume_score <= 23:
            return "Mega"
        return "Galactic"

    def _core_from_cluster(self, cluster_id: int) -> str:
        return self.core_by_cluster.get(cluster_id, "Balanced")

    def _behavior_suffix(self, cluster_id: int, takeout: int, impulse: int, entertainment: int) -> str:
        score = (cluster_id * 11) + (takeout * 3) + (impulse * 5) + (entertainment * 7)

        candidates = list(self.suffix_candidates)
        if impulse >= 8:
            candidates.extend(["the Doom-Scroller", "of One-Click Regret"])
        if takeout >= 8:
            candidates.extend(["of Drive-By Dumplings", "the Delivery Disciple"])
        if entertainment >= 8:
            candidates.extend(["of Premium Seasons", "the Side-Quest Sponsor"])
        if takeout <= 2 and impulse <= 2:
            candidates.extend(["the Spreadsheet Monk", "of Budget Enlightenment"])

        return candidates[score % len(candidates)]

    def _monthly_limit(self, cluster_id: int, takeout: int, impulse: int, entertainment: int) -> float:
        base = {0: 320.0, 1: 480.0, 2: 620.0}.get(cluster_id, 450.0)
        adjustment = (takeout * 12.0) + (entertainment * 8.0) - (impulse * 5.0)
        limit = max(180.0, min(1200.0, base + adjustment))
        return round(limit, 2)

    def _theme(self, impulse: int, selected_theme: str) -> str:
        # Override only if they chose vanilla but have chaotic spending
        if selected_theme == "vanilla" and impulse > 7:
            return "brainrot"
        
        # Otherwise, let them keep pink, brainrot, or vanilla
        return selected_theme

    def _roast(self, impulse: int) -> str:
        if impulse <= 2:
            return "You hesitate so hard at checkout that even free trials feel judged."
        if impulse <= 4:
            return "You call it intentional spending; your cart calls it emotional buffering."
        if impulse <= 6:
            return "Your impulse control is decent, but flash sales still have your home address."
        if impulse <= 8:
            return "You and the 'Buy Now' button are in a committed relationship."
        return "Your impulse score is so high even your wallet enabled airplane mode."

    def generate(self, cluster_id: int, takeout: int, impulse: int, entertainment: int, selected_theme: str) -> dict:
        prefix = self._prefix_from_volume(takeout, impulse, entertainment)
        core = self._core_from_cluster(cluster_id)
        suffix = self._behavior_suffix(cluster_id, takeout, impulse, entertainment)

        return {
            "persona": f"{prefix} {core} {suffix}",
            "theme": self._theme(impulse, selected_theme),
            "limit": self._monthly_limit(cluster_id, takeout, impulse, entertainment),
            "roast": self._roast(impulse),
        }

# 4. Global Machine Learning Model & Generator Instance
kmeans_model: KMeans | None = None
persona_generator = PersonaGenerator()

# 5. Startup Event (Train the Brain ONCE when the server boots)
@app.on_event("startup")
def train_kmeans_model() -> None:
    global kmeans_model

    # Synthetic training data
    student_spending_df = pd.DataFrame([
        {"takeout": 9, "impulse": 8, "entertainment": 9},
        {"takeout": 8, "impulse": 7, "entertainment": 8},
        {"takeout": 7, "impulse": 9, "entertainment": 7},
        {"takeout": 2, "impulse": 2, "entertainment": 3},
        {"takeout": 3, "impulse": 1, "entertainment": 2},
        {"takeout": 1, "impulse": 3, "entertainment": 1},
        {"takeout": 5, "impulse": 4, "entertainment": 5},
        {"takeout": 4, "impulse": 5, "entertainment": 4},
        {"takeout": 6, "impulse": 5, "entertainment": 6},
        {"takeout": 5, "impulse": 6, "entertainment": 5},
    ])

    # K-Means algorithm looking for 3 core financial archetypes
    kmeans_model = KMeans(n_clusters=3, random_state=42, n_init=10)
    kmeans_model.fit(student_spending_df[["takeout", "impulse", "entertainment"]])

# 6. Main API Endpoint
@app.post("/api/quiz")
def handle_quiz_submission(payload: QuizAnswers):
    if kmeans_model is None:
        raise HTTPException(status_code=500, detail="Model is not initialized")

    # Format the incoming user data for the model
    input_df = pd.DataFrame([{
        "takeout": payload.takeout_frequency,
        "impulse": payload.impulse_buy_score,
        "entertainment": payload.entertainment_spend,
    }])

    # Predict the cluster (0, 1, or 2)
    cluster = int(kmeans_model.predict(input_df)[0])

    generated = persona_generator.generate(
        cluster,
        payload.takeout_frequency,
        payload.impulse_buy_score,
        payload.entertainment_spend,
        payload.selected_theme,
    )

    # Save the dynamically generated profile to Supabase
    try:
        supabase.table("profiles").upsert({
            "id": payload.user_id,
            "username": payload.username, 
            "persona": generated["persona"],
            "theme_preference": generated["theme"],
            "monthly_limit": generated["limit"],
            "roast": generated["roast"],
        }).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database failure: {exc}")

    # Return the data to the Next.js frontend
    return {
        "message": "Persona generated successfully.",
        "persona": generated["persona"],
        "monthly_limit": generated["limit"],
        "theme": generated["theme"],
        "roast": generated["roast"],
    }

@app.get("/api/leaderboard")
def get_leaderboard():
    try:
        response = supabase.table("profiles").select("id, username, persona, monthly_limit").order("monthly_limit", desc=False).execute()
        return {"rankings": response.data}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database failure: {exc}")


@app.get("/api/profile/{user_id}")
def get_user_profile(user_id: str):
    try:
        response = (
            supabase
            .table("profiles")
            .select("persona, theme_preference, monthly_limit, roast")
            .eq("id", user_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/spend")
def log_expense(payload: ExpenseTracker):
    try:
        response = (
            supabase
            .table("profiles")
            .select("monthly_limit")
            .eq("id", payload.user_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found.")

        current_limit = response.data[0].get("monthly_limit", 0)
        new_limit = current_limit - payload.amount

        supabase.table("profiles").update({"monthly_limit": new_limit}).eq("id", payload.user_id).execute()

        supabase.table("expenses").insert({
            "user_id": payload.user_id,
            "amount": payload.amount,
            "description": payload.description,
        }).execute()

        return {"message": "Expense logged.", "new_limit": new_limit}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database failure: {exc}")
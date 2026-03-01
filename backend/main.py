import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from supabase import Client, create_client

# 1. Environment & Database Setup
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Pydantic Models

class QuizSubmission(BaseModel):
    user_id: str
    username: str | None = None
    rent: float
    income: float
    debt: float
    subscriptions: float
    caffeine: str
    advisor: str
    justification: str
    takeout: str
    crypto: str
    weekend: str
    selected_theme: Optional[str] = "vanilla"

class ExpenseTracker(BaseModel):
    user_id: str
    amount: float
    description: str

class GroupExpense(BaseModel):
    group_id: str
    payer_id: str
    amount: float
    description: str

class CreateGroup(BaseModel):
    name: str
    created_by: str

class AddGroupMembers(BaseModel):
    group_id: str
    user_ids: list[str]

class SettleDebt(BaseModel):
    user_id: str
    group_id: str
    amount: float

# 3. Vibe Check Engine (Heuristics & Math)

def determine_theme(answers: QuizSubmission) -> str:
    brainrot_flags = ["TikTok Finance Bros", "Dogecoin Bagholder", "3 Celsius Cans", "Rotting in bed"]
    
    if answers.justification == "Girl Math" or answers.caffeine == "Matcha ✨":
        return "girlmath"
    elif answers.advisor in brainrot_flags or answers.crypto == "Dogecoin Bagholder":
        return "brainrot"
    return "vanilla"

def generate_persona(answers: QuizSubmission) -> str:
    if answers.caffeine == "Matcha ✨" and answers.weekend == "$80 Brunch":
        return "Delusional Material Girl"
    if answers.crypto == "Dogecoin Bagholder" and answers.advisor == "TikTok Finance Bros":
        return "Sigma Grindset Victim"
    if answers.caffeine == "3 Celsius Cans" and answers.weekend == "Grinding Leetcode":
        return "Overcaffeinated Code Monkey"
    if answers.takeout == "I cook" and answers.crypto == "Sensible BTC":
        return "Boring but Wealthy"
    return "Financially Cooked Civilian"

def generate_roast(answers: QuizSubmission) -> str:
    if answers.justification == "Girl Math":
        return "You call it Girl Math; your bank calls it a fast track to bankruptcy."
    if answers.advisor == "TikTok Finance Bros":
        return "Taking financial advice from a 19-year-old on TikTok is why you're here."
    if answers.takeout != "I cook":
        return "Your delivery driver knows you better than your accountant does."
    return "Your finances are hanging by a thread, but at least you're honest."

# 4. Core Endpoints

@app.get("/")
def health_check():
    return {"status": "ok"}

@app.post("/api/quiz")
def handle_vibe_check(payload: QuizSubmission):
    try:
        # The Cooked Math Engine
        base_discretionary = payload.income - payload.rent - payload.debt
        
        # The Delusion Multiplier
        multiplier = 1.0
        if payload.justification == "Girl Math" or payload.advisor == "TikTok Finance Bros":
            multiplier = 0.8
        
        adjusted_base = base_discretionary * multiplier
        
        # Estimate takeout cost based on selection
        takeout_cost = 400.0 if payload.takeout != "I cook" else 100.0
        
        final_budget = adjusted_base - payload.subscriptions - takeout_cost
        
        # Force $0 if they are in the negatives
        if final_budget < 0:
            final_budget = 0.0

        calculated_theme = determine_theme(payload)
        calculated_persona = generate_persona(payload)
        calculated_roast = generate_roast(payload)

        # Database Upsert
        profile_payload = {
            "id": payload.user_id,
            "persona": calculated_persona,
            "monthly_limit": round(final_budget, 2),
            "theme_preference": calculated_theme,
            "roast": calculated_roast
        }
        if payload.username:
            profile_payload["username"] = payload.username

        supabase.table("profiles").upsert(profile_payload).execute()

        return {
            "message": "Vibe check complete.",
            "persona": calculated_persona,
            "monthly_limit": round(final_budget, 2),
            "forced_theme": calculated_theme,
            "roast": calculated_roast
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.get("/api/leaderboard")
def get_leaderboard():
    try:
        response = (
            supabase
            .table("profiles")
            .select("id, username, persona, monthly_limit")
            .order("monthly_limit", desc=False)
            .execute()
        )
        return {"rankings": response.data or []}
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

        current_limit = response.data[0].get("monthly_limit", 0) or 0
        new_limit = current_limit - payload.amount

        supabase.table("profiles").update({"monthly_limit": new_limit}).eq("id", payload.user_id).execute()

        supabase.table("expenses").insert(
            {
                "user_id": payload.user_id,
                "amount": payload.amount,
                "description": payload.description,
            }
        ).execute()

        return {"message": "Expense logged.", "new_limit": new_limit}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database failure: {exc}")

# 5. Group Endpoints (Splitwise Logic)

@app.get("/api/profiles/all")
def get_all_profiles():
    try:
        response = supabase.table("profiles").select("id, username").execute()
        return {"profiles": response.data or []}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.post("/api/groups")
def create_group(payload: CreateGroup):
    try:
        result = (
            supabase.table("groups")
            .insert({"name": payload.name, "created_by": payload.created_by})
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create group")
        return {"group": result.data[0]}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.post("/api/groups/members")
def add_group_members(payload: AddGroupMembers):
    try:
        rows = [{"group_id": payload.group_id, "user_id": uid} for uid in payload.user_ids]
        supabase.table("group_members").insert(rows).execute()
        return {"message": f"Added {len(rows)} member(s) to the group."}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.get("/api/groups/{user_id}")
def get_user_groups(user_id: str):
    try:
        memberships = (
            supabase.table("group_members")
            .select("group_id")
            .eq("user_id", user_id)
            .execute()
        )
        group_ids = [m["group_id"] for m in (memberships.data or [])]
        if not group_ids:
            return {"groups": []}

        groups = (
            supabase.table("groups")
            .select("id, name, created_by")
            .in_("id", group_ids)
            .execute()
        )

        enriched = []
        for g in groups.data or []:
            members = (
                supabase.table("group_members")
                .select("user_id")
                .eq("group_id", g["id"])
                .execute()
            )
            g["members"] = [m["user_id"] for m in (members.data or [])]
            enriched.append(g)

        return {"groups": enriched}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.get("/api/groups/{group_id}/balances")
def get_group_balances(group_id: str):
    try:
        members_res = (
            supabase.table("group_members")
            .select("user_id")
            .eq("group_id", group_id)
            .execute()
        )
        member_ids = [m["user_id"] for m in (members_res.data or [])]
        if not member_ids:
            return {"balances": []}

        expenses_res = (
            supabase.table("expenses")
            .select("user_id, amount")
            .eq("group_id", group_id)
            .execute()
        )

        totals: dict[str, float] = {uid: 0.0 for uid in member_ids}
        for row in expenses_res.data or []:
            uid = row["user_id"]
            if uid in totals:
                totals[uid] += row["amount"]

        grand_total = sum(totals.values())
        avg = grand_total / len(member_ids) if member_ids else 0

        profiles = (
            supabase.table("profiles")
            .select("id, username")
            .in_("id", member_ids)
            .execute()
        )
        name_map = {p["id"]: p.get("username") or p["id"][:8] for p in (profiles.data or [])}

        balances = []
        for uid in member_ids:
            net = round(totals[uid] - avg, 2)
            balances.append({
                "user_id": uid,
                "username": name_map.get(uid, uid[:8]),
                "total_spent": round(totals[uid], 2),
                "net_balance": net,
            })

        return {"balances": balances}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.post("/api/groups/split")
def split_group_expense(payload: GroupExpense):
    try:
        # 1. Fetch current monthly limit for the person who paid
        res = supabase.table("profiles").select("monthly_limit").eq("id", payload.payer_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Payer not found")

        # 2. Deduct the FULL amount from the payer's budget
        new_limit = res.data[0]["monthly_limit"] - payload.amount
        supabase.table("profiles").update({"monthly_limit": new_limit}).eq("id", payload.payer_id).execute()

        # 3. Log ONE expense for the full amount so the ledger calculates debt
        supabase.table("expenses").insert({
            "user_id": payload.payer_id,
            "amount": payload.amount,
            "description": payload.description,
            "group_id": payload.group_id,
            "category": "Shared Expense",
        }).execute()

        return {"message": "Split expense logged! The group now owes you money."}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.post("/api/groups/settle")
def settle_group_debt(payload: SettleDebt):
    try:
        res = supabase.table("profiles").select("monthly_limit").eq("id", payload.user_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="User not found")

        # Settling = paying the group back → deduct from their budget
        new_limit = res.data[0]["monthly_limit"] - payload.amount
        supabase.table("profiles").update({"monthly_limit": new_limit}).eq("id", payload.user_id).execute()

        # Log ONE positive expense row with category "Settlement"
        supabase.table("expenses").insert({
            "user_id": payload.user_id,
            "amount": payload.amount,
            "category": "Settlement",
            "group_id": payload.group_id,
        }).execute()

        return {"message": "Debt settled. You are slightly less cooked.", "new_limit": new_limit}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
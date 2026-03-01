import os

import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.cluster import KMeans
from supabase import Client, create_client


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


class QuizAnswers(BaseModel):
    user_id: str
    takeout_frequency: int
    impulse_buy_score: int
    entertainment_spend: int
    selected_theme: str = "vanilla"
    username: str | None = None


class ExpenseTracker(BaseModel):
    user_id: str
    amount: float
    description: str


class PersonaGenerator:
    def __init__(self) -> None:
        self.core_by_cluster = {0: "Saver", 1: "Balanced", 2: "Spender"}
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
        return round(max(180.0, min(1200.0, base + adjustment)), 2)

    def _theme(self, impulse: int) -> str:
        return "brainrot" if impulse > 7 else "vanilla"

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

    def generate(self, cluster_id: int, takeout: int, impulse: int, entertainment: int) -> dict:
        prefix = self._prefix_from_volume(takeout, impulse, entertainment)
        core = self._core_from_cluster(cluster_id)
        suffix = self._behavior_suffix(cluster_id, takeout, impulse, entertainment)

        return {
            "persona": f"{prefix} {core} {suffix}",
            "theme": self._theme(impulse),
            "limit": self._monthly_limit(cluster_id, takeout, impulse, entertainment),
            "roast": self._roast(impulse),
        }


kmeans_model: KMeans | None = None
persona_generator = PersonaGenerator()


@app.on_event("startup")
def train_kmeans_model() -> None:
    global kmeans_model

    student_spending_df = pd.DataFrame(
        [
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
        ]
    )

    kmeans_model = KMeans(n_clusters=3, random_state=42, n_init=10)
    kmeans_model.fit(student_spending_df[["takeout", "impulse", "entertainment"]])


@app.get("/")
def health_check():
    return {"status": "ok"}


@app.post("/api/quiz")
def handle_quiz_submission(payload: QuizAnswers):
    if kmeans_model is None:
        raise HTTPException(status_code=500, detail="Model is not initialized")

    input_df = pd.DataFrame(
        [
            {
                "takeout": payload.takeout_frequency,
                "impulse": payload.impulse_buy_score,
                "entertainment": payload.entertainment_spend,
            }
        ]
    )

    cluster = int(kmeans_model.predict(input_df)[0])
    generated = persona_generator.generate(
        cluster,
        payload.takeout_frequency,
        payload.impulse_buy_score,
        payload.entertainment_spend,
    )

    try:
        profile_payload = {
            "id": payload.user_id,
            "persona": generated["persona"],
            "theme_preference": generated["theme"],
            "monthly_limit": generated["limit"],
            "roast": generated["roast"],
        }
        if payload.username:
            profile_payload["username"] = payload.username

        supabase.table("profiles").upsert(profile_payload).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database failure: {exc}")

    return {
        "message": "Persona generated successfully.",
        "persona": generated["persona"],
        "monthly_limit": generated["limit"],
        "theme": generated["theme"],
        "recommended_theme": generated["theme"],
        "roast": generated["roast"],
    }


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


# ── Group endpoints ──────────────────────────────────────────────────────────


@app.get("/api/profiles/all")
def get_all_profiles():
    """Return every profile (id + username) for the member picker."""
    try:
        response = supabase.table("profiles").select("id, username").execute()
        return {"profiles": response.data or []}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/groups")
def create_group(payload: CreateGroup):
    """Insert a new row into the `groups` table and return it."""
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
    """Bulk-insert rows into `group_members` for the given group."""
    try:
        rows = [{"group_id": payload.group_id, "user_id": uid} for uid in payload.user_ids]
        supabase.table("group_members").insert(rows).execute()
        return {"message": f"Added {len(rows)} member(s) to the group."}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/groups/{user_id}")
def get_user_groups(user_id: str):
    """Return all groups a user belongs to (with member list)."""
    try:
        # Get group IDs the user is a member of
        memberships = (
            supabase.table("group_members")
            .select("group_id")
            .eq("user_id", user_id)
            .execute()
        )
        group_ids = [m["group_id"] for m in (memberships.data or [])]
        if not group_ids:
            return {"groups": []}

        # Fetch group details
        groups = (
            supabase.table("groups")
            .select("id, name, created_by")
            .in_("id", group_ids)
            .execute()
        )

        # Attach members to each group
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


class SettleDebt(BaseModel):
    user_id: str
    group_id: str
    amount: float


@app.get("/api/groups/{group_id}/balances")
def get_group_balances(group_id: str):
    """Compute net balance for every member in a group.

    Positive net_balance → user owes the group.
    Negative net_balance → group owes the user (they overpaid).
    """
    try:
        # 1. Get all members
        members_res = (
            supabase.table("group_members")
            .select("user_id")
            .eq("group_id", group_id)
            .execute()
        )
        member_ids = [m["user_id"] for m in (members_res.data or [])]
        if not member_ids:
            return {"balances": []}

        # 2. Fetch all expenses in this group
        expenses_res = (
            supabase.table("expenses")
            .select("user_id, amount")
            .eq("group_id", group_id)
            .execute()
        )

        # 3. Sum per member
        totals: dict[str, float] = {uid: 0.0 for uid in member_ids}
        for row in expenses_res.data or []:
            uid = row["user_id"]
            if uid in totals:
                totals[uid] += row["amount"]

        # 4. Average across all members
        grand_total = sum(totals.values())
        avg = grand_total / len(member_ids) if member_ids else 0

        # 5. Fetch usernames for display
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
        # 1. Find all members in the group
        members = supabase.table("group_members").select("user_id").eq("group_id", payload.group_id).execute()
        member_count = len(members.data)
        
        if member_count == 0:
            raise HTTPException(status_code=400, detail="Group has no members")

        split_amount = round(payload.amount / member_count, 2)

        # 2. Deduct the split amount from EVERY member's monthly_limit
        for member in members.data:
            user_id = member["user_id"]
            
            # Fetch current limit
            res = supabase.table("profiles").select("monthly_limit").eq("id", user_id).execute()
            if res.data:
                new_limit = res.data[0]["monthly_limit"] - split_amount
                supabase.table("profiles").update({"monthly_limit": new_limit}).eq("id", user_id).execute()
                
                # Log the individual expense for each person
                supabase.table("expenses").insert({
                    "user_id": user_id,
                    "amount": split_amount,
                    "description": f"Split: {payload.description} (Paid by {payload.payer_id})",
                    "group_id": payload.group_id
                }).execute()

        return {"message": f"Successfully split ${payload.amount} between {member_count} people."}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.post("/api/groups/settle")
def settle_group_debt(payload: SettleDebt):
    try:
        # 1. Fetch current monthly limit for the user
        res = supabase.table("profiles").select("monthly_limit").eq("id", payload.user_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="User not found")
            
        # 2. Add the settled amount back to their budget
        new_limit = res.data[0]["monthly_limit"] + payload.amount
        supabase.table("profiles").update({"monthly_limit": new_limit}).eq("id", payload.user_id).execute()
        
        # 3. Log a "negative" expense so the charts reflect the repayment
        supabase.table("expenses").insert({
            "user_id": payload.user_id,
            "amount": -payload.amount, 
            "category": "settlement",
            "group_id": payload.group_id,
        }).execute()
        
        return {"message": "Debt settled. You are slightly less cooked.", "new_limit": new_limit}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
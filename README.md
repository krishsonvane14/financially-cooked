# 🔥 Financially Cooked

A multiplayer financial tracker that uses machine learning to calculate your *real* budget, roast your bad habits, and let your friends hold you accountable.

Built in a single weekend by Applied Sciences students who got tired of budgeting apps pretending users are disciplined. We replaced spreadsheets with unsupervised ML, real-time WebSocket sabotage events, and a functional shared debt ledger.



# 🎭 The Jekyll & Hyde Thematic Architecture

At its core, Financially Cooked explores the psychological duality of spending, mirroring the classic dynamic of Dr. Jekyll and Mr. Hyde.

Much like the hard psychological divide between the "innies" and "outies" at Lumon Industries, modern consumers suffer from a severe disconnect between their financial intentions and their actual behavior.
🧪 Dr. Jekyll: The Intentional Saver (The "Vanilla" Theme)

This is the rational, forward-thinking user. Jekyll is the version of you who sets strict budgets, tracks expenses on Excel, and diligently meal preps for the week to hit your bulking goals. Jekyll wants long-term stability and discipline.
👹 Mr. Hyde: The Financial Gremlin (The "Brainrot" & "Girl Math" Themes)

This is the impulsive, dopamine-driven alter ego. Hyde takes over at 2 AM to order drive-by dumplings, justifies $80 brunches with "Girl Math", and succumbs to terminal financial brainrot by taking investment advice from TikTok Finance Bros or bag-holding Dogecoin. Hyde sabotages your net worth for instant gratification.


# 🧠 Machine Learning Engine (“Vibe Check”)

Traditional budgeting apps let users define limits. This system calculates them algorithmically.

## 🔹 Unsupervised Clustering
A K-Means model (`n_clusters=3`) was trained using **scikit-learn** and **pandas** on student spending datasets.

## 🔹 Behavioral Analysis
The model processes multi-dimensional signals such as:

- Takeout frequency  
- Impulse buying score  
- Entertainment spending patterns  

## 🔹 Dynamic Persona Generation
Users are assigned to behavioral clusters:

- Saver  
- Balanced  
- Spender  

The backend then generates playful personas like:

- *Galactic Spender the Doom-Scroller*  
- *Micro Saver of the SkipTheDishes*

## 🔹 Algorithmic Budget Limits
Monthly budgets are computed mathematically based on:

- Distance from cluster centroid  
- Behavioral penalties  
- Impulse-control weighting  



# 🚀 Multiplayer Features

## 1️⃣ Splitwise-Style Debt Ledger

Users create squads and split expenses collaboratively.

A custom PostgreSQL view (`group_balances`) dynamically computes:

- Individual contributions  
- Fair shares  
- Net balances owed  


## 2️⃣ “Zeno’s Paradox” Settlement Algorithm

Group debt settlement changes group averages dynamically.

This system applies **simultaneous balance offsets** so debts resolve without distorting group spending statistics.


## 3️⃣ Real-Time Sabotages

Using **Supabase Realtime WebSockets**, users can sabotage friends’ bad purchases:

- Live screen shake  
- Instant Vine boom sound effect  
- Event broadcast to all squad members  



## 4️⃣ Full CRUD Expense Tracking

Users can:

- Add personal or shared expenses  
- Edit or delete entries  
- Automatically recalculate budgets  
- Instantly restore refunded limits  



# 🛠️ Tech Stack

## Backend & Machine Learning
- FastAPI — high-performance Python API  
- Scikit-Learn & Pandas — clustering + analytics  
- Pydantic — strict schema validation  

## Frontend
- Next.js (App Router + SSR)  
- Tailwind CSS + shadcn/ui  
- Clerk authentication  

## Database & Infrastructure
- Supabase (PostgreSQL)  
- Supabase Realtime sockets  
- Vercel & Render hosting  

---

# 💻 Running Locally

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/financially-cooked.git
cd financially-cooked
```

## 2️⃣ Start Backend (FastAPI + ML)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## 3️⃣ Start Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```
---

## 4️⃣ Environment Variables

Ensure .env files exist in both backend and frontend directories with:
Supabase credentials
Clerk authentication keys

## 🧪 Future Improvements

Model retraining with real user data
Mobile-first responsive UX upgrades
Push notifications for sabotages
Visualization dashboard for spending clusters

## 👨‍💻 Contributors

## Krish Sonvane (SFU Computing Science)

### Backend Architect:

- ML Engine: Developed and trained the K-Means clustering model using scikit-learn to categorize user spending behavior into behavioral clusters.
- Group Math Logic: Engineered the PostgreSQL View and Python logic for the "Zeno's Paradox" settlement algorithm, ensuring net-zero debt resolution across groups.
- API Development: Built the FastAPI backend with strict Pydantic validation to handle the complex "Vibe Check" payloads and real-time expense splitting.
- DevOps & Infrastructure: Orchestrated the entire deployment pipeline, managing Render for the Python server and Vercel for the Next.js frontend, while maintaining the Supabase database schema and RLS policies.

## Palash Dalsaniya (SFU Engineering Science)

### Frontend Lead & UX Engineer:

- UI/UX Design: Built the responsive, dark-mode dashboard using Next.js, Tailwind CSS, and shadcn/ui, including the dynamic "Brainrot" and "Girl Math" themes.
- Complex State Management: Developed the frontend logic for the Debt Ledger and Expense Log, ensuring that the UI reflects real-time budget refunds and settlement calculations without page reloads.
- Authentication & Identity: Integrated Clerk for secure user onboarding and custom profile synchronization, ensuring every user is assigned their specific ML-generated persona.

    





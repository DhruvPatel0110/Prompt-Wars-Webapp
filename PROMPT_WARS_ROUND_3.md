# PROMPT WARS – ROUND 3: FINAL PROMPT BATTLE
## Complete Technical Specification & Web App Behaviour

---

## 1. ROUND OVERVIEW

**Name:** FINAL PROMPT BATTLE – "BUILD. ADAPT. SURVIVE."

**Duration:** 15–20 minutes (configurable by host) + 30-second emergency "FINAL BOMB" adaptation window.

**Objective:** The surviving top 25% of teams receive an explicitly allotted, complex real-world case study. Teams must construct a comprehensive **Master Prompt** instructing an AI model to generate an end-to-end strategic solution. Just before the original round timer ends, a sudden disruptive constraint ("THE FINAL BOMB") is detonated, giving teams exactly 30 seconds to surgically adapt their prompt.

**Evaluation & Victory:** 50 Total Points (30 pts Master Prompt + 20 pts Bomb Adaptation). The top 3 teams on the final leaderboard are crowned:
1. 🥇 **1st Place** – PROMPT WARS CHAMPION
2. 🥈 **2nd Place** – RUNNER-UP
3. 🥉 **3rd Place** – SECOND RUNNER-UP

---

## 2. DATA STRUCTURE & JSON INPUT

### 2.1 Round 3 Case Studies & Bomb JSON Format

The webapp ingests `round3_cases.json` specifying the explicit case studies and their associated pool of sudden disruptive "bombs":

```json
{
  "round": 3,
  "cases": [
    {
      "id": "r3_case_001",
      "title": "College Tech Fest Participation Crisis",
      "category": "Growth & Event Marketing",
      "difficulty": 3,
      "scenario": {
        "context": "A tier-1 engineering college is organizing its annual flagship 3-day tech symposium in 30 days.",
        "metrics": {
          "expectedCapacity": 1000,
          "previousYearAttendance": 350,
          "targetAttendance": 800,
          "marketingBudget": "₹15,000",
          "promotionPeriodDays": 30,
          "activeVolunteers": 20,
          "socialMediaEngagement": "Low (under 2% CTR)",
          "marketConstraint": "Two rival college fests overlap on the exact same weekend."
        },
        "requiredPillars": [
          "1. Target Audience Segmentation & Personas",
          "2. Guerrilla & Digital Marketing Strategy",
          "3. High-Conversion Content & Social Campaign Plan",
          "4. Campus Ambassador & Outreach Mechanics",
          "5. Granular Budget Allocation Matrix",
          "6. 30-Day Day-by-Day Execution Roadmap",
          "7. Gamified Student Engagement Funnel",
          "8. Measurable KPIs & Conversion Funnel",
          "9. Risk Management & Contingency Plan",
          "10. Expected ROI & Attendance Projections"
        ]
      },
      "bombs": [
        {
          "bombId": "bomb_001_budget_cut",
          "headline": "CRITICAL BUDGET SLASH!",
          "description": "The student council treasury just froze funds. Your budget of ₹15,000 is slashed to ₹3,000. Paid ads/print media are canceled.",
          "impactField": "budget",
          "keyChallenge": "Shift immediately to zero-cost viral loops, organic reach, and peer-to-peer incentives."
        },
        {
          "bombId": "bomb_002_time_crunch",
          "headline": "SCHEDULE EMERGENCY!",
          "description": "Due to university semester exam rescheduling, the fest date has been moved forward by 15 days. You have only 15 days left.",
          "impactField": "timeline",
          "keyChallenge": "Compress marketing phases, prioritize immediate blitz triggers over long awareness funnels."
        },
        {
          "bombId": "bomb_003_audience_pivot",
          "headline": "DEMOGRAPHIC PIVOT!",
          "description": "Management mandates opening competitions to working junior developers and alumni rather than only campus students.",
          "impactField": "audience",
          "keyChallenge": "Pivot tone, incentives, prize positioning, and communication channels toward industry professionals."
        }
      ]
    },
    {
      "id": "r3_case_002",
      "title": "Hyperlocal EV Scooter Brand Launch Crisis",
      "category": "Product Launch & Operations Strategy",
      "difficulty": 3,
      "scenario": {
        "context": "A green-tech startup is launching an electric two-wheeler subscription service in a tier-2 city with high range-anxiety.",
        "metrics": {
          "fleetSize": "120 Scooters",
          "chargingStations": "8 Hubs",
          "targetMonthlySubscribers": 500,
          "launchBudget": "₹50,000",
          "timelineWeeks": 4,
          "competitorPricing": "15% cheaper petrol rentals"
        },
        "requiredPillars": [
          "1. Market Positioning & Overcoming Range Anxiety",
          "2. Hyperlocal Launch Activation Campaign",
          "3. Pricing & Subscription Tier Mechanics",
          "4. Battery Swap & Fleet Operations SLA",
          "5. Budget Distribution",
          "6. 4-Week Phased Rollout Plan",
          "7. Referral & Community Growth Loops",
          "8. Unit Economics & Fleet Utilization KPIs",
          "9. Safety & Vehicle Breakdown Contingency",
          "10. 90-Day Expansion Milestones"
        ]
      },
      "bombs": [
        {
          "bombId": "bomb_004_infrastructure_halt",
          "headline": "GRID POWER FAILURE!",
          "description": "Municipal permit delays halt 6 out of 8 charging hubs. You must launch with only 2 operational swap stations.",
          "impactField": "operations",
          "keyChallenge": "Reroute operations, deploy on-demand mobile battery vans, and limit initial delivery zones."
        }
      ]
    }
  ]
}
```

### 2.2 Host-to-Team Allotment Mapping

Allotments are configured by the Host prior to round commencement:

```
/event/{eventId}/round3/allotments
├── team_003: { caseId: "r3_case_001", assignedBombId: "bomb_001_budget_cut" }
├── team_007: { caseId: "r3_case_001", assignedBombId: "bomb_002_time_crunch" }
├── team_012: { caseId: "r3_case_002", assignedBombId: "bomb_004_infrastructure_halt" }
└── ...
```

### 2.3 User Response Data Structure (Firestore Schema)

```
/teams/{teamId}/rounds/round3
├── status: "in_progress" | "bomb_active" | "submitted" | "evaluating" | "evaluated"
├── assignedCaseId: "r3_case_001"
├── assignedBombId: "bomb_001_budget_cut"
├── phase1_masterPrompt: {
│   ├── promptText: "[Student's master prompt text]"
│   ├── lastSavedAt: timestamp,
│   ├── characterCount: 1420,
│   ├── autoSavedSnapshots: [ ... ]
│ }
├── phase2_bombPrompt: {
│   ├── adaptedPromptText: "[Student's modified prompt post-bomb]"
│   ├── diffSummary: "Modified budget parameters from 15k to 3k and added guerrilla tactics",
│   ├── submittedAt: timestamp,
│   ├── timeTakenSeconds: 24.3,
│   ├── characterCount: 1580
│ }
├── generatedSolution: {
│   ├── masterSolutionText: "[AI generated output from initial prompt]",
│   ├── adaptedSolutionText: "[AI generated output from adapted prompt]",
│   ├── generatedAt: timestamp
│ }
├── evaluation: {
│   ├── masterScore: 26.5,          // Out of 30
│   ├── masterBreakdown: {
│   │   "caseUnderstanding": 4.5,
│   │   "roleAndContext": 4.5,
│   │   "constraintsAndLogic": 4.5,
│   │   "outputStructuring": 4.5,
│   │   "strategicDepth": 4.5,
│   │   "promptEffectiveness": 4.0
│   │ },
│   ├── bombScore: 18.0,            // Out of 20
│   ├── bombBreakdown: {
│   │   "conditionAdaptation": 4.5,
│   │   "speedAndPrecision": 4.5,
│   │   "objectivePreservation": 4.5,
│   │   "adaptedOutputQuality": 4.5
│   │ },
│   ├── totalScore: 44.5,           // Out of 50
│   ├── reasoning: "Comprehensive structural depth; adapted instantaneously to budget constraint by replacing paid ads with student referral loops."
│ }
└── finalRank: 1
```

---

## 3. UI FLOW – STUDENT INTERFACE

```
 ┌──────────────────────────────────────────────────────────────┐
 │                     ROUND 3: STUDENT FLOW                    │
 └──────────────────────────────────────────────────────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │ 3.1 Initial Locked State │
                 └──────────────────────────┘
                              │
                              ▼ (Host Unlocks)
                 ┌──────────────────────────┐
                 │ 3.2 Case Briefing &      │
                 │     Master Prompt Studio │ (15-20 Min Phase)
                 │  - Case Dossier View     │
                 │  - Master Prompt Editor  │
                 │  - Auto-save Engine      │
                 └──────────────────────────┘
                              │
                              ▼ (Timer hit or Host triggers Bomb)
                 ┌──────────────────────────┐
                 │ 3.3 THE FINAL BOMB       │
                 │     DETONATION ALERT     │ (Audio + Red Flash)
                 └──────────────────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │ 3.4 30-Second Emergency  │
                 │     Adaptation Studio    │ (Strict 30s Countdown)
                 │  - Visual Diff Highlighting
                 │  - Quick-Surgical Edits  │
                 └──────────────────────────┘
                              │
                              ▼ (Timer Ends / Auto-Lock)
                 ┌──────────────────────────┐
                 │ 3.5 Generation & AI      │
                 │     Evaluation Matrix    │ (Dual Stream Loading)
                 └──────────────────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │ 3.6 Grand Finale Podium  │
                 │     & Final Standings    │ (Top 3 Confetti & Stats)
                 └──────────────────────────┘
```

---

### 3.1 Initial Dashboard State (Locked)

**Screen:** Main Dashboard
- Round 3 Card: Status shows `🔒 GRAND FINALE - LOCKED`
- Sub-text: "The Final Prompt Battle: Build. Adapt. Survive."
- Participant banner displaying team name, rank from Round 2, and current standings.
- System waits for Host to unlock Round 3.

---

### 3.2 Main Challenge Screen: Master Prompt Studio

**Layout:** Split 50/50 Dual-Pane Interface with Sticky Top Control Bar.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  PROMPT WARS // ROUND 3 : GRAND FINALE              ⏳ TIME REMAINING: 14:32    │
├────────────────────────────────────────┬─────────────────────────────────────────┤
│  📁 CASE STUDY DOSSIER                 │  ⚡ MASTER PROMPT EDITOR               │
│                                        │                                         │
│  [Case Title: Tech Fest Crisis]        │  Persona / Role Definition:             │
│  Context & Key Metrics:                │  ┌───────────────────────────────────┐  │
│  • Expected: 1,000 | Target: 800       │  │ Act as a Chief Marketing Officer..│  │
│  • Budget: ₹15,000 | 30 Days           │  │                                   │  │
│                                        │  │                                   │  │
│  Required Strategic Pillars:           │  │                                   │  │
│  [1] Target Audience Personas          │  │                                   │  │
│  [2] Marketing & Content Strategy      │  │                                   │  │
│  [3] Budget Allocation Breakdown       │  │                                   │  │
│  [4] 30-Day Execution Roadmap          │  │                                   │  │
│  ...                                   │  └───────────────────────────────────┘  │
│                                        │  Chars: 1,240 / 4,000 | Auto-saved ✓    │
│  [Copy Metrics] [View Rubric Guide]    │  [Draft Mode Active]                    │
├────────────────────────────────────────┴─────────────────────────────────────────┤
│  STATUS: Drafting Master Strategy • Stand by for In-Round Developments           │
└──────────────────────────────────────────────────────────────────────────────────┘
```

#### Left Column (Case Dossier):
1. **Interactive Case Overview:** Detailed background scenario, key data tables, numerical constraints, and operational bottlenecks.
2. **Pillars Checklist:** Interactive checklist where students can track coverage of all 10 required strategic pillars.
3. **Quick-Insert Helpers:** Clickable chips (e.g. `+ ₹15,000 Budget`, `+ 30-Day Timeline`, `+ 20 Volunteers`) to paste parameters into their editor.

#### Right Column (Master Prompt Editor):
1. **Monaco / Rich Code-Style Textarea:** Syntax-highlighted text area supporting markdown, system prompt tags (`<system>`, `<context>`, `<constraints>`, `<output_format>`).
2. **Character & Token Counter:** Real-time token estimator (Max 4,000 characters).
3. **Real-Time Autosave:** Encrypted local cache + debounced Firestore persistence every 2 seconds.
4. **Prompt Quality Linter:** Live feedback indicators:
   - Role Defined: ✅
   - Constraints Included: ✅
   - Output Structure Specified: ✅

---

### 3.3 The Final Bomb Detonation Screen

When the Host triggers the Bomb (or the global timer reaches `00:30` remaining):

**Sensory & UI Effects:**
1. **Auditory Cue:** Pulse alarm / Klaxon siren sound effect.
2. **Visual Shockwave:** Red screen border flash with animated warning barrier: `🚨 NEW INTELLIGENCE DETONATED`.
3. **Overlay Modal (3 seconds auto-dismiss):**
   - Title: **⚠️ EMERGENCY CONSTRAINT INJECTED**
   - Bomb Headline: e.g. **"BUDGET SLASH: ₹15,000 ➔ ₹3,000!"**
   - Impact Directive: "Paid advertising is revoked. Adapt your master prompt to achieve 800 attendees via zero-cost growth hacking!"
   - Countdown starts immediately: **30.0 SECONDS REMAINING**.

---

### 3.4 30-Second Emergency Adaptation Studio

The UI transforms into high-urgency **Crisis Mode**:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  🚨 CRISIS RESPONSE MODE                    🔥 BOMB TIMER: 00:21.4 (CRITICAL)   │
├──────────────────────────────────────────────────────────────────────────────────┤
│  ⚡ NEW CONSTRAINT: BUDGET SLASHED TO ₹3,000. ZERO PAID MEDIA ALLOWED.           │
├────────────────────────────────────────┬─────────────────────────────────────────┤
│  ORIGINAL MASTER PROMPT (REFERENCE)   │  🚨 ADAPTED PROMPT (SURGICAL EDIT)      │
│                                        │                                         │
│  ...Allocate ₹8,000 to Instagram ads   │  ...Allocate [ ₹0 to paid ads. Deploy  ]│
│  and ₹4,000 to print posters...        │  [ guerrilla flash-mobs & referral loops]│
│                                        │  with ₹3,000 micro-incentives...        │
├────────────────────────────────────────┴─────────────────────────────────────────┤
│  [ ⚡ SUBMIT FINAL ADAPTATION ]  (Auto-commits when timer hits 00:00)            │
└──────────────────────────────────────────────────────────────────────────────────┘
```

1. **Split Diff View:** Left side shows the frozen Master Prompt; right side allows rapid, focused modifications.
2. **Micro-Timer:** Prominent, vibrating high-contrast timer with millisecond precision (`29.9s -> 00.0s`).
3. **Smart Fallback:** If the team does not click "SUBMIT FINAL ADAPTATION", the system **auto-commits whatever text is currently typed at `00:00.0`**. If the field is untouched, it submits the Phase 1 Master Prompt.
4. **Hard Lockout:** Exactly at `00:00`, inputs freeze, text area blurs, and submission is sealed.

---

### 3.5 AI Solution Generation & Evaluation Matrix

**Screen:** Post-Submission Processing
- Displays a dual-stream generation loader:
  1. `[Step 1/3] Generating End-to-End Master Strategy via Claude 3.5 Sonnet...` (Progress bar)
  2. `[Step 2/3] Simulating Bomb Adaptation Output...`
  3. `[Step 3/3] AI Adjudication & Multi-Pillar Scoring...`
- Live telemetric stream showing AI evaluation progress.

---

### 3.6 Grand Finale Podium & Results Screen

Once the Host reveals final rankings:

#### Screen A: CHAMPION / RUNNER UP (Top 3 Teams)
- 🏆 **3D Confetti Particle Explosion**
- **Podium Display:**
  - 🥇 **1st Place:** "PROMPT WARS 2026 CHAMPION" (Gold Trophy, Score: 48.5/50)
  - 🥈 **2nd Place:** "FIRST RUNNER-UP" (Silver Trophy, Score: 46.0/50)
  - 🥉 **3rd Place:** "SECOND RUNNER-UP" (Bronze Trophy, Score: 44.5/50)
- **Score Breakdown Drawer:**
  - Case Understanding & Logic: `5.0 / 5.0`
  - Output Structural Depth: `4.8 / 5.0`
  - Bomb Adaptation Agility: `4.9 / 5.0`
  - Strategic Viability: `4.7 / 5.0`
- **Export Action:** "Download Complete Strategy Briefing (PDF)".

#### Screen B: PARTICIPATION / FINALIST RANKINGS (Rank 4+)
- Banner: "🎖️ PROMPT WARS FINALIST"
- Final Rank: e.g. "Rank #5 of 25 Teams"
- Detailed feedback summary highlighting tactical strengths and recommendations.

---

## 4. UI FLOW – HOST INTERFACE

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  PROMPT WARS HOST CONSOLE // ROUND 3 COMMAND CENTER                             │
├──────────────────────────────────────────────────────────────────────────────────┤
│  STATUS: ROUND 3 LIVE   |   GLOBAL CLOCK: 14:10   |   TEAMS CONNECTED: 8/8       │
│  [ ▶ START ROUND ]   [ ⏸ PAUSE ]   [ 💣 TRIGGER FINAL BOMB NOW ]   [ 🛑 END ]   │
├──────────────────────────────────────────────────────────────────────────────────┤
│  📊 LIVE ALLOTMENT & SUBMISSION MATRIX                                           │
│  ┌────────┬──────────────────────┬─────────────┬─────────────┬─────────────────┐ │
│  │ Team # │ Assigned Case        │ Master Draft│ Bomb Status │ Current Score   │ │
│  ├────────┼──────────────────────┼─────────────┼─────────────┼─────────────────┤ │
│  │ Team 03│ Tech Fest Crisis     │ 1,420 chars │ Injected ⏳ │ Ready to Eval   │ │
│  │ Team 07│ Tech Fest Crisis     │ 1,180 chars │ Injected ⏳ │ Ready to Eval   │ │
│  │ Team 12│ EV Scooter Launch    │ 1,650 chars │ Injected ⏳ │ Ready to Eval   │ │
│  └────────┴──────────────────────┴─────────────┴─────────────┴─────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────────┤
│  ⚡ BATCH CONTROLS: [ 🤖 EVALUATE ALL WITH CLAUDE ]  [ 🏆 REVEAL FINAL PODIUM ]  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Host Control Panel Sections

1. **Round Lifecycle Manager:**
   - Pre-Round: Assign case studies and bomb variations to surviving teams (One-click "Random Balanced Allotment" or manual dropdown).
   - Start Master Timer: 15 or 20 minutes sync.
2. **Emergency Bomb Controls:**
   - **Automated Mode:** Drops the bomb automatically when timer reaches `00:30`.
   - **Manual Detonation Trigger:** "TRIGGER FINAL BOMB NOW" button with safety confirmation modal (allows host to drop the bomb at any dramatic moment).
3. **Live Character & Telemetry Monitor:**
   - Host sees real-time character typing velocity and autosave heartbeats per team.
4. **AI Batch Evaluator:**
   - One-click parallel execution across all finalist teams.
   - Live status chips: `Queued -> Generating -> Evaluating -> Done`.
5. **Leaderboard & Tie-Breaker Suite:**
   - Live ranked standings with score overrides.
   - Built-in Tie-Breaker trigger if scores are tied at Rank 1, 2, or 3.
6. **Ceremonial Podium Broadcast:**
   - "PUSH PODIUM TO SCREENS" button which triggers synchronized celebration animations on all student laptops and projector displays.

---

## 5. AI EVALUATION LOGIC & RUBRIC

### 5.1 Comprehensive Rubric Breakdown (Total: 50 Points)

| Section | Pillar | Max Points | Rubric Criteria |
| :--- | :--- | :---: | :--- |
| **Part 1: Master Prompt Strategy** | 1. Case Comprehension & Fact Retention | **5** | Captures all metrics, numbers, constraints, and underlying organizational challenges. |
| *(30 Points Total)* | 2. AI Role, Persona & Tone Definition | **5** | Establishes authoritative, specialized AI persona with clear directive boundaries. |
| | 3. Constraints, Rules & Boundary Control | **5** | Enforces hard constraints (budget limits, deadlines, risk policies). |
| | 4. Output Structuring & Markdown Schema | **5** | Explicit format requirements (tables, phased roadmaps, numbered actionables). |
| | 5. Strategic Depth & Completeness | **5** | Covers all 10 required pillars without generic filler or superficial advice. |
| | 6. Prompt Engineering Technique | **5** | Uses few-shot cues, delimiter tags, chain-of-thought instructions, and priority weighting. |
| **Part 2: Final Bomb Adaptation** | 7. Condition Adaptation & Pivot Accuracy | **5** | Fully incorporates the injected constraint into the core solution logic. |
| *(20 Points Total)* | 8. Surgical Precision & Speed | **5** | Modified relevant parameters accurately without breaking prompt coherence. |
| | 9. Objective & Quality Preservation | **5** | Maintains the original goal (e.g. 800 attendees) despite severe limitations. |
| | 10. Adapted AI Execution Quality | **5** | The resulting adapted AI strategy is feasible, actionable, and innovative. |

---

### 5.2 AI Evaluator System Prompt (Claude API)

```
Prompt to Claude API (claude-sonnet-4-6):
--------------------------------------------------------------------------------
You are the Supreme AI Adjudicator for PROMPT WARS ROUND 3: GRAND FINALE.

Evaluate the team's Master Prompt and subsequent Emergency Bomb Adaptation based on the provided Case Study and Injected Bomb.

CASE STUDY DATA:
[Insert Full Case Scenario, Metrics & Required Pillars]

INJECTED BOMB:
[Insert Injected Bomb Headline & Challenge]

TEAM RESPONSES:
Initial Master Prompt:
"""[Insert Team Phase 1 Master Prompt]"""

Adapted Prompt (Post-Bomb):
"""[Insert Team Phase 2 Adapted Prompt]"""

Generated Master Solution Output:
"""[Insert Generated Strategy Output]"""

Generated Adapted Solution Output:
"""[Insert Adapted Strategy Output]"""

EVALUATION RUBRIC (50 Total Points):
1. Case Comprehension (0-5)
2. AI Role & Persona (0-5)
3. Constraints & Boundary Control (0-5)
4. Output Structuring & Format (0-5)
5. Strategic Depth & Completeness (0-5)
6. Prompt Technique & Rigor (0-5)
7. Bomb Adaptation & Pivot Accuracy (0-5)
8. Surgical Precision & Coherence (0-5)
9. Objective Preservation (0-5)
10. Adapted Strategy Execution Quality (0-5)

Respond ONLY with valid JSON in this exact structure:
{
  "master_scores": {
    "case_comprehension": 4.8,
    "role_persona": 5.0,
    "constraints_control": 4.5,
    "output_structuring": 5.0,
    "strategic_depth": 4.7,
    "prompt_technique": 4.5
  },
  "master_subtotal": 28.5,
  "bomb_scores": {
    "adaptation_accuracy": 4.8,
    "surgical_precision": 4.6,
    "objective_preservation": 4.7,
    "execution_quality": 4.9
  },
  "bomb_subtotal": 19.0,
  "total_score": 47.5,
  "key_strengths": "Exceptional persona specification; swift transition to viral referral mechanics when budget was slashed.",
  "areas_for_improvement": "Could have included explicit risk contingency formulas for volunteer dropouts.",
  "verdict_summary": "Masterclass in crisis prompt architecture and rapid parameter adaptation."
}
--------------------------------------------------------------------------------
```

---

## 6. SOLUTION GENERATION SERVICE

### 6.1 Parallel Generation Workflow

```
[Student Submits Final Prompts]
          │
          ├──▶ Call Claude 3.5 Sonnet: Generate Base Solution (max_tokens: 3000)
          │
          └──▶ Call Claude 3.5 Sonnet: Generate Adapted Solution (max_tokens: 3000)
                    │
                    ▼
          [Both Solutions Synthesized]
                    │
                    ▼
          Call Claude 3.5 Sonnet: Evaluator Prompt (Rubric Scoring)
                    │
                    ▼
          Store in Firestore & Emit Event to Host Dashboard
```

---

## 7. REAL-TIME SYNCHRONIZATION (Firebase Schema)

```
/event/{eventId}
├── currentRound: 3
├── round3
│   ├── isLocked: false
│   ├── phase: "master_draft" | "bomb_detonated" | "round_ended" | "evaluating" | "completed"
│   ├── timerStart: 1773839200000
│   ├── timerDurationSeconds: 900
│   ├── bombDetonatedAt: 1773840070000
│   ├── bombDurationSeconds: 30
│   └── activeBombGlobalOverride: null
├── leaderboard
│   └── round3
│       ├── team_003: { rank: 1, totalScore: 48.5, masterScore: 29.0, bombScore: 19.5 }
│       ├── team_007: { rank: 2, totalScore: 46.0, masterScore: 28.0, bombScore: 18.0 }
│       └── team_012: { rank: 3, totalScore: 44.5, masterScore: 27.5, bombScore: 17.0 }
```

---

## 8. TECHNICAL REQUIREMENTS & CLOUD FUNCTIONS

### 8.1 Tech Stack
- **Frontend:** React + Vite, Tailwind CSS, Monaco Editor / CodeMirror (for prompt writing), Canvas-Confetti (for Grand Finale podium).
- **Backend:** Firebase Cloud Functions (Node.js 20, 1024MB Memory, 540s timeout).
- **AI Models:** Claude 3.5 Sonnet (`claude-sonnet-4-6`) via Anthropic SDK.
- **Audio:** Howler.js or Web Audio API (for bomb alarm & klaxon sound effects).

### 8.2 Firebase Cloud Functions

1. **`distributeRound3Cases(eventId, mapping)`**
   - Stores explicit team-to-case and team-to-bomb pairings.
2. **`detonateBomb(eventId)`**
   - Updates `phase: "bomb_detonated"`, sets `bombDetonatedAt` timestamp, broadcasts real-time push to all client websockets.
3. **`executeAndEvaluateRound3(teamId, eventId)`**
   - Generates both master and adapted solutions from student prompts in parallel.
   - Evaluates outputs using the 50-point rubric.
   - Writes scores to Firestore.
4. **`publishFinalPodium(eventId)`**
   - Computes top 3 rankings, finalizes podium state, and unblocks the victory celebration screen.

---

## 9. DATA INGESTION & SETUP

1. **Storage Location:** Upload `round3_cases.json` to Firebase Storage under `/config/round3_cases.json`.
2. **Case Allotment Modes:**
   - **Mode A (Host Explicit):** Host selects specific cases for specific teams via UI dropdowns before starting.
   - **Mode B (Random Balanced Distribution):** System distributes available cases equally among finalist teams.

---

## 10. EDGE CASES & SAFETY PROTOCOLS

1. **Disconnection during 30s Bomb Window:**
   - The browser automatically keeps a local copy of the prompt draft in `localStorage`.
   - On reconnect, it syncs immediately. If network fails through the entire 30s, the backend defaults to the Phase 1 Master Prompt for evaluation so the team still receives up to 30+ points.
2. **Zero Modification During Bomb Window:**
   - If the student fails to edit their prompt, the system evaluates their master prompt against the bomb scenario, scoring them accurately on resilience without throwing a fatal system error.
3. **Claude API Concurrency & Rate Limits:**
   - Claude API calls are pooled using `p-limit` (max 5 concurrent calls per worker) to prevent 429 Rate Limit spikes.
   - Exponential backoff retry logic (up to 3 retries).
4. **Sudden Tie at Rank 1, 2, or 3:**
   - In case of identical scores among top 3 teams, the system provides a 60-Second "Sudden Death Tie-Breaker" interface.

---

## 11. TESTING & VALIDATION CHECKLIST

- [ ] Case study dossier renders all metrics, tables, and constraints legibly.
- [ ] Monaco / Prompt editor autosaves smoothly without lagging the UI.
- [ ] Klaxon alert and red flash trigger synchronously across all connected client devices when bomb is detonated.
- [ ] 30-second timer displays countdown with sub-second accuracy.
- [ ] Inputs lock irreversibly when bomb countdown reaches `00:00.0`.
- [ ] Parallel generation handles both initial and adapted prompts concurrently.
- [ ] Evaluator returns valid, parseable JSON matching the 50-point rubric.
- [ ] Leaderboard sorts scores in descending order and highlights top 3 winners.
- [ ] Podium screen fires confetti animations and renders 1st, 2nd, and 3rd place trophies.
- [ ] Host console has full override control over timers, bombs, and final scores.

---

## 12. COMPLETE SCORING WALKTHROUGH EXAMPLE

### Case Study: College Tech Fest Participation Crisis (Goal: 800 attendees, ₹15,000 budget, 30 days)

#### Student's Phase 1 Master Prompt (Extract):
```text
Act as a Principal Growth Marketing Strategist for Tier-1 Tech Festivals. 
Design an exhaustive, 10-pillar operational blueprint to scale attendance from 350 to 800 students within 30 days with ₹15,000 budget.

CONSTRAINTS:
- Budget ceiling: Exactly ₹15,000.
- Timeline: 30 days broken into 4 distinct phases (Tease, Blitz, Conversion, Last-mile).
- Address rival overlapping fests through distinctive USP positioning.

REQUIRED OUTPUT STRUCTURE:
1. Executive Summary & Persona Matrix (Table)
2. Channel Breakdown & Budget Allocation Table (Item, Cost in INR, Expected ROI)
3. 30-Day Day-by-Day Gantt Roadmap (Markdown table)
4. Gamified Campus Ambassador Incentive Model
5. Risk Mitigation Table
```

#### Detonated Bomb:
> **"BUDGET SLASH: ₹15,000 ➔ ₹3,000! PAID ADS REVOKED."**

#### Student's Adapted Prompt (Within 30 Seconds):
```text
[ADDED MODIFICATIONS IN CRISIS WINDOW]
CRITICAL OVERRIDE:
- Total Budget revised from ₹15,000 down to ₹3,000.
- Zero paid ad spend. Reallocate ₹3,000 entirely into high-viral student referral bounties (Top 3 referrers win tech gadget prizes).
- Replace print media with WhatsApp community blitz and peer-to-peer Discord hacking challenges.
- Implement viral ticket unlock mechanisms (Buy 3 get 1 free squad passes).
```

#### Final Adjudication:
- **Master Strategy Score:** `28.5 / 30` (Excellent structure, robust role definition, comprehensive tables).
- **Bomb Adaptation Score:** `19.0 / 20` (Instant pivot to viral referral loops, maintained 800 target without budget).
- **Total Score:** `47.5 / 50` ➔ **PROMPT WARS CHAMPION 🏆**

---

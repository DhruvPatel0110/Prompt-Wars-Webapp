# PROMPT WARS – ROUND 1: PROMPT MAKEOVER
## Complete Technical Specification

---

## 1. ROUND OVERVIEW

**Name:** PROMPT MAKEOVER – "SPIN. UNLOCK. REWRITE."

**Duration:** 10 minutes (configurable by host)

**Objective:** Teams receive a weak prompt assigned to a random genre (A/B/C/D) and must improve it into a powerful, specific prompt.

**Elimination:** Bottom 50% of teams eliminated based on AI evaluation score.

---

## 2. DATA STRUCTURE & JSON INPUT

### 2.1 Round 1 Questions JSON Format

The webapp receives a JSON file with the following structure:

```json
{
  "round": 1,
  "genres": {
    "A": {
      "name": "CREATIVE",
      "description": "Storytelling, Advertisement, Social media content, Script writing, Poster/campaign concepts"
    },
    "B": {
      "name": "BUSINESS",
      "description": "Marketing, Product launch, Business strategy, Customer communication, Brand promotion"
    },
    "C": {
      "name": "DATA / ANALYSIS",
      "description": "Reports, Tables, Financial summaries, Data interpretation, Comparison and insights"
    },
    "D": {
      "name": "REAL-WORLD / PROBLEM SOLVING",
      "description": "College problems, Event planning, Productivity, Education, Public-awareness campaigns"
    }
  },
  "questions": [
    {
      "id": "r1_a_001",
      "genre": "A",
      "badPrompt": "Make an advertisement for a college fest.",
      "context": "General college festival",
      "difficulty": 1
    },
    {
      "id": "r1_b_001",
      "genre": "B",
      "badPrompt": "Sell this product.",
      "context": "Generic product",
      "difficulty": 1
    },
    {
      "id": "r1_c_001",
      "genre": "C",
      "badPrompt": "Analyze this sales data.",
      "context": "Sales dataset",
      "difficulty": 1
    },
    {
      "id": "r1_d_001",
      "genre": "D",
      "badPrompt": "Plan a college event.",
      "context": "General event planning",
      "difficulty": 1
    }
  ]
}
```

### 2.2 User Response Data Structure

When a student submits their improved prompt, store in Firestore:

```
/teams/{teamId}/rounds/round1
├── spinResult: "A"
├── assignedGenre: "CREATIVE"
├── badPrompt: "Make an advertisement for a college fest."
├── improvedPrompt: "[Student's improved prompt text]"
├── submittedAt: timestamp
├── editCount: 1
├── timerUsed: 543 (seconds)
└── status: "submitted" | "pending_evaluation" | "evaluated"
```

---

## 3. UI FLOW – STUDENT INTERFACE

### 3.1 Initial Dashboard State (Locked)

**Screen:** Main Dashboard
- Display: Three round cards (Round 1, Round 2, Round 3)
- Round 1 card shows: 🔒 LOCKED
- Display team number & event name at top
- Status: All rounds locked until host unlocks

**Action:** Wait for host to unlock Round 1

---

### 3.2 Round 1 Unlocked

**Screen:** Round 1 - Spin Challenge
- Display: Large spinning wheel with A, B, C, D segments
- Center text: "Click SPIN to reveal your genre"
- Button: "SPIN NOW" (clickable only when round is active)
- Timer: "10:00" countdown starts (global, synced with host)
- Disabled elements: All other UI is grayed out

**Animation:**
- Wheel spins for 2-3 seconds
- Lands on random segment (A/B/C/D)
- Display: "[Letter] SELECTED!"
- Pause: 1 second
- Auto-transition to next screen

---

### 3.3 Genre Reveal Screen

**Screen:** Genre Unlock
- Display large genre letter (e.g., "A")
- Display genre name: "CREATIVE"
- Display genre description
- Button: "PROCEED" (auto-appears after 2 seconds)
- Timer: Continues running at top right

**Action:** Click PROCEED or wait 3 seconds (auto-proceed)

---

### 3.4 Main Challenge Screen

**Layout:** Two-column interface

**Left Column (60% width):**
- Header: "BAD PROMPT"
- Display bad prompt in large, readable text (monospace/code font)
- Cannot be edited or copied
- Small info box: "This prompt is missing clarity, context, audience, constraints, format specifications"

**Right Column (40% width):**
- Header: "YOUR IMPROVED PROMPT"
- Large textarea for user input (min 50 chars, max 2000 chars)
- Character counter: "0 / 2000"
- Real-time autosave (no explicit save needed)

**Bottom Action Bar:**
- Timer display: "09:15" (red when < 2 mins)
- Status text: "Edits remaining: 1" (strikes through after first edit)
- Button: "SUBMIT" (disabled until 50+ chars entered, enabled only once)
- Info text: "You can edit ONCE before submission. Once timer ends, submission locks."

---

### 3.5 Post-Submit Waiting Screen

**Screen:** Submission Confirmed
- Display: ✓ "Your prompt has been submitted!"
- Display submitted prompt (read-only)
- Message: "Waiting for AI evaluation..."
- Timer continues to count down
- Animated loader / pulsing indicator

**State:** Locked (cannot edit, cannot go back)

---

### 3.6 Result Screen (After Host Clicks Next)

**Screen A: SELECTED FOR ROUND 2**
- Large green banner
- Text: "🎉 SELECTED FOR ROUND 2"
- Sub-text: "Your prompt impressed our AI evaluator. Advance to the next challenge!"
- Display score: "Score: 16/20"
- Button: "CONTINUE TO ROUND 2" (disabled until host advances all teams)

**Screen B: ELIMINATION**
- Large red banner
- Text: "❌ BETTER LUCK NEXT TIME"
- Sub-text: "Your team did not advance to Round 2."
- Display score: "Score: 8/20"
- Message: "Thank you for participating in PROMPT WARS!"
- Info: "Wait for final results announcement"

---

## 4. UI FLOW – HOST INTERFACE

### 4.1 Host Dashboard

**Display:**
- Event name & current round indicator
- Three large round cards: Round 1 | Round 2 | Round 3
- All rounds show LOCKED status initially
- Global timer display (00:00)

---

### 4.2 Round 1 Control Panel

**When unlocked by host:**

**Section 1: Round Status**
- Display: "Round 1 ACTIVE"
- Timer control: Display "10:00" with START/PAUSE/RESET buttons
- Teams connected: "18/25 teams ready"

**Section 2: Submissions Table**
- Real-time table showing all teams
- Columns: Team # | Status | Submitted At | Edit Count | (Action)
- Status values: "Waiting" (yellow) | "Submitted" (blue) | "Evaluated" (green)
- Sortable by Status, Time
- Live refresh (updates every 2 seconds)

**Section 3: AI Evaluation Control**
- Button: "EVALUATE ALL SUBMISSIONS" (appears after timer ends or manual trigger)
- Shows: "Processing..." with spinner during evaluation
- Once done, shows: "✓ Evaluation Complete – [X] scores calculated"

**Section 4: Leaderboard View**
- Table: Team # | Score | Status | (Actions)
- Sorted by score (descending)
- Visual indicator for top 50% (green highlight)
- Bottom 50% in red/gray

**Section 5: Advancement**
- Button: "ADVANCE TO NEXT ROUND" (large, prominent)
- Confirmation: "This will send pass/fail messages to all teams. Are you sure?"
- Once clicked: Eliminates bottom 50%, displays results to all student devices

---

## 5. AI EVALUATION LOGIC (Round 1)

### 5.1 Evaluation Criteria (Total: 20 Points)

1. **Clarity and Specificity (5 pts)**
   - Is the prompt clear and unambiguous?
   - Does it specify the task precisely?
   - Rubric: Vague (0-1) | Somewhat clear (2-3) | Clear (4-5)

2. **Context and Role Definition (4 pts)**
   - Does it define the AI's role?
   - Does it provide necessary context?
   - Rubric: Missing (0-1) | Partial (2) | Well-defined (3-4)

3. **Constraints and Instructions (4 pts)**
   - Are constraints clearly stated?
   - Are instructions specific and actionable?
   - Rubric: Vague (0-1) | Partial (2) | Comprehensive (3-4)

4. **Expected Output Format (3 pts)**
   - Does it specify output format?
   - Is the format realistic and specific?
   - Rubric: Not specified (0-1) | Mentioned (2) | Detailed (3)

5. **Creativity and Effectiveness (4 pts)**
   - Does it improve significantly over the bad prompt?
   - Is it practical and effective?
   - Rubric: Minimal improvement (0-1) | Good improvement (2-3) | Excellent improvement (4)

### 5.2 AI Evaluator Implementation

**Trigger:** Host clicks "EVALUATE ALL SUBMISSIONS"

**For each team's submission:**

```
Prompt to Claude API:
---
You are an expert prompt engineering evaluator for PROMPT WARS.
A team has improved the following bad prompt:

BAD PROMPT: "[Insert bad prompt]"
GENRE: "[Genre name]"

IMPROVED PROMPT (by team): "[Insert team's improved prompt]"

Evaluate this improved prompt on the following criteria (total 20 points):

1. Clarity and Specificity (5 pts): Is the prompt clear and unambiguous? Does it specify the task precisely?
2. Context and Role Definition (4 pts): Does it define the AI's role? Does it provide necessary context?
3. Constraints and Instructions (4 pts): Are constraints clearly stated? Are instructions specific and actionable?
4. Expected Output Format (3 pts): Does it specify output format? Is the format realistic and specific?
5. Creativity and Effectiveness (4 pts): Does it improve significantly over the bad prompt? Is it practical and effective?

Respond ONLY in this JSON format (no other text):
{
  "clarity_score": 5,
  "context_score": 4,
  "constraints_score": 4,
  "format_score": 3,
  "creativity_score": 4,
  "total_score": 20,
  "reasoning": "Brief summary of strengths and weaknesses"
}
---
```

**Process:**
- Evaluate all submissions in parallel
- Store scores in Firestore: `/teams/{teamId}/rounds/round1/evaluation`
- Generate leaderboard rankings
- Trigger result display on student devices

---

## 6. REAL-TIME SYNCHRONIZATION

### 6.1 Firebase Realtime Database Structure

```
/event/{eventId}
├── eventName: "PROMPT WARS 2026"
├── status: "active"
├── currentRound: 1
├── round1
│   ├── isLocked: false
│   ├── timerStart: timestamp
│   ├── timerDuration: 600 (seconds)
│   └── timerPaused: false
├── leaderboard
│   └── round1
│       ├── team_001: { rank: 1, score: 19 }
│       └── team_002: { rank: 2, score: 17 }
```

### 6.2 WebSocket/Listener Updates

**Student device listens to:**
- `round1.isLocked` – Update UI (locked/unlocked state)
- `round1.timerStart` & `round1.timerDuration` – Sync countdown
- Own team's result status – Display pass/fail

**Host device listens to:**
- All team submissions (real-time table update)
- Evaluation completion status

---

## 7. TECHNICAL REQUIREMENTS

### 7.1 Tech Stack

- **Frontend:** React + Vite, Tailwind CSS
- **Backend:** Firebase (Firestore, Auth, Functions)
- **AI Evaluation:** Claude API (claude-sonnet-4-6)
- **Real-time:** Firebase Realtime Database / Firestore listeners
- **State Management:** React Context / Zustand

### 7.2 Environment Variables Required

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

ANTHROPIC_API_KEY= (for Firebase Functions)
```

### 7.3 Key Functions (Firebase Cloud Functions)

1. **evaluateRound1Submissions()**
   - Triggered when host clicks "Evaluate"
   - Iterates through all team submissions
   - Calls Claude API for each submission
   - Stores scores in Firestore
   - Generates leaderboard

2. **advanceTeams()**
   - Triggered when host clicks "Advance to Next Round"
   - Calculates top 50% cutoff
   - Updates team status (pass/fail)
   - Triggers real-time update to all student devices

3. **syncTimer()**
   - Triggered every 1 second
   - Broadcasts current time to all connected devices
   - Handles timer end logic (lock submissions)

---

## 8. DATA INGESTION

### 8.1 Loading Questions from JSON

**Process:**
1. Admin uploads `round1_questions.json` to Firebase Storage
2. On app initialization, fetch and cache JSON
3. Store genre metadata in Firestore: `/config/round1/genres`
4. When team spins, randomly select from `questions` array matching that genre

**JSON File Structure:** (See Section 2.1)

---

## 9. EDGE CASES & VALIDATION

### 9.1 Timer Expired Before Submit

- Automatically lock textarea
- Disable submit button
- Show message: "Time's up! Your submission was not recorded."
- Do NOT submit empty responses

### 9.2 Multiple Edits Attempt

- After first submit, disable textarea
- Show warning: "You have already submitted. Cannot edit further."

### 9.3 Incomplete Submission

- Require minimum 50 characters
- Show error: "Prompt must be at least 50 characters."
- Disable submit button until condition met

### 9.4 Network Disconnect

- Cache last edited prompt locally
- Show indicator: "⚠ Offline – Your prompt is saved locally"
- Auto-submit when connection restored
- Validate server-side that submission is within time window

### 9.5 Evaluation Failure

- If Claude API fails: Retry up to 3 times with exponential backoff
- If all retries fail: Show host error message, allow manual re-evaluation
- Never show evaluation errors to students

---

## 10. TESTING CHECKLIST

- [ ] Wheel spinner generates random A/B/C/D evenly
- [ ] Timer syncs across all devices (< 500ms drift)
- [ ] Edit counter prevents more than 1 edit
- [ ] Submit button disables after first submit
- [ ] Timer expiration locks textarea
- [ ] AI evaluator produces consistent scores (test 5 samples manually)
- [ ] Leaderboard calculation is accurate
- [ ] Bottom 50% elimination works correctly (test with odd/even team counts)
- [ ] Pass/fail messages display correctly based on ranking
- [ ] Host timer controls (start/pause/reset) work properly
- [ ] All inputs validated (min length, max length, special chars)
- [ ] Keyboard shortcuts disabled during submission (Ctrl+S, etc.)

---

## 11. UI/UX DETAILS

### 11.1 Accessibility
- ARIA labels on all buttons
- High contrast for timer (red < 2 mins)
- Responsive design (mobile-friendly spinners, large touch targets)
- Keyboard navigation for host controls

### 11.2 Visual Hierarchy
- Bad prompt in monospace (code style)
- Improved prompt in regular text
- Timer in large, prominent position
- Scores in large green/red banners

### 11.3 Loading States
- Show skeleton placeholders while JSON loads
- Animate spinner during evaluation
- Disable all buttons during processing

---

## 12. SCORING EXAMPLE

**Bad Prompt:** "Make an advertisement for a college fest."

**Student's Improved Prompt:**
"Act as a college marketing strategist. Create a 30-second promotional advertisement for an inter-college technology fest aimed at undergraduate students aged 18–22. Use an energetic, youthful and slightly humorous tone. Include a memorable tagline, three key attractions of the fest and a clear call to action. Present the result as a short video script with scene directions and dialogue."

**Evaluation:**
- Clarity and Specificity: 5/5 (Very specific, clear task)
- Context and Role Definition: 4/4 (Role defined, context provided)
- Constraints and Instructions: 4/4 (All constraints specified)
- Expected Output Format: 3/3 (Format clearly specified)
- Creativity and Effectiveness: 4/4 (Significant improvement)

**Total: 20/20** ✓

---

## 13. DEPLOYMENT NOTES

- Deploy host & student interfaces as separate routes (same app or separate domains)
- Use query params or separate subdomains: `host.promptwars.com` vs `teams.promptwars.com`
- Pre-load all assets before event (JSON, images, fonts)
- Test with 25+ concurrent users on host & student devices
- Use Firebase Functions warm-up queries to reduce cold start time
- Monitor API rate limits (Claude API: 50K tokens/min on free tier)


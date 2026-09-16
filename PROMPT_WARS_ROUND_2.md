# PROMPT WARS – ROUND 2: PROMPT REVERSE ENGINEERING
## Complete Technical Specification

---

## 1. ROUND OVERVIEW

**Name:** PROMPT REVERSE ENGINEERING – "SEE THE OUTPUT. BUILD THE PROMPT."

**Duration:** 15 minutes (configurable by host)

**Objective:** Teams reverse-engineer two AI-generated outputs:
1. **Challenge 1:** Write a prompt that generates a provided AI image
2. **Challenge 2:** Write a prompt that generates a provided report

Teams are scored on how closely their generated output matches the target output.

**Elimination:** Bottom 50% of remaining teams eliminated based on combined score.

---

## 2. DATA STRUCTURE & JSON INPUT

### 2.1 Round 2 Questions JSON Format

The webapp receives a JSON file with this structure:

```json
{
  "round": 2,
  "challenges": [
    {
      "id": "r2_img_001",
      "type": "image",
      "challenge_number": 1,
      "targetImageUrl": "https://firebase-storage.../target_image_001.jpg",
      "targetImagePrompt": "[Original prompt that generated this image - kept secret from students]",
      "description": "A futuristic city skyline at sunset with flying cars",
      "difficulty": 2,
      "evaluationCriteria": {
        "composition": "visual layout and structure",
        "colors": "color palette and lighting",
        "subject": "main subject and focal points",
        "style": "artistic style and details"
      }
    },
    {
      "id": "r2_rep_001",
      "type": "report",
      "challenge_number": 2,
      "targetReportUrl": "https://firebase-storage.../target_report_001.pdf",
      "targetReportPrompt": "[Original prompt - kept secret]",
      "reportTitle": "Q4 2025 Financial Analysis Report",
      "reportSummary": "Quarterly financial performance with revenue breakdowns",
      "difficulty": 2,
      "evaluationCriteria": {
        "structure": "report organization and sections",
        "content": "financial data accuracy and detail level",
        "format": "table formatting and data presentation",
        "insights": "analysis depth and insights provided"
      }
    }
  ]
}
```

### 2.2 User Response Data Structure

When a student submits their prompt, store in Firestore:

```
/teams/{teamId}/rounds/round2
├── status: "in_progress" | "submitted" | "evaluated"
├── challenge1
│   ├── targetImageId: "r2_img_001"
│   ├── studentPrompt: "[Student's reverse-engineered prompt]"
│   ├── submittedAt: timestamp
│   ├── generatedImageUrl: "[URL of image generated from student prompt]"
│   ├── evaluationScore: 16.5
│   ├── evaluationDetails: {
│   │   "composition": 4.5,
│   │   "colors": 4,
│   │   "subject": 4,
│   │   "style": 4
│   │ }
│   └── editCount: 1
├── challenge2
│   ├── targetReportId: "r2_rep_001"
│   ├── studentPrompt: "[Student's reverse-engineered prompt]"
│   ├── submittedAt: timestamp
│   ├── generatedReportUrl: "[URL of report generated from student prompt]"
│   ├── evaluationScore: 14.2
│   ├── evaluationDetails: {...}
│   └── editCount: 1
└── totalScore: 30.7
```

---

## 3. UI FLOW – STUDENT INTERFACE

### 3.1 Round 2 Entrance

**Screen:** Round 2 Unlocked
- Display: "Round 2: REVERSE ENGINEERING"
- Sub-text: "We show you the answer. You figure out the question."
- Timer: "15:00" countdown starts (global, synced with host)
- Button: "START CHALLENGE"

---

### 3.2 Challenge Selection Screen

**Screen:** Choose Your Challenge
- Two large cards side-by-side:

**Card 1: IMAGE CHALLENGE**
- Icon: 🖼️
- Title: "Challenge 1: Image Reverse Engineering"
- Subtitle: "Write a prompt that generates this image"
- Preview: Small thumbnail of target image
- Button: "START"

**Card 2: REPORT CHALLENGE**
- Icon: 📄
- Title: "Challenge 2: Report Reverse Engineering"
- Subtitle: "Write a prompt that generates this report"
- Preview: Text snippet from report
- Button: "START"

**Note:** Both challenges available simultaneously. Teams can switch between them using tabs at the top.

**Timer:** Continues running (displays at top right)

---

### 3.3 Challenge 1: Image Reverse Engineering

**Layout:** Two-column interface

**Left Column (55% width):**
- Header: "TARGET IMAGE"
- Display: Large, high-resolution target image
- Zoom controls: 
  - Zoom in/out buttons (+/-)
  - Fit to screen button
  - Reset zoom button
- Scrollable (if zoomed in beyond viewport)
- Cannot be downloaded or right-clicked (prevent cheating)
- Info box below image: "Study this image carefully. What details, style, composition, and colors do you see?"

**Right Column (45% width):**
- Header: "YOUR REVERSE-ENGINEERED PROMPT"
- Large textarea for user input (min 50 chars, max 2000 chars)
- Character counter: "0 / 2000"
- Real-time autosave (every 3 seconds)
- Hint box (expandable):
  - Title: "Reverse Engineering Tips"
  - Content: "Describe what you see. Consider: Subject matter, artistic style, colors/lighting, composition, mood, texture, camera angle"

**Bottom Action Bar:**
- Timer display: "14:15" (red when < 2 mins)
- Status text: "Edits remaining: 1"
- Button: "SUBMIT CHALLENGE 1" (disabled until 50+ chars)
- Secondary button: "SWITCH TO CHALLENGE 2" (always enabled)

---

### 3.4 Challenge 1: Post-Submit Waiting

**Screen:** Challenge 1 Submitted
- Display: ✓ "Your prompt submitted!"
- Display: "Generating image from your prompt..."
- Animated loader with pulsing indicator
- Message: "This may take 30-45 seconds"
- Cannot go back or edit

**Backend Process (simultaneously):**
- Call Replicate API to generate image from student's prompt
- Store generated image URL
- Trigger comparison evaluation

---

### 3.5 Challenge 2: Report Reverse Engineering

**Layout:** Two-column interface (same as Challenge 1)

**Left Column (55% width):**
- Header: "TARGET REPORT"
- Display: Embedded PDF viewer showing target report
- Zoom controls: Same as image challenge
- Page navigator (if multi-page): "Page 1 of 3" with prev/next buttons
- Scrollable within viewer
- Cannot download or print (prevent cheating)
- Info box: "Study this report carefully. Note: structure, data presentation, formatting, and content depth."

**Right Column (45% width):**
- Header: "YOUR REVERSE-ENGINEERED PROMPT"
- Large textarea (same as Challenge 1)
- Hint box (expandable):
  - Content: "Describe the report's purpose, structure, key sections, data types, formatting requirements, tone, and level of detail needed."

**Bottom Action Bar:**
- Timer display
- Status text: "Edits remaining: 1"
- Button: "SUBMIT CHALLENGE 2"
- Secondary button: "SWITCH TO CHALLENGE 1"

---

### 3.6 Challenge 2: Post-Submit Waiting

**Screen:** Challenge 2 Submitted
- Display: ✓ "Your prompt submitted!"
- Display: "Generating report from your prompt..."
- Animated loader
- Message: "This may take 45-60 seconds (Claude is creating the report)"
- Cannot go back or edit

**Backend Process (simultaneously):**
- Call Claude API to generate report text from student's prompt
- Format as downloadable/viewable document
- Store report URL
- Trigger comparison evaluation

---

### 3.7 Both Challenges Submitted

**Screen:** Awaiting Final Evaluation
- Display: ✓✓ "Both challenges submitted!"
- Display: "Evaluating your prompts..."
- Progress bar showing: "Challenge 1: Evaluating... | Challenge 2: Evaluating..."
- Message: "Your scores will appear shortly"
- Locked state (cannot edit or go back)

---

### 3.8 Results Screen

**Display after host clicks "Next":**

**Screen A: ADVANCED TO ROUND 3**
- Large green banner: "🎉 SELECTED FOR ROUND 3"
- Display scores:
  - "Challenge 1 Score: 16.5 / 20"
  - "Challenge 2 Score: 14.2 / 20"
  - "Total Score: 30.7 / 40"
- Message: "Your reverse-engineering skills impressed us!"
- Button: "CONTINUE TO FINAL ROUND"

**Screen B: ELIMINATION**
- Large red banner: "❌ BETTER LUCK NEXT TIME"
- Display scores (same as above)
- Message: "Thank you for your efforts in PROMPT WARS."
- Info: "Final results will be announced shortly"

---

## 4. UI FLOW – HOST INTERFACE

### 4.1 Round 2 Control Panel

**Section 1: Round Status**
- Display: "Round 2 ACTIVE"
- Timer control: "15:00" with START/PAUSE/RESET
- Teams ready: "12/25 teams advanced from Round 1"

**Section 2: Submissions Table**
- Real-time table with columns:
  - Team # | Challenge 1 | Challenge 2 | Total | Status | Time Submitted
- Status indicators:
  - "Waiting" (yellow)
  - "C1 Submitted" (blue) | "C2 Submitted" (blue) | "Both Submitted" (purple)
  - "Evaluated" (green)
- Live refresh every 2 seconds

**Section 3: Evaluation Control**
- Button: "EVALUATE ALL SUBMISSIONS" (appears after timer ends or manual trigger)
- Shows: "Processing: 5/12 teams..." during evaluation
- Once done: "✓ Evaluation Complete – 12 scores calculated"
- Note: "Image generation takes 30-45 seconds per team. Report generation takes 45-60 seconds."

**Section 4: Detailed Leaderboard**
- Expandable rows for each team
- Columns: Rank | Team # | C1 Score | C2 Score | Total | Status
- Sortable by Total Score
- Green highlight for top 50% (advancing teams)
- Red/gray for bottom 50% (eliminated)

**Section 5: Advancement**
- Button: "ADVANCE TO NEXT ROUND"
- Confirmation dialog (same as Round 1)
- Eliminates bottom 50%, sends pass/fail to all teams

---

## 5. AI EVALUATION LOGIC (Round 2)

### 5.1 Challenge 1: Image Evaluation

**Scoring (Total: 20 points)**

1. **Composition & Layout (5 pts)**
   - Does the generated image match the target's composition?
   - Are key elements in similar positions?
   - Rubric: Very different (0-1) | Partially similar (2-3) | Very similar (4-5)

2. **Colors & Lighting (5 pts)**
   - Do colors match the target?
   - Is lighting/atmosphere similar?
   - Rubric: Very different (0-1) | Somewhat similar (2-3) | Very similar (4-5)

3. **Subject & Content (5 pts)**
   - Is the main subject correctly depicted?
   - Are key details present?
   - Rubric: Different subject (0-1) | Similar subject, missing details (2-3) | Accurate subject & details (4-5)

4. **Style & Artistic Elements (5 pts)**
   - Does the artistic style match?
   - Are stylistic details (texture, rendering) similar?
   - Rubric: Different style (0-1) | Somewhat similar style (2-3) | Very similar style (4-5)

**Total: 20 points**

### 5.2 Challenge 2: Report Evaluation

**Scoring (Total: 20 points)**

1. **Structure & Organization (5 pts)**
   - Does the generated report have similar sections/structure?
   - Is the organization logical and similar to target?
   - Rubric: Disorganized (0-1) | Partial structure (2-3) | Well-structured (4-5)

2. **Content & Data Accuracy (5 pts)**
   - Does it contain similar types of data/information?
   - Is the content depth similar?
   - Rubric: Very different content (0-1) | Some similarity (2-3) | Very similar content (4-5)

3. **Formatting & Presentation (5 pts)**
   - Are tables formatted similarly?
   - Is data presentation style similar?
   - Rubric: Very different format (0-1) | Partially similar (2-3) | Very similar format (4-5)

4. **Insights & Analysis (5 pts)**
   - Does it provide analysis/insights?
   - Is the analysis depth similar to target?
   - Rubric: No insights (0-1) | Basic insights (2-3) | Deep insights (4-5)

**Total: 20 points**

**Combined Score: 40 points**

### 5.3 Image Evaluation Implementation

**Trigger:** Both student challenges submitted → Automatically generate image

**Step 1: Generate Image from Student Prompt**
```
Service: Replicate (Stable Diffusion API)
API Call:
  model: "stability-ai/sdxl"
  input:
    prompt: "[Student's improved prompt]"
    height: 768
    width: 768
    num_outputs: 1
    num_inference_steps: 50
  output: [image_url]
```

**Step 2: Compare with Target Image**
```
Prompt to Claude Vision API:
---
You are an expert image evaluator for PROMPT WARS.

TARGET IMAGE: [target_image_url]
GENERATED IMAGE: [generated_image_url]

Compare these two images and score on:

1. Composition & Layout (5 pts): Do they match in layout and key element positions?
2. Colors & Lighting (5 pts): Do colors and lighting match?
3. Subject & Content (5 pts): Is the main subject and key details present?
4. Style & Artistic Elements (5 pts): Does the artistic style match?

Respond ONLY in this JSON format:
{
  "composition_score": 4.5,
  "colors_score": 4,
  "subject_score": 4.5,
  "style_score": 4,
  "total_score": 17,
  "reasoning": "Brief comparison of strengths and differences"
}
---
```

**Store Result:**
```
/teams/{teamId}/rounds/round2/challenge1/evaluation
├── generatedImageUrl: "[URL]"
├── scores: { composition: 4.5, colors: 4, subject: 4.5, style: 4 }
├── totalScore: 17
└── reasoning: "[Text]"
```

### 5.4 Report Evaluation Implementation

**Trigger:** Both student challenges submitted → Automatically generate report

**Step 1: Generate Report from Student Prompt**
```
Prompt to Claude API:
---
[Student's reverse-engineered prompt for report]
---

Instructions before user prompt:
- Generate ONLY the report content (plain text or markdown)
- No preamble or explanation
- Output exactly as specified in the prompt
- Minimum 500 words, maximum 2000 words
```

**Step 2: Compare with Target Report**
```
Prompt to Claude API:
---
You are an expert report evaluator for PROMPT WARS.

TARGET REPORT SUMMARY:
[Summary of target report - extracted via OCR/text from PDF]

GENERATED REPORT:
[Generated report text]

Compare these reports and score on:

1. Structure & Organization (5 pts): Similar sections and organization?
2. Content & Data Accuracy (5 pts): Similar types of data and depth?
3. Formatting & Presentation (5 pts): Similar table formatting and data presentation?
4. Insights & Analysis (5 pts): Similar level of analysis and insights?

Respond ONLY in this JSON format:
{
  "structure_score": 4,
  "content_score": 4.5,
  "formatting_score": 4,
  "insights_score": 3.5,
  "total_score": 16,
  "reasoning": "Brief comparison"
}
---
```

**Store Result:**
```
/teams/{teamId}/rounds/round2/challenge2/evaluation
├── generatedReportUrl: "[URL or stored in Firestore]"
├── scores: { structure: 4, content: 4.5, formatting: 4, insights: 3.5 }
├── totalScore: 16
└── reasoning: "[Text]"
```

---

## 6. IMAGE GENERATION SERVICE

### 6.1 Replicate API Setup

**Why Replicate?**
- Free tier: 10 free predictions/month
- After free tier: $0.025 per prediction (cheapest option)
- Fast: 30-45 seconds for SDXL
- No authentication required for students (backend-only)

**Environment Variables:**
```
REPLICATE_API_TOKEN=r8_xxxx
```

**Backend Implementation (Firebase Function):**
```javascript
// functions/generateImageFromPrompt.js
const Replicate = require("replicate");

exports.generateImageFromPrompt = async (studentPrompt, teamId) => {
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  try {
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a60c3b36b4fe3a0fb40dfd93d8b93b50b69b600fd413d5372eedc644",
      {
        input: {
          prompt: studentPrompt,
          height: 768,
          width: 768,
          num_outputs: 1,
          num_inference_steps: 50,
        },
      }
    );

    const imageUrl = output[0]; // Returns image URL
    
    // Store in Firestore
    await db.collection("teams").doc(teamId).collection("rounds").doc("round2").collection("challenge1").doc("generated").set({
      generatedImageUrl: imageUrl,
      generatedAt: new Date(),
    });

    return imageUrl;
  } catch (error) {
    console.error("Image generation failed:", error);
    throw new Error("Image generation failed. Please try again.");
  }
};
```

### 6.2 Fallback for High Volume

If Replicate API reaches rate limits:
- Queue submissions and process sequentially
- Show students: "Your image is being generated. Estimated wait: 2-3 minutes"
- Process up to 5 images in parallel
- Store queue in Firestore for recovery

---

## 7. REPORT GENERATION SERVICE

### 7.1 Claude API Setup

**Backend Implementation:**
```javascript
// functions/generateReportFromPrompt.js
const Anthropic = require("@anthropic-ai/sdk");

exports.generateReportFromPrompt = async (studentPrompt, teamId) => {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-1",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: studentPrompt,
        },
      ],
    });

    const reportText = message.content[0].text;

    // Store in Firestore (or Firebase Storage if too large)
    if (reportText.length > 100000) {
      // Store in Storage
      const bucket = admin.storage().bucket();
      const file = bucket.file(`reports/${teamId}_round2.txt`);
      await file.save(reportText);
      const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media`;
      
      await db.collection("teams").doc(teamId).collection("rounds").doc("round2").collection("challenge2").doc("generated").set({
        generatedReportUrl: url,
        generatedAt: new Date(),
      });
    } else {
      // Store in Firestore directly
      await db.collection("teams").doc(teamId).collection("rounds").doc("round2").collection("challenge2").doc("generated").set({
        generatedReportText: reportText,
        generatedAt: new Date(),
      });
    }

    return reportText;
  } catch (error) {
    console.error("Report generation failed:", error);
    throw new Error("Report generation failed. Please try again.");
  }
};
```

---

## 8. REAL-TIME SYNCHRONIZATION

### 8.1 Firebase Structure

```
/event/{eventId}
├── round2
│   ├── isLocked: false
│   ├── timerStart: timestamp
│   ├── timerDuration: 900 (15 minutes)
│   └── timerPaused: false
├── evaluationQueue
│   └── teamId_001: { status: "image_generating", progress: 30 }
```

### 8.2 Student Device Listeners

- Listen to own team's `/rounds/round2/challenge{1|2}/evaluation`
- Update UI when evaluation completes
- Display real-time status: "Generating image..." or "Generating report..."

### 8.3 Host Device Listeners

- Listen to `/submissions/round2`
- Real-time table update of all teams' statuses
- Listen to evaluation queue for progress updates

---

## 9. TECHNICAL REQUIREMENTS

### 9.1 Tech Stack

- **Frontend:** React + Vite, Tailwind CSS
- **Image Viewer:** react-zoom-pan-pinch or similar
- **PDF Viewer:** react-pdf or pdfjs
- **Backend:** Firebase (Firestore, Functions, Storage)
- **Image Generation:** Replicate API
- **Report Generation:** Claude API
- **Image Comparison:** Claude Vision API
- **Report Comparison:** Claude API
- **Real-time:** Firebase Realtime Database / Firestore listeners

### 9.2 Environment Variables

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Backend only (Firebase Functions)
ANTHROPIC_API_KEY=
REPLICATE_API_TOKEN=
```

### 9.3 Firebase Cloud Functions

1. **generateImageAndEvaluate()**
   - Trigger: Challenge 1 submitted
   - Call Replicate API
   - Call Claude Vision API for comparison
   - Store scores

2. **generateReportAndEvaluate()**
   - Trigger: Challenge 2 submitted
   - Call Claude API to generate report
   - Call Claude API to compare
   - Store scores

3. **evaluateRound2All()**
   - Trigger: Host clicks "Evaluate All"
   - Aggregate both challenge scores
   - Generate leaderboard
   - Determine advancing teams

4. **advanceTeams()**
   - Trigger: Host clicks "Advance to Next Round"
   - Calculate top 50%
   - Send pass/fail to all teams

---

## 10. DATA INGESTION

### 10.1 Loading Round 2 Content

**Process:**
1. Admin uploads `round2_challenges.json` to Firebase Storage
2. Admin uploads target images to Firebase Storage (separate folder)
3. Admin uploads target reports (PDFs) to Firebase Storage
4. On app initialization, fetch JSON and populate UI with URLs

**Directory Structure:**
```
firebase-storage/
├── round2/
│   ├── challenges.json
│   ├── images/
│   │   ├── target_image_001.jpg
│   │   ├── target_image_002.jpg
│   │   └── ...
│   └── reports/
│       ├── target_report_001.pdf
│       ├── target_report_002.pdf
│       └── ...
```

---

## 11. EDGE CASES & VALIDATION

### 11.1 Image Generation Timeout

- If Replicate takes > 2 minutes: Show error "Image generation timed out"
- Allow retry once
- If retry fails: Show to host, allow manual re-evaluation later
- Do NOT show errors to students

### 11.2 Report Generation Exceeds Limits

- Claude API max_tokens: 2000
- If generated report > 2000 words: Truncate gracefully
- Show message to host: "Report truncated at 2000 tokens"

### 11.3 Image Comparison Fails

- If Claude Vision API fails: Retry 2 times
- Fall back to: Manual scoring by host (override mechanism)
- Log error for debugging

### 11.4 Both Challenges Not Submitted

- Allow evaluation with only Challenge 1 or Challenge 2 submitted
- Calculate score for completed challenges only
- For missing challenge: Show "Not submitted" and score as 0 in leaderboard
- Let host decide: proceed with available scores or wait

### 11.5 Network Issues During Generation

- Cache student prompt locally
- Retry generation when connection restored
- Show progress indicator: "Reconnecting..."

### 11.6 Same Prompt for Both Challenges

- Allow (no validation against this)
- Each challenge evaluates independently
- Can result in different scores depending on target outputs

---

## 12. TESTING CHECKLIST

- [ ] Image viewer zoom works smoothly (up to 300%)
- [ ] PDF viewer displays multi-page reports correctly
- [ ] Replicate API generates images in < 50 seconds
- [ ] Claude API generates reports in < 60 seconds
- [ ] Image comparison returns consistent similarity scores
- [ ] Report comparison returns consistent content scores
- [ ] Leaderboard calculation correct (Challenge 1 + Challenge 2)
- [ ] Timer syncs across all devices (< 500ms drift)
- [ ] Edit counter prevents more than 1 edit per challenge
- [ ] Both challenges can be submitted independently or together
- [ ] Can switch between challenges without losing input
- [ ] Autosave works every 3 seconds without user seeing it
- [ ] Pass/fail messages match leaderboard rankings
- [ ] Host can manually re-evaluate if generation fails
- [ ] Mobile responsive (zoom/scroll work on phone)
- [ ] PDF rendering doesn't block UI

---

## 13. UI/UX DETAILS

### 13.1 Accessibility
- ARIA labels on all buttons
- Keyboard navigation for image zoom (arrow keys)
- PDF keyboard shortcuts: Page Down/Up for navigation
- High contrast red timer when < 2 mins
- Responsive design for all screen sizes

### 13.2 Visual Hierarchy
- Target image/report prominent and large
- Student textarea clearly separated
- Timer in top-right corner, always visible
- Scores displayed in large, bold numbers
- Generation progress animated

### 13.3 Loading States
- Show spinner with "Generating image... (1/3)" during Replicate API call
- Show spinner with "Analyzing image..." during Claude Vision comparison
- Disable all buttons during generation
- Show progress percentage if possible

---

## 14. DEPLOYMENT & SCALING

### 14.1 API Rate Limits

**Replicate API:**
- Free tier: 10 predictions/month
- After: $0.025 per prediction
- For 25 teams × 2 predictions (image generation) = 50 predictions
- Estimated cost: $1.25 per event
- Queue system to handle high volume

**Claude API:**
- Free tier: Limited
- Paid: $0.003 per 1K input tokens, $0.015 per 1K output tokens
- Per team: ~500 tokens input + ~1500 tokens output = ~$0.025 per team
- For 25 teams × 2 evaluations = ~$1.25 per event

**Total Estimated Cost:** $2.50 per event (very affordable)

### 14.2 Concurrent Connections

- Firebase supports thousands of concurrent connections
- Test with 30+ students + 1 host simultaneously
- Firestore: Auto-scales (no manual config needed)
- Cloud Functions: Deploy with 512MB memory, 540s timeout for generation

### 14.3 Pre-event Checklist

- [ ] Upload all target images to Firebase Storage
- [ ] Upload all target reports (PDFs) to Firebase Storage
- [ ] Test Replicate API key (make 1 test prediction)
- [ ] Test Claude API key (make 1 test call)
- [ ] Pre-load all challenge data in Firestore
- [ ] Test image viewer zoom on multiple devices
- [ ] Test PDF viewer on multiple devices
- [ ] Load-test with 30+ concurrent users
- [ ] Warm up Firebase Functions to reduce cold start

---

## 15. SCORING EXAMPLE

### 15.1 Challenge 1: Image

**Target Image:** Futuristic city skyline at sunset with flying cars

**Student Prompt:** "A detailed sci-fi cityscape at golden hour with neon-lit buildings, multiple flying vehicles with glowing trails, vibrant purple and orange sky, highly detailed, 4K rendering, cyberpunk aesthetic"

**Generated Image:** (via Replicate Stable Diffusion)

**Evaluation (by Claude Vision):**
- Composition & Layout: 4.5/5 (Good layout, minor differences in building positions)
- Colors & Lighting: 5/5 (Perfect match: purple/orange sunset)
- Subject & Content: 4.5/5 (Flying cars present, excellent detail)
- Style & Artistic Elements: 4/5 (Cyberpunk style, very close match)

**Challenge 1 Score: 18/20** ✓

### 15.2 Challenge 2: Report

**Target Report:** Q4 2025 Financial Analysis with revenue breakdowns, quarterly comparisons, and strategic recommendations

**Student Prompt:** "Create a comprehensive financial analysis report for Q4 2025 including: quarterly revenue breakdown by product line, year-over-year comparison to Q4 2024, expense analysis, profit margins, key financial metrics, market insights, and strategic recommendations. Format with tables, charts references, and executive summary. 1500+ words."

**Generated Report:** (via Claude)

**Evaluation (by Claude):**
- Structure & Organization: 4.5/5 (Similar sections, well-organized)
- Content & Data Accuracy: 4/5 (Realistic financial data, similar depth)
- Formatting & Presentation: 4/5 (Tables formatted well, similar to target)
- Insights & Analysis: 4/5 (Strategic insights provided)

**Challenge 2 Score: 16.5/20** ✓

**Total Round 2 Score: 34.5/40** ✓✓

---

## 16. KNOWN LIMITATIONS & MITIGATIONS

### 16.1 Image Generation Variability

- Stable Diffusion generates different images even with same prompt
- Mitigation: Use fixed seed (if Replicate supports), or average scores across slight variations
- Accept that perfect matching isn't possible, score based on similarity

### 16.2 Report Generation Variability

- Claude generates slightly different reports even with same prompt
- Mitigation: Focus evaluation on structure/content type rather than exact wording
- Score on presence of required sections, not word-for-word matches

### 16.3 Subjective Scoring

- Image/report similarity is subjective
- Mitigation: Use Claude with clear rubrics, not human judges
- Maintain consistency by using same evaluator (Claude API)

### 16.4 Cost at Scale

- For 100+ teams: API costs become significant
- Mitigation: Cache results, batch evaluate after event ends, negotiate API discounts

---


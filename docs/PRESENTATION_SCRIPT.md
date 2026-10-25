# CareFlow AI — Video Presentation Script (2.5 Minutes)
**Role Assessment:** AI Growth & Automation Associate  
**Project:** CareFlow AI — Smart Healthcare Follow-up Assistant  
**Estimated Time:** 2 minutes 30 seconds  

---

### [0:00 - 0:25] 1. The Healthcare Challenge & Hook
* **Visual:** Open on the **Executive Dashboard**. Move cursor across the KPI cards (No-Show Risk Rate, Pending Reviews, Channel Breakdown).
* **Speaker (Confident, professional tone):**
  > *"Every year, outpatient clinics lose billions of dollars and see preventable patient readmissions due to one common breakdown: post-care follow-up failure. Traditional reminder systems are static, robotic, and ignore patient-specific discharge instructions.*
  >
  > *Welcome to **CareFlow AI — Smart Healthcare Follow-up Assistant**. I engineered this full-stack system using React, TypeScript, FastAPI, SQLite, and Google Gemini to automate personalized patient reminders while enforcing strict, enterprise-grade clinical safety boundaries."*

---

### [0:25 - 0:55] 2. Executive Dashboard & Appointment Management
* **Visual:** Hover over the **Interactive 7-Day Follow-up Capacity Chart**, then click on **Appointments & Patients**. Filter by *"Cardiology"* and *"High Risk"*.
* **Speaker:**
  > *"Here on the Executive Dashboard, care teams get real-time visibility into weekly patient capacity, department distributions, and no-show risk metrics.*
  >
  > *In the Appointments Directory, staff can search and filter across specialties, risk levels, and follow-up states. Notice that every patient profile contains structured discharge notes and risk tags. Let’s take Eleanor Vance, a high-risk cardiology patient recovering from a coronary stent. With one click, we open her record directly in our AI Reminder Studio."*

---

### [0:55 - 1:35] 3. The AI Reminder Studio & Clinical Safety Guardrails
* **Visual:** Switch to **AI Reminder Studio**. Select **SMS** channel, click **Generate AI Reminder Draft**. Show the iPhone chat bubble preview and the **AI Safety Guardrail Audit card**.
* **Speaker:**
  > *"In the AI Reminder Studio, CareFlow leverages Google Gemini with specialized clinical prompt engineering. We can generate tailored reminders across SMS, WhatsApp, Email, or outbound Phone Scripts in English, Spanish, French, or Hindi.*
  >
  > *Notice our built-in **Real-Time Safety Audit**. Healthcare AI must never act as an unvetted doctor. CareFlow checks that no unauthorized diagnoses or medication alterations are made, verifies that acute emergency escalation triggers are present, and calculates an audit compliance score.*
  >
  > *Most importantly, we enforce a strict **Human-in-the-Loop** policy. Staff can edit the generated draft directly, log audit remarks, and officially sign off with their clinical credentials before a message can ever leave the hospital."*

---

### [1:35 - 2:05] 4. Prompt Engineering Lab (A/B/C Evaluation)
* **Visual:** Navigate to the **Prompt Lab**. Select the *"Post-Op Wound Infection Red Flag"* scenario and hit **Evaluate All 3 Tiers**. Show the 3-column side-by-side comparison.
* **Speaker:**
  > *"To validate our safety posture, I built the **Prompt Lab**, a side-by-side benchmarking engine comparing Basic, Improved, and Safety-Aware prompts on identical clinical stress cases.*
  >
  > *Observe this surgical infection test case: A naive basic prompt mistakenly tells the patient that fever and pus are normal. The improved prompt is polite, but dangerously tells the patient to wait four days for their visit.*
  >
  > *Only our **Safety-Aware Tier** intercepts the red flag, orders immediate emergency triage, and achieves a 99% safety adherence score. This demonstrates defensive prompt engineering in action."*

---

### [2:05 - 2:30] 5. n8n Automation Engine & Conclusion
* **Visual:** Switch to the **Automation & n8n** tab. Click **Test Webhook Ping**, show the latency and live execution log, then click **Inspect Payload** to display the formatted JSON sent to n8n.
* **Speaker:**
  > *"Finally, our Automation page integrates seamlessly with **n8n webhooks**. Reminders approved by clinical staff can be batch-dispatched to multi-channel nodes like Twilio and SendGrid.*
  >
  > *CareFlow AI includes both an importable n8n workflow and a native simulation engine that runs 100% locally without requiring paid API keys.*
  >
  > *CareFlow AI bridges cutting-edge generative AI, clinical risk guardrails, and enterprise workflow automation. Thank you for watching!"*

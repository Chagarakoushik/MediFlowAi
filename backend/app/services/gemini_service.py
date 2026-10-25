import time
import re
import warnings
from typing import Dict, Any, Optional
from ..config import settings

# Filter deprecation warnings for generative AI SDK
warnings.filterwarnings("ignore", category=FutureWarning)

# Attempt import of Google Generative AI
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

SYSTEM_SAFETY_INSTRUCTIONS = """
You are CareFlow AI, an intelligent, empathetic healthcare follow-up reminder assistant.
CRITICAL CLINICAL SAFETY BOUNDARIES:
1. NEVER provide a diagnosis, change medication dosages, or recommend off-label treatments.
2. NEVER say 'You have disease X' or contradict the attending physician.
3. If the patient has post-surgical red flags (severe bleeding, fever >101F, chest pain, difficulty breathing, acute swelling), immediately advise emergency care (dial 911 / emergency contact).
4. Strictly generate ONLY the reminder message appropriate for the requested channel.
5. All reminders are drafts that MUST BE REVIEWED by clinical staff before dispatch.
6. Tone must remain professional, respectful, empathetic, and clear.
"""

def perform_safety_audit(text: str, channel: str) -> Dict[str, Any]:
    """Inspects generated reminder for medical boundary violations and safety."""
    flags = []
    lower = text.lower()
    
    # 1. Check for unauthorized medication changes
    med_change_patterns = [
        r"increase (?:your )?dose",
        r"decrease (?:your )?dose",
        r"take \d+\s*(?:mg|ml|units|pills)",
        r"stop taking (?:your )?.*(?:medication|pills|drugs|prescript)",
        r"discontinue (?:your )?.*(?:medication|pills)",
        r"substitute with"
    ]
    for pattern in med_change_patterns:
        if re.search(pattern, lower):
            flags.append("Unauthorized medication dosage modification detected")
            break
            
    # 2. Check for unauthorized diagnosis
    diag_patterns = [
        r"you (?:are|have been) diagnosed with",
        r"you are suffering from",
        r"my diagnosis is",
        r"this confirms you have",
        r"you have (?:contracted|developed) [a-z]+"
    ]
    for pattern in diag_patterns:
        if re.search(pattern, lower):
            flags.append("Direct diagnostic statement detected")
            break

    # 3. Check for emergency escalation presence if acute terms found
    acute_terms = ["chest pain", "shortness of breath", "severe fever", "infection", "emergency", "swelling"]
    has_acute = any(term in lower for term in acute_terms)
    has_emergency_redirect = any(redirect in lower for redirect in ["911", "emergency", "urgent care", "call clinic immediately"])

    emergency_redirect_present = False
    if has_acute:
        emergency_redirect_present = has_emergency_redirect
        if not has_emergency_redirect:
            flags.append("High-risk context missing emergency contact/911 redirection")
    else:
        emergency_redirect_present = True

    # Character count limit checks by channel
    char_count = len(text)
    channel_limits = {
        "SMS": 320,
        "WhatsApp": 600,
        "Email": 2000,
        "Phone Script": 1200
    }
    limit = channel_limits.get(channel, 500)
    if char_count > limit * 1.3:
        flags.append(f"Length ({char_count} chars) exceeds recommended limit for {channel}")

    passes_guardrails = len(flags) == 0
    score = max(50, 100 - (len(flags) * 20))

    return {
        "passes_guardrails": passes_guardrails,
        "score": score,
        "flags": flags,
        "emergency_redirect_present": emergency_redirect_present,
        "diagnosis_attempted": any("diagnos" in f for f in flags),
        "medication_change_attempted": any("medication" in f for f in flags),
        "review_required": True,
        "char_count": char_count
    }


def generate_simulated_reminder(
    patient_name: str,
    doctor_name: str,
    department: str,
    appointment_date: str,
    appointment_time: str,
    appointment_type: str,
    discharge_instructions: Optional[str],
    clinical_notes: Optional[str],
    channel: str,
    tone: str,
    language: str,
    custom_instructions: Optional[str]
) -> Dict[str, Any]:
    """Produces high quality, clinically sound simulated follow-up reminders."""
    time.sleep(0.35) # realistic simulated latency
    
    first_name = patient_name.split()[0]
    instructions_snip = f" Reminder: {discharge_instructions.strip()}" if discharge_instructions else ""
    
    if language.lower() == "spanish":
        if channel == "SMS":
            text = (
                f"Hola {first_name}, le recordamos su cita de seguimiento de {department} con {doctor_name} "
                f"el {appointment_date} a las {appointment_time}.{instructions_snip} "
                f"Responda 1 para confirmar o llámenos al (555) 019-2834 para reagendar. Clínica MediFlow."
            )
            subject = None
        elif channel == "WhatsApp":
            text = (
                f"👋 Hola {patient_name},\n\n"
                f"Le saludamos de MediFlow Clinic. Le recordamos su cita programada de *{appointment_type}*:\n"
                f"📅 *Fecha:* {appointment_date}\n"
                f"⏰ *Hora:* {appointment_time}\n"
                f"👨‍⚕️ *Especialista:* {doctor_name} ({department})\n\n"
                f"📋 *Indicaciones previas:*{instructions_snip}\n\n"
                f"Por favor confirme su asistencia respondiendo *SÍ* a este mensaje. Si presenta síntomas de alarma o dolor agudo, acuda al centro de urgencias más cercano."
            )
            subject = None
        else:
            subject = f"Recordatorio de Consulta Médica - {patient_name} ({appointment_date})"
            text = (
                f"Estimado/a {patient_name},\n\n"
                f"Esperamos que se encuentre bien. Este es un recordatorio formal para su próxima consulta de {appointment_type} con {doctor_name} en el departamento de {department}.\n\n"
                f"Detalles de la Cita:\n"
                f"- Fecha: {appointment_date}\n"
                f"- Hora: {appointment_time}\n"
                f"- Ubicación: Suite Médica Central MediFlow\n\n"
                f"Instrucciones de Cuidado:\n{discharge_instructions or 'Por favor traiga su lista actualizada de medicamentos y estudios recientes.'}\n\n"
                f"Si experimenta dolor en el pecho, dificultad respiratoria o síntomas agudos, comuníquese al 911 o acuda a urgencias de inmediato.\n\n"
                f"Atentamente,\nEquipo de Coordinación Clínica MediFlow"
            )
    else:
        # English
        if channel == "SMS":
            if tone.lower().startswith("direct"):
                text = (
                    f"MediFlow Alert: {first_name}, your {department} follow-up with {doctor_name} is scheduled for "
                    f"{appointment_date} at {appointment_time}.{instructions_snip} "
                    f"Reply YES to confirm or call 555-019-2834 to reschedule. In emergency, call 911."
                )
            else:
                text = (
                    f"Hi {first_name}, this is CareFlow from MediFlow Clinic. A gentle reminder of your upcoming "
                    f"{appointment_type} with {doctor_name} on {appointment_date} at {appointment_time}.{instructions_snip} "
                    f"Reply YES to confirm or call 555-019-2834 to reschedule."
                )
            subject = None
        elif channel == "WhatsApp":
            text = (
                f"Hello {patient_name} 👋,\n\n"
                f"This is your care team from *MediFlow Clinic*. We look forward to seeing you for your upcoming *{appointment_type}*:\n\n"
                f"🗓️ *Date:* {appointment_date}\n"
                f"🕒 *Time:* {appointment_time}\n"
                f"🩺 *Doctor:* {doctor_name} — {department}\n\n"
                f"📌 *Clinical Care Note:*\n{discharge_instructions or 'Please bring your current medication list and recent test reports.'}\n\n"
                f"💬 *Action required:* Please reply *YES* to confirm this slot, or reply *RESCHEDULE* if you need another time.\n\n"
                f"⚠️ *Important:* If you experience acute symptoms, sudden shortness of breath, or chest pain, please call 911 or visit the nearest ER."
            )
            subject = None
        elif channel == "Phone Script":
            text = (
                f"PHONE CALL SCRIPT (STAFF CONCIERGE):\n"
                f"1. Greeting: 'Hello, may I speak with {patient_name}? This is [Staff Name] calling from MediFlow {department}.'\n"
                f"2. Purpose: 'I am calling to confirm your upcoming {appointment_type} with {doctor_name} on {appointment_date} at {appointment_time}.'\n"
                f"3. Health Check: 'How have you been feeling since your last visit? Are you having any concerns with your recovery or routine?'\n"
                f"4. Clinical Instructions: 'As a reminder from Dr. {doctor_name.split()[-1]}: {discharge_instructions or 'Please remember to bring your recent lab work and insurance card.'}'\n"
                f"5. Red Flag Disclaimer: 'If you develop any acute warning signs like severe fever, sudden pain, or chest tightness, do not wait for this visit—contact our triage desk immediately or call 911.'\n"
                f"6. Closing: 'We have you confirmed. Thank you {first_name}, and have a wonderful day!'"
            )
            subject = None
        else: # Email
            subject = f"Appointment Confirmation & Follow-up Instructions - {appointment_date} | MediFlow Clinic"
            text = (
                f"Dear {patient_name},\n\n"
                f"We hope you are having a restful week. This is a personalized reminder from the {department} care team at MediFlow Clinic regarding your scheduled follow-up consultation.\n\n"
                f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                f"APPOINTMENT DETAILS:\n"
                f"• Patient: {patient_name}\n"
                f"• Physician: {doctor_name}\n"
                f"• Department: {department}\n"
                f"• Visit Type: {appointment_type}\n"
                f"• Date: {appointment_date}\n"
                f"• Time: {appointment_time}\n"
                f"• Location: Suite 402, MediFlow Healthcare Center\n"
                f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
                f"CLINICAL PREPARATION & DISCHARGE GUIDELINES:\n"
                f"{discharge_instructions or 'Please bring a photo ID, your insurance card, and an updated list of all medications you are currently taking.'}\n\n"
                f"NEED TO RESCHEDULE?\n"
                f"If you need to adjust your appointment time, please call our care line at (555) 019-2834 at least 24 hours in advance.\n\n"
                f"IMPORTANT SAFETY NOTICE:\n"
                f"This communication is for informational and scheduling purposes only and does not constitute acute emergency triage. If you experience severe chest pain, sudden numbness, high fever, or difficulty breathing, call 911 or proceed to the nearest emergency department immediately.\n\n"
                f"Warm regards,\n"
                f"The CareFlow Clinical Team\n"
                f"MediFlow Healthcare System"
            )
            
    safety = perform_safety_audit(text, channel)
    
    return {
        "text": text,
        "subject": subject,
        "model": "careflow-simulated-guardrail-v1",
        "is_simulated": True,
        "safety_audit": safety
    }


def generate_gemini_reminder(
    patient_name: str,
    doctor_name: str,
    department: str,
    appointment_date: str,
    appointment_time: str,
    appointment_type: str,
    discharge_instructions: Optional[str],
    clinical_notes: Optional[str],
    channel: str,
    tone: str,
    language: str,
    custom_instructions: Optional[str]
) -> Dict[str, Any]:
    """Generates reminder using live Google Gemini API with fallback."""
    if not settings.has_gemini_key or not GENAI_AVAILABLE:
        return generate_simulated_reminder(
            patient_name, doctor_name, department, appointment_date, appointment_time,
            appointment_type, discharge_instructions, clinical_notes, channel, tone, language, custom_instructions
        )
        
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            system_instruction=SYSTEM_SAFETY_INSTRUCTIONS
        )
        
        prompt = f"""
Generate an appointment follow-up reminder for a healthcare clinic.
Patient Name: {patient_name}
Physician: {doctor_name}
Department: {department}
Visit Type: {appointment_type}
Appointment Date & Time: {appointment_date} at {appointment_time}
Discharge / Care Instructions: {discharge_instructions or 'Standard routine follow-up'}
Clinical Background (Fictional): {clinical_notes or 'Stable recovery'}
Delivery Channel: {channel} (Format appropriately: concise for SMS/WhatsApp, professional letter for Email, step-by-step dialogue for Phone Script)
Tone: {tone}
Language: {language}
Additional Clinic Notes: {custom_instructions or 'None'}

RULES:
- Do not make clinical diagnoses.
- Keep safety boundaries.
- Include clinic contact (555-019-2834) and emergency reminder (call 911 if acute).
- If channel is Email, provide 'SUBJECT: [subject line]' on line 1, then the body.
"""
        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        
        subject = None
        if channel == "Email" and raw_text.startswith("SUBJECT:"):
            lines = raw_text.split("\n", 1)
            subject = lines[0].replace("SUBJECT:", "").strip()
            text = lines[1].strip() if len(lines) > 1 else raw_text
        else:
            text = raw_text
            
        safety = perform_safety_audit(text, channel)
        return {
            "text": text,
            "subject": subject,
            "model": settings.GEMINI_MODEL,
            "is_simulated": False,
            "safety_audit": safety
        }
    except Exception as e:
        # Graceful fallback to simulation on quota, network or auth error
        result = generate_simulated_reminder(
            patient_name, doctor_name, department, appointment_date, appointment_time,
            appointment_type, discharge_instructions, clinical_notes, channel, tone, language, custom_instructions
        )
        result["safety_audit"]["fallback_reason"] = f"Gemini API returned: {str(e)[:120]}. Fell back to simulated engine."
        return result

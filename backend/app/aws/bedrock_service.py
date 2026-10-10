"""
AWS Bedrock Integration Service for AirTrack.
Uses boto3 (AWS Open Source SDK) to invoke Claude 3 Sonnet / Titan for dynamic School Safety Protocols.
Includes an intelligent offline fallback for local Demo Mode.
"""
import os
import json
from typing import Dict, Any, Optional
import boto3
from botocore.exceptions import ClientError, NoCredentialsError

class BedrockAdvisoryService:
    def __init__(self):
        self.region = os.getenv("AWS_REGION", "us-east-1")
        self.enabled = os.getenv("ENABLE_AWS_BEDROCK", "false").lower() in ("true", "1", "yes")
        self.client = None
        if self.enabled:
            try:
                self.client = boto3.client("bedrock-runtime", region_name=self.region)
            except (NoCredentialsError, Exception):
                self.client = None

    def generate_school_protocol(
        self,
        location_name: str,
        aqi_value: int,
        category: str,
        dominant_pollutant: str,
        verdict: str
    ) -> Dict[str, Any]:
        """
        Generates an actionable, binding School Air Safety Protocol.
        Falls back to deterministic official CPCB guidance if AWS credentials are not configured.
        """
        if self.client and self.enabled:
            try:
                prompt = f"""
                You are an environmental public health advisor for schools in India adhering to Central Pollution Control Board (CPCB) standards.
                Location: {location_name}
                Current AQI: {aqi_value} ({category})
                Dominant Pollutant: {dominant_pollutant}
                Computed Verdict: {verdict}

                Generate a structured JSON response with:
                1. assemblyAction: (Proceed normally | Relocate indoors | Suspend)
                2. outdoorSportsStatus: (Normal | Light only | Suspended)
                3. classroomMeasures: list of 3 concrete actions
                4. parentNotice: a 1-sentence draft message for school SMS/WhatsApp
                5. healthPriority: High/Critical/Normal
                Output ONLY valid JSON.
                """
                
                body = json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 500,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.2
                })
                
                response = self.client.invoke_model(
                    modelId="anthropic.claude-3-sonnet-20240229-v1:0",
                    body=body
                )
                response_body = json.loads(response["body"].read())
                ai_text = response_body["content"][0]["text"]
                return json.loads(ai_text)
            except Exception:
                pass  # Fall through to deterministic high-reliability protocol

        # Deterministic Expert Fallback (Matches official CPCB Graded Response Action Plan)
        if aqi_value <= 100:
            return {
                "assemblyAction": "Proceed normally in open air grounds",
                "outdoorSportsStatus": "All physical activities permitted",
                "classroomMeasures": [
                    "Keep classroom windows open for cross-ventilation",
                    "Ensure adequate student hydration",
                    "Monitor any students with preexisting respiratory issues"
                ],
                "parentNotice": f"Air quality at {location_name} is currently satisfactory ({aqi_value} AQI). All outdoor school activities are proceeding as scheduled.",
                "healthPriority": "NORMAL",
                "source": "CPCB Standard School Protocol (Demo Engine)"
            }
        elif aqi_value <= 200:
            return {
                "assemblyAction": "Shorten morning assembly to under 15 minutes",
                "outdoorSportsStatus": "Reduce high-intensity aerobic sports; offer light drill",
                "classroomMeasures": [
                    "Close windows during morning peak traffic (8:00 - 9:30 AM)",
                    "Permit sensitive and asthmatic students to remain in the library",
                    "Keep rescue inhalers accessible at the infirmary"
                ],
                "parentNotice": f"Advisory for {location_name}: Moderate air quality ({aqi_value} AQI). High-intensity outdoor drills are modified to protect student lung health.",
                "healthPriority": "MODERATE",
                "source": "CPCB Standard School Protocol (Demo Engine)"
            }
        elif aqi_value <= 300:
            return {
                "assemblyAction": "Relocate morning assembly inside auditorium or classrooms",
                "outdoorSportsStatus": "Cancel all outdoor sports and physical education",
                "classroomMeasures": [
                    "Mandate closed classroom doors and windows",
                    "Deploy active air filtration or turn on HEPA units if available",
                    "Advise students commuting by bus/bicycle to wear certified N95 masks"
                ],
                "parentNotice": f"Notice from {location_name}: Air quality is POOR ({aqi_value} AQI). Outdoor sports and assemblies are canceled today. Students are indoors.",
                "healthPriority": "HIGH",
                "source": "CPCB GRAP Stage-II Protocol (Demo Engine)"
            }
        else:
            return {
                "assemblyAction": "Zero outdoor assembly. Disperse directly to sealed classrooms",
                "outdoorSportsStatus": "STRICTLY SUSPENDED. No outdoor recess allowed",
                "classroomMeasures": [
                    "Seal room perimeters and run continuous air purification",
                    "Mandatory N95 mask distribution for all outdoor transit",
                    "Prepare transition advisory for hybrid / online distance learning"
                ],
                "parentNotice": f"EMERGENCY PROTOCOL ({location_name}): AQI is {aqi_value} ({category}). All outdoor activity is strictly banned. Monitor school app for potential online shift.",
                "healthPriority": "CRITICAL",
                "source": "CPCB GRAP Stage-IV Emergency Protocol (Demo Engine)"
            }

bedrock_service = BedrockAdvisoryService()

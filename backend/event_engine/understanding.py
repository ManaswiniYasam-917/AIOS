"""Advanced Event Understanding Engine.

Uses a synonym dictionary, weighted keyword scoring, and confidence
thresholds to classify raw input text into event categories.

CRITICAL RULES:
  - NEVER default to 'road_accident'.
  - If no category matches with sufficient confidence, return 'unclassified'.
  - The frontend will prompt the user for clarification on 'unclassified'.
"""

from typing import Dict, List, Tuple

# ── Synonym Dictionary ────────────────────────────────────────────────────────
# Each category maps to a list of synonym phrases.  Longer phrases are checked
# first (multi-word matching) so "short circuit" beats "short" alone.

SYNONYM_DICTIONARY: Dict[str, List[str]] = {
    "power_failure": [
        "power gone", "power outage", "power cut", "power failure", "power lost",
        "no power", "no electricity", "no current", "current gone", "current is not coming",
        "electricity gone", "electricity lost", "electricity failed", "electricity cut",
        "grid failure", "grid down", "grid collapsed",
        "transformer exploded", "transformer failed", "transformer blew",
        "transformer burst", "transformer fire", "transformer damaged",
        "blackout", "brownout", "voltage drop", "voltage failure",
        "substation", "substation failure", "substation exploded",
        "power grid", "power line down", "power line fell",
        "electric pole fell", "electric pole broken",
        "no light", "lights gone", "lights out",
    ],
    "vehicle_fire": [
        "short circuit", "short circuited", "buses short circuited",
        "bus short circuit", "electric bus fire", "electrical fire",
        "electrical short", "wiring fire", "cable fire",
        "bus caught fire", "bus burning", "bus on fire",
        "vehicle caught fire", "vehicle fire", "car fire",
        "engine fire", "battery fire", "battery explosion",
        "electric vehicle fire", "ev fire", "ev battery fire",
    ],
    "building_fire": [
        "building fire", "building is burning", "building is on fire",
        "building on fire", "building caught fire", "building ablaze",
        "house fire", "house is burning", "house on fire",
        "apartment fire", "apartment burning", "apartment on fire",
        "office fire", "office burning", "office on fire",
        "warehouse fire", "godown fire", "shop fire",
        "mall fire", "mall burning", "factory fire",
        "wildfire", "wild fire", "forest fire", "jungle fire",
        "bush fire", "bushfire", "grassland fire",
        "fire", "burning", "blaze", "flames", "smoke",
        "inferno", "conflagration", "arson",
    ],
    "flash_flood": [
        "flood", "flooding", "flooded", "flash flood",
        "water entered house", "water entered houses",
        "village flooded", "village is flooded", "my village is flooded",
        "heavy rain", "heavy rainfall", "rain water",
        "river overflow", "river overflowed", "river flooded",
        "water level rising", "water level high",
        "deluge", "inundation", "waterlogging", "water logging",
        "dam burst", "dam break", "dam overflowed",
        "tsunami", "tidal wave", "storm surge",
        "cyclone flood", "hurricane flood",
    ],
    "cyber_attack": [
        "cyber attack", "cyberattack", "cyber threat",
        "hacked", "hack", "hacking", "hacker",
        "data leak", "data breach", "data stolen",
        "server hacked", "server attack", "server breach",
        "database breach", "database hack", "database attack",
        "ransomware", "malware", "virus attack", "virus detected",
        "trojan", "spyware", "phishing", "ddos",
        "network attack", "network breach", "network intrusion",
        "bank server", "bank hacked", "system compromised",
        "identity theft", "credential theft",
    ],
    "road_accident": [
        "road accident", "car accident", "car crash", "car collision",
        "bus accident", "bus crash", "bus collision",
        "truck accident", "truck crash", "truck collision",
        "vehicle accident", "vehicle crash", "vehicle collision",
        "bike accident", "bike crash", "motorbike accident",
        "auto accident", "auto crash", "auto collision",
        "hit and run", "highway accident", "highway crash",
        "road crash", "road collision", "traffic accident",
        "bus collided with truck", "car hit", "truck hit",
        "pileup", "pile up", "multi vehicle crash",
        "pedestrian hit", "pedestrian accident",
    ],
    "road_accident_injured": [
        "accident with injuries", "accident injuries reported",
        "people injured in accident", "crash with casualties",
        "fatal accident", "fatal crash", "people dead in accident",
        "people hurt in crash", "people died in accident",
    ],
    "industrial_accident": [
        "industrial accident", "factory accident", "factory explosion",
        "boiler explosion", "boiler exploded", "boiler burst",
        "factory boiler", "pressure vessel", "pressure vessel burst",
        "chemical spill", "chemical leak", "gas leak",
        "hazmat", "hazardous material", "hazardous spill",
        "toxic leak", "toxic gas", "toxic fumes",
        "refinery explosion", "plant explosion", "mine collapse",
        "mine accident", "mining accident",
    ],
    "medical_emergency": [
        "medical emergency", "person fainted", "person collapsed",
        "heart attack", "cardiac arrest", "stroke",
        "unconscious", "not breathing", "breathing difficulty",
        "patient critical", "hospital emergency",
        "someone fainted", "someone collapsed", "someone unconscious",
        "epileptic seizure", "seizure", "diabetic emergency",
        "allergic reaction", "anaphylaxis", "choking",
        "bleeding heavily", "severe bleeding", "haemorrhage",
        "overdose", "drug overdose", "poisoning",
        "snake bite", "animal attack", "dog bite",
    ],
    "airport_emergency": [
        "airport emergency", "aircraft emergency",
        "plane crash", "plane emergency", "airplane crash",
        "flight emergency", "runway blocked", "runway accident",
        "airport runway blocked", "landing gear failure",
        "engine failure aircraft", "bird strike",
        "pilot emergency", "aviation emergency",
        "helicopter crash", "helicopter emergency",
        "mid air collision", "turbulence emergency",
    ],
    "agriculture_emergency": [
        "crop failure", "crop emergency", "crop disease",
        "farm emergency", "farm fire", "farm flood",
        "agriculture emergency", "agriculture crisis",
        "harvest failure", "harvest destroyed",
        "irrigation failed", "irrigation broken",
        "soil erosion", "drought", "drought emergency",
        "pest attack", "locust attack", "locust swarm",
        "cattle disease", "livestock emergency",
    ],
    "defense_intrusion": [
        "security intrusion", "border intrusion", "border crossing",
        "unauthorised crossing", "unauthorized crossing",
        "military threat", "military intrusion",
        "defense breach", "defense alert",
        "invasion", "infiltration", "infiltrator",
        "bomb blast", "bomb threat", "bomb detected",
        "explosion", "blast", "bombing",
        "terrorist attack", "terrorism", "terror threat",
        "security threat", "suspicious package",
        "hostage", "hostage situation", "kidnapping",
        "shooting", "gunfire", "armed threat",
    ],
    "railway_emergency": [
        "train derailed", "train derailment", "train crash",
        "train accident", "railway accident", "rail accident",
        "railway emergency", "train collision", "train fire",
        "metro accident", "metro crash", "subway accident",
        "rail track blocked", "train breakdown",
    ],
    "maritime_emergency": [
        "ship sinking", "ship sank", "ship on fire",
        "boat capsized", "boat sinking", "boat accident",
        "maritime emergency", "sea rescue", "man overboard",
        "oil spill", "oil tanker", "port emergency",
    ],
}


def _score_category(text_lower: str, synonyms: List[str]) -> float:
    """Compute a weighted match score for a category.

    Longer multi-word phrases score higher than single-word matches to
    reduce false positives.  The final score is normalized to [0, 1].
    """
    total_score = 0.0
    max_possible = 0.0

    for phrase in synonyms:
        word_count = len(phrase.split())
        weight = word_count * 2.0  # Multi-word phrases score higher
        max_possible += weight
        if phrase in text_lower:
            total_score += weight

    if max_possible == 0:
        return 0.0
    return total_score / max_possible


def understand_event(text: str) -> Tuple[str, float]:
    """Classify *text* into an event category with a confidence score.

    Returns:
        (category_id, confidence)  where confidence is in [0.0, 1.0].
        If no category matches above threshold, returns ('unclassified', 0.0).

    CRITICAL: Never defaults to 'road_accident'.
    """
    if not text or not text.strip():
        return ("unclassified", 0.0)

    t = text.lower().strip()

    # Phase 1: Check for exact multi-word phrase matches (highest confidence)
    best_category = ""
    best_score = 0.0

    for category, synonyms in SYNONYM_DICTIONARY.items():
        # Sort synonyms by length (longest first) for priority matching
        sorted_synonyms = sorted(synonyms, key=len, reverse=True)
        for phrase in sorted_synonyms:
            if phrase in t:
                word_count = len(phrase.split())
                # Multi-word exact match = high confidence
                phrase_confidence = min(0.5 + (word_count * 0.15), 1.0)
                if phrase_confidence > best_score:
                    best_score = phrase_confidence
                    best_category = category
                    if best_score >= 0.95:
                        break
        if best_score >= 0.95:
            break

    # Phase 2: If Phase 1 found something, compute aggregate score to boost confidence
    if best_category and best_score >= 0.5:
        aggregate = _score_category(t, SYNONYM_DICTIONARY[best_category])
        # Blend: primary phrase match + aggregate density
        final_confidence = min(best_score * 0.7 + aggregate * 0.3 + 0.1, 1.0)

        # Special: check for injuries in road accident
        if best_category == "road_accident":
            injury_words = ["injur", "hurt", "casualt", "wound", "dead", "die",
                            "fatal", "killed", "people"]
            if any(w in t for w in injury_words):
                best_category = "road_accident_injured"

        return (best_category, round(final_confidence, 2))

    # Phase 3: Nothing matched — return unclassified (NEVER default to road_accident)
    return ("unclassified", 0.0)


__all__ = ["understand_event", "SYNONYM_DICTIONARY"]

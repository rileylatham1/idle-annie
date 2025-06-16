import httpx

MUSICBRAINZ_SEARCH_URL = "https://musicbrainz.org/ws/2/recording"
ACOUSTICBRAINZ_URL = "https://acousticbrainz.org/api/v1"

def extract_ab_metrics(hl: dict) -> dict:
    """Return (energy, danceability, valence, tempo) as floats ∈ [0,1]."""
    # 1) Danceability --------------------------------------------
    d_info = hl.get("danceability", {})
    d_prob = float(d_info.get("probability", 0.5))
    danceability = d_prob if d_info.get("value") == "danceable" else 1.0 - d_prob

    # 2) Tempo -----------------------------------------------------
    tempo_raw = float(hl.get("bpm", {}).get("value", 100.0))
    tempo = max(0.0, min(tempo_raw / 200.0, 1.0))  # 0 – 1

    # 3) Valence (happiness) --------------------------------------
    h_info = hl.get("mood_happy", {})
    h_prob = float(h_info.get("probability", 0.5))
    valence = h_prob if h_info.get("value") == "happy" else 1.0 - h_prob

    # 4) Energy (inverse of relaxed) ------------------------------
    r_info = hl.get("mood_relaxed", {})
    r_prob = float(r_info.get("probability", 0.5))
    energy = 1.0 - r_prob  # 0 chill → 1 energetic

    return {
        "energy": round(energy, 3),
        "danceability": round(danceability, 3),
        "valence": round(valence, 3),
        "tempo": round(tempo, 3),
    }

async def get_acousticbrainz_features(isrc: str) -> dict:
    async with httpx.AsyncClient(headers={"User-Agent": "YourAppName/1.0"}) as client:
        # MusicBrainz search
        params = {"query": f"isrc:{isrc}", "fmt": "json", "limit": 1}
        mb_resp = await client.get("https://musicbrainz.org/ws/2/recording/", params=params)
        if mb_resp.status_code != 200:
            raise Exception(f"MusicBrainz ISRC search failed: {mb_resp.text}")
        recordings = mb_resp.json().get("recordings", [])
        if not recordings:
            raise Exception("No MusicBrainz recordings found")

        mbid = recordings[0]["id"]

        # High-level data
        ab_high_resp = await client.get(f"https://acousticbrainz.org/api/v1/{mbid}/high-level")
        if ab_high_resp.status_code != 200:
            raise Exception("No AcousticBrainz high-level data found")
        highlevel = ab_high_resp.json().get("highlevel", {})

        # Low-level data
        ab_low_resp = await client.get(f"https://acousticbrainz.org/api/v1/{mbid}/low-level")
        if ab_low_resp.status_code != 200:
            raise Exception("No AcousticBrainz low-level data found")
        lowlevel = ab_low_resp.json()

        beats = lowlevel.get("rhythm", {}).get("beats_position", [])
        mfccs = lowlevel.get("lowlevel", {}).get("mfcc", []).get("mean", [])


        # Extract metrics function (your existing or updated one)
        metrics = extract_ab_metrics(highlevel)

        return {
            "success": True,
            **metrics,
            "beats": beats,
            "mfccs": mfccs,
        }

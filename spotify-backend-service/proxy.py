from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import grpc
import protos.spotify_pb2 as pb2
import protos.spotify_pb2_grpc as pb2_grpc
from typing import List
import httpx
from utils import get_acousticbrainz_features

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Must be False if using "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model for the frontend to send an auth code
class AuthCode(BaseModel):
    code: str

# Note for future self this is already working, don't fuck with it
@app.post("/auth/exchange")
def exchange_code(auth_code: AuthCode):
    try:
        with grpc.insecure_channel("127.0.0.1:50051") as channel:
            stub = pb2_grpc.SpotifyAuthStub(channel)
            request = pb2.AuthCodeRequest(code=auth_code.code)
            response = stub.ExchangeCode(request)
            if response.success:
                return {"session_token": response.session_token, "success": True}
            else:
                return {"session_token": "", "success": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class LikedTracksRequest(BaseModel):
    access_token: str
    total: int = 50

@app.post("/tracks/liked")
def get_liked_tracks(request: LikedTracksRequest):
    try:
        with grpc.insecure_channel("127.0.0.1:50051") as channel:
            stub = pb2_grpc.SpotifyAuthStub(channel)
            grpc_request = pb2.LikedTracksRequest(
                access_token=request.access_token,
                total=request.total
            )
            response = stub.GetLikedTracks(grpc_request)
            return {
                "tracks": [
                    {
                        "name": track.name,
                        "artist": track.artist,
                        "id": track.id,
                        "album": {
                            "name": track.album.name,
                            "uri": track.album.uri,
                            "id": track.album.id,
                            "images": [{"url": url} for url in track.album.images.url]
                        },
                        "uri": track.uri
                    } for track in response.tracks
                ],
                "success": response.success
            }
    except grpc.RpcError as e:
        raise HTTPException(status_code=e.code().value[0], detail=e.details())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
class PlayNextTrackRequest(BaseModel):
    access_token: str
    current_track_uri: str
    uris: List[str]

@app.post("/tracks/play-next")
def play_next_track(request: PlayNextTrackRequest):
    try:
        with grpc.insecure_channel("127.0.0.1:50051") as channel:
            stub = pb2_grpc.SpotifyAuthStub(channel)
            grpc_request = pb2.PlayNextTrackRequest(
                access_token=request.access_token,
                current_track_uri=request.current_track_uri,
                uris=request.uris  # This is a list of strings
            )
            response = stub.PlayNextTrack(grpc_request)
            return {"success": response.success}
    except grpc.RpcError as e:
        raise HTTPException(status_code=e.code().value[0], detail=e.details())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class GetAudioVisualData(BaseModel):
    access_token: str
    track_id: str

@app.post("/audio-analysis")
async def audio_analysis(request: GetAudioVisualData):
    print(">>> /audio-analysis endpoint hit")
    track_id = request.track_id
    access_token = request.access_token
    if not track_id or not access_token:
        return {"success": False, "error": "Missing track_id or access_token"}

    async with httpx.AsyncClient() as client:
        # Step 1: Get Spotify track metadata
        track_url = f"https://api.spotify.com/v1/tracks/{track_id}"
        headers = {"Authorization": f"Bearer {access_token}"}
        track_resp = await client.get(track_url, headers=headers)
        if track_resp.status_code != 200:
            return {"success": False, "error": f"Spotify track metadata error: {track_resp.text}"}
        track_data = track_resp.json()

    isrc = track_data.get("external_ids", {}).get("isrc")
    print(isrc)

    if not isrc:
        raise Exception("No ISRC found in Spotify metadata")

    try:
        features = await get_acousticbrainz_features(isrc)
        print(f"AcousticBrainz features: {features}")
        return {"success": True, **features}
    except Exception as e:
        return {"success": False, "error": str(e)}

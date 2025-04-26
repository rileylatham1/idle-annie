import grpc
from concurrent import futures
import protos.spotify_pb2 as pb2
import protos.spotify_pb2_grpc as pb2_grpc
import requests
import base64
import os
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)

# Load environment variables (you can also hardcode the client ID/secret)
CLIENT_ID = os.getenv('VITE_SPOTIFY_CLIENT_ID')
CLIENT_SECRET = os.getenv('VITE_SPOTIFY_CLIENT_SECRET')
REDIRECT_URI = 'http://127.0.0.1:5173/callback'


class SpotifyAuthServicer(pb2_grpc.SpotifyAuthServicer):
    def ExchangeCode(self, request, context):
        try:
            if not CLIENT_ID or not CLIENT_SECRET:
                raise ValueError("Missing Spotify CLIENT_ID or CLIENT_SECRET")

            auth_code = request.code
            print(f"Received auth code: {auth_code}")
            logging.info(f"Received auth code: {auth_code}")

            token_url = "https://accounts.spotify.com/api/token"
            auth_header = {
                'Authorization': f'Basic {self._get_basic_auth()}',
                'Content-Type': 'application/x-www-form-urlencoded'
            }

            data = {
                'grant_type': 'authorization_code',
                'code': auth_code,
                'redirect_uri': REDIRECT_URI
            }

            response = requests.post(token_url, headers=auth_header, data=data)
            logging.info(f"Spotify API response status: {response.status_code}")
            logging.info(f"Spotify API response body: {response.text}")

            if response.status_code == 200:
                token_data = response.json()
                session_token = token_data['access_token']
                return pb2.AuthResponse(session_token=session_token, success=True)
            else:
                context.set_details(response.text)
                context.set_code(grpc.StatusCode.INTERNAL)
                return pb2.AuthResponse(session_token="", success=False)

        except Exception as e:
            logging.exception("Unexpected error in ExchangeCode")
            context.set_details(str(e))
            context.set_code(grpc.StatusCode.INTERNAL)
            return pb2.AuthResponse(session_token="", success=False)


    def GetLikedTracks(self, request, context):
        try:
            token = request.access_token
            total = request.total or 50
            offset = 0
            all_tracks = []

            while offset < total:
                response = requests.get(
                    f"https://api.spotify.com/v1/me/tracks?limit=50&offset={offset}",
                    headers={"Authorization": f"Bearer {token}"}
                )

                if response.status_code != 200:
                    context.set_details(f"Spotify API error: {response.text}")
                    context.set_code(grpc.StatusCode.INTERNAL)
                    return pb2.LikedTracksResponse(success=False)

                data = response.json()
                for item in data.get("items", []):
                    track_data = item.get("track", {})
                    artist_name = track_data["artists"][0]["name"] if track_data.get("artists") else ""

                    album_data = track_data.get("album", {})
                    album_name = album_data.get("name", "")
                    album_id = album_data.get("id", "")
                    album_uri = album_data.get("uri", "")

                    # Extract image URLs
                    image_urls = [img["url"] for img in album_data.get("images", []) if "url" in img]
                    album_images = pb2.AlbumImages(url=image_urls)

                    # Build album proto
                    album = pb2.Album(
                        name=album_name,
                        id=album_id,
                        uri=album_uri,
                        images=album_images
                    )

                    # Log for debugging
                    logging.info(f"Track: {track_data.get('name', '')}, Track ID: {track_data.get('id', '')}, Artist: {artist_name}, Album: {album_name}")

                    # Append to results
                    all_tracks.append(pb2.Track(
                        name=track_data.get("name", ""),
                        id=track_data.get("id", ""),
                        artist=artist_name,
                        album=album,
                        uri=track_data.get("uri", "")
                    ))

                offset += 50

            return pb2.LikedTracksResponse(tracks=all_tracks, success=True)

        except Exception as e:
            logging.exception("Failed to fetch liked tracks")
            context.set_details(str(e))
            context.set_code(grpc.StatusCode.INTERNAL)
            return pb2.LikedTracksResponse(success=False)

    def PlayNextTrack(self, request, context):
        try:
            token = request.access_token
            current_uri = request.current_track_uri
            uris = list(request.uris)

            if not uris:
                context.set_details("No URIs provided")
                context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
                return pb2.PlayNextTrackResponse(success=False)

            # Move the selected track to the front of the list
            try:
                uris.remove(current_uri)
            except ValueError:
                pass  # If it's not in the list, just let it be first

            ordered_uris = [current_uri] + uris

            play_response = requests.put(
                "https://api.spotify.com/v1/me/player/play",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                },
                json={
                    "uris": ordered_uris
                }
            )

            if play_response.status_code not in [200, 204]:
                context.set_details(f"Spotify playback error: {play_response.text}")
                context.set_code(grpc.StatusCode.INTERNAL)
                return pb2.PlayNextTrackResponse(success=False)

            return pb2.PlayNextTrackResponse(success=True)

        except Exception as e:
            logging.exception("Playback error")
            context.set_details(str(e))
            context.set_code(grpc.StatusCode.INTERNAL)
            return pb2.PlayNextTrackResponse(success=False)

    def _get_basic_auth(self):
        # Encodes client_id:client_secret in base64
        return base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode('utf-8')).decode('utf-8')


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    pb2_grpc.add_SpotifyAuthServicer_to_server(SpotifyAuthServicer(), server)

    logging.info("Starting gRPC server on port 50051...")
    server.add_insecure_port('[::]:50051')
    server.start()

    try:
        server.wait_for_termination()
    except KeyboardInterrupt:
        logging.info("Shutting down gRPC server...")
        server.stop(0)


if __name__ == '__main__':
    serve()
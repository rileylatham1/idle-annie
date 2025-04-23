# Spotify Backend Service

This project is a lightweight backend service designed to support Spotify player functionalities. It provides an API for interacting with Spotify's playback features, allowing users to play tracks, manage playlists, and more.

## Project Structure

- **src/index.ts**: Entry point of the application. Sets up the Express server and initializes routes.
- **src/controllers/spotifyController.ts**: Contains the `SpotifyController` class with methods for handling Spotify-related requests.
- **src/routes/spotifyRoutes.ts**: Defines the routes for the Spotify API endpoints and connects them to the controller methods.
- **src/services/spotifyService.ts**: Contains functions that interact with the Spotify API, including playback control.
- **src/utils/apiClient.ts**: Utility functions for setting up API client configurations for Spotify requests.

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd spotify-backend-service
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Configure your Spotify API credentials in a `.env` file or directly in the code.

5. Start the server:
   ```
   npm start
   ```

## Usage

Once the server is running, you can interact with the API endpoints defined in `spotifyRoutes.ts`. Use tools like Postman or curl to test the endpoints.

### Example Endpoint

- **Play a Track**: 
  - Method: `PUT`
  - Endpoint: `/api/spotify/play`
  - Body: 
    ```json
    {
      "albumContextUri": "spotify:album:<album_id>",
      "trackContextUri": ["spotify:track:<track_id>"],
      "token": "<your_access_token>"
    }
    ```

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
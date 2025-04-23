import express from 'express';
import { SpotifyController } from '../controllers/spotifyController';
import { SpotifyService } from '../services/spotifyService';

const router = express.Router();
const spotifyService = new SpotifyService();
const spotifyController = new SpotifyController(spotifyService);

router.post('/play-track', (req, res) => spotifyController.playTrack(req, res));

export default router;
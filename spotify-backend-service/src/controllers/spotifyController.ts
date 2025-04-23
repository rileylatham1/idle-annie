export class SpotifyController {
  constructor(private spotifyService: any) {}

  async playTrack(req: any, res: any) {
    const { albumContextUri, trackContextUri, token } = req.body;

    try {
      await this.spotifyService.playTrack(albumContextUri, trackContextUri, token);
      res.status(200).send({ message: 'Playback started successfully' });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  }
}
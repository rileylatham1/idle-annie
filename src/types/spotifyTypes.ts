export type TrackInfo = {
    track: {
      id: string
      name: string
      artist: string
      uri: string
      album: {
        images: { url: string }[]
        uri: string
        id: string
        name: string
      }
    }
  }
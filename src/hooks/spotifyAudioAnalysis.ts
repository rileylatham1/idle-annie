import { useState, useEffect } from 'react'
import { TrackInfo } from '../types/spotifyTypes'

type AudioAnalysis = {
  energy: number
  valence: number
  tempo: number
  danceability: number
  beats: number[]
  mfccs: number[]
}

export function useAudioAnalysis(track: TrackInfo | null, accessToken: string | null) {
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!track || !accessToken) {
      setAnalysis(null)
      return
    }
    setLoading(true)
    setError(null)
    fetch('http://localhost:8000/audio-analysis', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ track_id: track.id, access_token: accessToken }),
    })
      .then(res => res.json())
      .then(data => {
        console.log('Audio analysis response:', data)
        if (data.success) {
          setAnalysis({
            energy: data.energy,
            valence: data.valence,
            tempo: data.tempo,
            danceability: data.danceability,
            beats: data.beats,
            mfccs: data.mfccs,
          })
        } else {
          console.warn('No audio analysis available:', data.error)
          setAnalysis(null)
          setError('No analysis available for this track.')
        }
      })
  setLoading(false);
  }, [track, accessToken])
  console.log('Audio analysis:', analysis)
  return { analysis, loading, error }
}
const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET
const redirectUri = 'http://127.0.0.1:5173/callback'

const scopes = [
  'user-read-playback-state',
  'user-read-currently-playing',
  'user-read-private',
  'user-read-email',
  'user-library-read',
  'user-modify-playback-state',
]

type SpotifyTokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope: string
}

// Redirect to Spotify login
export function redirectToSpotifyAuth(): void {
  const authUrl = new URL('https://accounts.spotify.com/authorize')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', scopes.join(' '))
  authUrl.searchParams.set('show_dialog', 'true')

  window.location.href = authUrl.toString()
}

// Store tokens in localStorage
export function storeTokens(tokens: SpotifyTokenResponse): void {
  localStorage.setItem('access_token', tokens.access_token)
  localStorage.setItem('expires_at', (Date.now() + tokens.expires_in).toString())
  if (tokens.refresh_token) {
    localStorage.setItem('refresh_token', tokens.refresh_token)
  }
}

// Retrieve access token from localStorage
export function getAccessToken(): string | null {
  const token = localStorage.getItem('access_token')
  const expiresAt = localStorage.getItem('expires_at')

  if (token && expiresAt && Date.now() < parseInt(expiresAt)) {
    return token
  }

  return null
}

// Retrieve refresh token from localStorage
export function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token')
}

// Exchange authorization code for access token
export async function exchangeCodeForToken(code: string): Promise<string> {
  const basicAuth = btoa(`${clientId}:${clientSecret}`)

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to exchange code for access token')
  }

  const tokens: SpotifyTokenResponse = await response.json()
  storeTokens(tokens)
  return tokens.access_token
}

// Refresh access token using refresh token
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const basicAuth = btoa(`${clientId}:${clientSecret}`)

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh access token')
  }

  const tokens: SpotifyTokenResponse = await response.json()
  storeTokens({ ...tokens, refresh_token: refreshToken }) // preserve the old refresh token
  return tokens.access_token
}

# 🎵 Spotify Explorer (gRPC + React + FastAPI)

This is a Three.js-powered web app that connects to your Spotify account and lets you explore and play your liked songs in an interactive grid. Built with:

- ⚙️ **Python gRPC backend for Spotify API access**  
- 🌐 **FastAPI proxy server**  
- 🎨 **React + Three.js frontend**  
- 🔐 **Auth via Spotify Authorization Code Flow**

---

## 🧱 Features

- **Browse liked songs with album art in a 3D tile grid**
- **Click to play songs directly from your Spotify library**
- **Next track playback using gRPC**
- **Clean service separation and modular architecture**

---

## 🚀 Getting Started

### Clone the Repository and Generate the Proto Files

> 🖥️ Terminal
> 
> ```bash
> git clone https://github.com/rileylatham1/idle-annie.git
> cd cd idle-annie
> ./generate_proto.sh
>```

✅ This generates the Python gRPC code from \`.proto\` definitions. Make sure \`grpcio-tools\` is installed.

---

## 📦 Requirements

- Spotify Developer App
  → [Create one here](https://developer.spotify.com/dashboard)
- Python 3.10+
- Node.js + Yarn
- *Optional*
  → [UV](https://docs.astral.sh/uv/) (for running 🖥️ dev.sh)
---

## 🧰 Running the App

There are 3 main services:

1. **gRPC Server**  
2. **FastAPI Proxy Server**  
3. **Frontend App (React + Three.js)**  

You can either start them manually in 3 terminals, or run them all with:

> 🖥️ Terminal
> 
> ```bash
> !#idle-annie
> ./dev.sh
> ```
---

:bug: If this doesn't work you may need to give it executable access! Check out what's inside before granting any file this privelege.

> 🖥️ Terminal
> 
> ```bash
> !#idle-annie
> chmod +x dev.sh
> ```


### ✅ Manual Start (Alternative)

#### First Time?

Generate protos the first time you run the app and every time you update!

> 🖥️ Terminal
> 
> ```bash
> !#idle-annie
> ./generate_protos.sh
> ```

#### Terminal 1: gRPC Server
> 🖥️ Terminal
> 
> ```bash
> !#idle-annie/spotify-backend-service
> source .venv/bin/activate
> python main.py
> ```

#### Terminal 2: Proxy API Server
> 🖥️ Terminal
> 
> ```bash
> !#idle-annie/spotify-backend-service
> source .venv/bin/activate
> uvicorn proxy:app --reload
> ```

#### Terminal 3: Frontend
> 🖥️ Terminal
> 
> ```bash
> !#idle-annie
> yarn install
> yarn dev
> ```

:bug: Open up spotify before selecting any songs!
🌎 Visit: [http://localhost:5173](http://localhost:5173)

---

## ⚙️ Environment Setup

Create a \`.env\` file inside the \`proxy/\` directory:

> ⚙️ .env file
> ```bash
> !#idle-annie
> echo "VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id" > .env
> echo "VITE_SPOTIFY_CLIENT_ID=your_spotify_client_secret" >> .env
> echo "SPOTIFY_REDIRECT_URI=http://localhost:5173/callback" >> .env
>```

You'll also need to add your spotify redirect uri to the list of redirect apis on your spotify developer dashboard!

---

## 🧪 Testing

- Frontend test: click tiles to play songs  
- Server logs: backend/server.py and proxy/main.py will show auth/playback flow  

---

## ✨ Roadmap

- [x] Liked songs explorer  
- [x] Playback with gRPC  
- [ ] Playlist browsing  
- [ ] Dockerized deployment  
- [ ] CI with GitHub Actions  

---

## 📜 License

MIT © Riley Latham, lathamri@msu.edu

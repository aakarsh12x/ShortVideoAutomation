# ShortVideoAutomation (Beta) 🎬

A powerful Node.js application that automatically generates short videos from trending Reddit topics using AI-generated scripts, text-to-speech, and image APIs. Built with React frontend and Node.js backend.

## ✨ Features

- **🎯 Reddit Integration**: Fetches trending topics from Reddit API
- **🤖 AI Script Generation**: Creates engaging video scripts using AI
- **🎙️ Text-to-Speech**: Converts scripts to audio using Windows Speech Synthesis
- **🖼️ Multi-Source Images**: Collects images from Pixabay, Pexels, Unsplash APIs
- **🎬 Video Assembly**: Creates slideshow videos with FFmpeg
- **📱 React Frontend**: Modern, responsive web interface
- **📊 Real-time Progress**: Track video generation progress
- **🔒 Environment Security**: Secure API key management
- **📁 File Management**: Organized output and temporary file handling

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **FFmpeg** installed and accessible in PATH
- **Windows OS** (for TTS functionality)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aakarsh12x/ShortVideoAutomation.git
   cd ShortVideoAutomation
   git checkout beta
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the React frontend**
   ```bash
   npm run build
   ```

4. **Set up environment variables**
   
   Create `api-keys.env` file in the root directory:
   ```env
   # Reddit API (Required)
   REDDIT_CLIENT_ID=your_reddit_client_id
   REDDIT_CLIENT_SECRET=your_reddit_client_secret
   REDDIT_USERNAME=your_reddit_username
   REDDIT_PASSWORD=your_reddit_password

   # Image APIs (Required for image collection)
   PIXABAY_API_KEY=your_pixabay_api_key
   PEXELS_API_KEY=your_pexels_api_key
   UNSPLASH_API_KEY=your_unsplash_api_key
   ```

5. **Install FFmpeg**
   
   Download from [FFmpeg official site](https://ffmpeg.org/download.html) or use:
   ```bash
   # Windows (using Chocolatey)
   choco install ffmpeg
   
   # Or manually add to PATH:
   # C:\ffmpeg\ffmpeg-master-latest-win64-gpl\bin
   ```

## 🎯 Usage

### Starting the Backend

**Option 1: Using the provided batch file**
```bash
start.bat
```

**Option 2: Manual PowerShell command**
```powershell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\path\to\ShortVideoAutomation'; $env:PATH += ';C:\ffmpeg\ffmpeg-master-latest-win64-gpl\bin'; node real-api-backend.js"
```

**Option 3: Direct execution (ensure FFmpeg is in PATH)**
```bash
node real-api-backend.js
```

The server will start on `http://localhost:3000`

### Using the Frontend

1. Open your browser and navigate to `http://localhost:3000`
2. Browse trending Reddit topics
3. Click on a topic to select it
4. Click "Generate Video" to start the process
5. Monitor progress in real-time
6. Download the generated video when complete

## 🔌 API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Serve React frontend |
| `GET` | `/api` | API information |
| `GET` | `/api/health` | Health check and API key status |
| `GET` | `/api/reddit/topics` | Fetch trending Reddit topics |
| `POST` | `/api/generate` | Start video generation |
| `GET` | `/api/status/:jobId` | Check generation progress |
| `GET` | `/api/videos` | List generated videos |
| `GET` | `/output/:filename` | Download generated video |
| `GET` | `/videos/:filename` | Alternative download endpoint |

### Video Generation Request

```json
POST /api/generate
{
  "topic": "selected_topic",
  "includeCaptions": true,
  "videoDuration": 30
}
```

### Response Format

```json
{
  "success": true,
  "jobId": "unique_job_id",
  "message": "Video generation started",
  "estimatedTime": "2-3 minutes"
}
```

## 🏗️ Project Structure

```
ShortVideoAutomation/
├── src/                    # React source code
│   ├── components/        # React components
│   ├── services/          # API services
│   └── App.js            # Main application
├── public/                # Static assets
├── build/                 # Built React app
├── output/                # Generated videos
├── temp/                  # Temporary files
├── real-api-backend.js    # Main backend server
├── start.bat             # Windows startup script
├── package.json          # Dependencies and scripts
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## 🛠️ Development

### Available Scripts

```bash
# Install dependencies
npm install

# Start development server (React)
npm start

# Build for production
npm run build

# Start backend server
npm run start:backend

# Run tests
npm test

# Eject from Create React App
npm run eject
```

### Backend Development

The main backend file is `real-api-backend.js`. Key functions:

- `generateScript(topic)`: AI script generation
- `generateTTS(text)`: Text-to-speech conversion
- `collectImages(topic, count)`: Image collection from APIs
- `assembleVideo(script, images, audio, topic, includeCaptions)`: Video assembly

### Frontend Development

The React app is in the `src/` directory. Key components:

- `TrendingTopics`: Displays and handles topic selection
- `VideoGenerator`: Initiates video generation
- `ProgressTracker`: Shows generation progress
- `VideoPlayer`: Plays generated videos

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REDDIT_CLIENT_ID` | Reddit API client ID | ✅ |
| `REDDIT_CLIENT_SECRET` | Reddit API client secret | ✅ |
| `REDDIT_USERNAME` | Reddit username | ✅ |
| `REDDIT_PASSWORD` | Reddit password | ✅ |
| `PIXABAY_API_KEY` | Pixabay API key | ✅ |
| `PEXELS_API_KEY` | Pexels API key | ✅ |
| `UNSPLASH_API_KEY` | Unsplash API key | ✅ |

### Server Configuration

The server runs on port 3000 by default. To change:

```javascript
// In real-api-backend.js
const PORT = process.env.PORT || 3000;
```

## 🐛 Troubleshooting

### Common Issues

1. **FFmpeg not found**
   - Ensure FFmpeg is installed and in PATH
   - Use the provided `start.bat` script

2. **API keys not loading**
   - Check `api-keys.env` file exists
   - Verify no spaces around `=` in environment variables
   - Restart the server after changes

3. **Video generation fails**
   - Check console logs for detailed error messages
   - Verify all API keys are valid
   - Ensure sufficient disk space in output directory

4. **Images not downloading**
   - Verify image API keys are valid
   - Check internet connectivity
   - Review API rate limits

### Debug Mode

Enable detailed logging by setting:

```javascript
// In real-api-backend.js
const DEBUG = true;
```

## 📝 Logs

The application provides comprehensive logging:

- **🎯 Topic Selection**: Reddit API calls and topic processing
- **🤖 Script Generation**: AI script creation progress
- **🎙️ TTS Generation**: Audio creation and duration
- **🖼️ Image Collection**: API calls and download status
- **🎬 Video Assembly**: FFmpeg process and output
- **📊 Progress Tracking**: Real-time status updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Reddit API** for trending topics
- **Pixabay, Pexels, Unsplash** for image APIs
- **FFmpeg** for video processing
- **React** for the frontend framework
- **Node.js** for the backend runtime

## 📞 Support

For issues and questions:

1. Check the [Issues](https://github.com/aakarsh12x/ShortVideoAutomation/issues) page
2. Review the troubleshooting section above
3. Create a new issue with detailed error information

---

**Note**: This is a beta version. Some features may be experimental or subject to change.

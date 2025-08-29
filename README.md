# ShortVideoAutomation (Beta)

This is the beta of the ReelAutomationJS project.

- Backend: Node HTTP server with real TTS (Windows Speech), image APIs (Pixabay/Pexels/Unsplash), FFmpeg slideshow, captions, downloads
- Frontend: React app in build/

Run backend:
`
powershell -NoExit -Command "C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.8\bin;C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.8\libnvvp;C:\Program Files\Amazon Corretto\jdk21.0.6_7\bin;C:\Windows\system32;C:\Windows;C:\Windows\System32\Wbem;C:\Windows\System32\WindowsPowerShell\v1.0\;C:\Windows\System32\OpenSSH\;C:\Program Files (x86)\NVIDIA Corporation\PhysX\Common;C:\Softwares\mysql-8.0.33\mysql-8.0.33-winx64\bin;C:\Program Files\Git\cmd;C:\Program Files\Maven\apache-maven-3.9.3-bin\apache-maven-3.9.3\bin;C:\Program Files\Amazon Corretto\jdk21.0.6_7\bin;C:\Program Files\MongoDB\Server\7.0\bin;C:\MinGW\bin;;C:\Program Files\NVIDIA Corporation\NVIDIA app\NvDLISR;C:\WINDOWS\system32;C:\WINDOWS;C:\WINDOWS\System32\Wbem;C:\WINDOWS\System32\WindowsPowerShell\v1.0\;C:\WINDOWS\System32\OpenSSH\;C:\Program Files\nodejs\;C:\Program Files\NVIDIA Corporation\Nsight Compute 2025.1.1\;C:\Program Files\Amazon\AWSCLIV2\;C:\Program Files\Amazon\AWSSAMCLI\bin\;C:\Program Files\Docker\Docker\resources\bin;C:\Program Files\Void\bin;C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.8\bin;C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.8\libnvvp;C:\Program Files\Amazon Corretto\jdk21.0.6_7\bin;C:\Windows\system32;C:\Windows;C:\Windows\System32\Wbem;C:\Windows\System32\WindowsPowerShell\v1.0\;C:\Windows\System32\OpenSSH\;C:\Program Files (x86)\NVIDIA Corporation\PhysX\Common;C:\Softwares\mysql-8.0.33\mysql-8.0.33-winx64\bin;C:\Program Files\Git\cmd;C:\Program Files\Maven\apache-maven-3.9.3-bin\apache-maven-3.9.3\bin;C:\Program Files\Amazon Corretto\jdk21.0.6_7\bin;C:\Program Files\MongoDB\Server\7.0\bin;C:\MinGW\bin;;C:\Program Files\NVIDIA Corporation\NVIDIA app\NvDLISR;C:\WINDOWS\system32;C:\WINDOWS;C:\WINDOWS\System32\Wbem;C:\WINDOWS\System32\WindowsPowerShell\v1.0\;C:\WINDOWS\System32\OpenSSH\;C:\Program Files\nodejs\;C:\Program Files\NVIDIA Corporation\Nsight Compute 2025.1.1\;C:\Program Files\Amazon\AWSCLIV2\;C:\Program Files\Amazon\AWSSAMCLI\bin\;C:\Program Files\Docker\Docker\resources\bin;C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.8\bin;C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.8\libnvvp;C:\Program Files\Amazon Corretto\jdk21.0.6_7\bin;C:\Windows\system32;C:\Windows;C:\Windows\System32\Wbem;C:\Windows\System32\WindowsPowerShell\v1.0\;C:\Windows\System32\OpenSSH\;C:\Program Files (x86)\NVIDIA Corporation\PhysX\Common;C:\Softwares\mysql-8.0.33\mysql-8.0.33-winx64\bin;C:\Program Files\Git\cmd;C:\Program Files\Maven\apache-maven-3.9.3-bin\apache-maven-3.9.3\bin;C:\Program Files\Amazon Corretto\jdk21.0.6_7\bin;C:\Program Files\MongoDB\Server\7.0\bin;C:\MinGW\bin;;C:\Program Files\NVIDIA Corporation\NVIDIA app\NvDLISR;C:\WINDOWS\system32;C:\WINDOWS;C:\WINDOWS\System32\Wbem;C:\WINDOWS\System32\WindowsPowerShell\v1.0\;C:\WINDOWS\System32\OpenSSH\;C:\Program Files\nodejs\;C:\Program Files\NVIDIA Corporation\Nsight Compute 2025.1.1\;C:\Program Files\Amazon\AWSCLIV2\;C:\Program Files\Amazon\AWSSAMCLI\bin\;C:\Program Files\Docker\Docker\resources\bin;C:\Users\aakar\AppData\Local\Android\Sdk\platform-tools;C:\Users\aakar\AppData\Local\Programs\Microsoft VS Code\bin;C:\Users\aakar\AppData\Local\Programs\cursor\resources\app\bin;C:\flutter\bin;C:\flutter\bin;C:\Users\aakar\AppData\Local\Programs\Windsurf\bin;C:\ffmpeg\ffmpeg-master-latest-win64-gpl\bin;C:\ffmpeg\ffmpeg-master-latest-win64-gpl\bin;C:\ffmpeg\ffmpeg-master-latest-win64-gpl\bin;C:\ffmpeg\ffmpeg-master-latest-win64-gpl\bin;C:\ffmpeg\ffmpeg-master-latest-win64-gpl\bin;C:\ffmpeg\ffmpeg-master-latest-win64-gpl\bin;C:\ffmpeg\ffmpeg-master-latest-win64-gpl\bin += ';C:\\ffmpeg\\ffmpeg-master-latest-win64-gpl\\bin'; node real-api-backend.js"
`

Env:
- Put keys in pi-keys.env (already supported) or .env.

API:
- GET /api
- GET /api/health
- GET /api/reddit/topics
- POST /api/generate
- GET /api/status/:jobId
- GET /api/videos
- GET /output/:filename or /videos/:filename

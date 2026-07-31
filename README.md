# 🤖 AI Interviewer

An AI-powered technical interview platform built using the **MERN Stack**, **FastAPI**, **Whisper**, and **Ollama**. The application generates role-specific interview questions, conducts AI-assisted interviews, evaluates candidate responses, and provides intelligent feedback.

The project follows a **microservices architecture** and is fully **Dockerized** using Docker Compose for easy setup and deployment.

---

# 🚀 Features

* AI-generated interview questions
* Coding + Oral interview modes
* AI evaluation and feedback
* Speech-to-text using Whisper
* Local LLM inference using Ollama
* Google OAuth authentication
* JWT-based authentication
* Real-time communication using Socket.IO
* MongoDB Atlas integration
* Fully Dockerized architecture
* Production-ready frontend served through Nginx

---

# 🛠 Tech Stack

## Frontend

* React 19
* Vite
* Redux Toolkit
* React Router
* Tailwind CSS
* Axios
* Socket.IO Client
* Google OAuth

## Backend

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose
* JWT
* Socket.IO
* Multer

## AI Microservice

* FastAPI
* Python
* Ollama
* Whisper
* Pydub
* FFmpeg

## DevOps

* Docker
* Docker Compose
* Nginx

---

# 🏗 Architecture

```
                   Browser
                       │
                       ▼
                 Nginx (Frontend)
                       │
                       ▼
               React Production Build
                       │
                       ▼
               Express Backend API
                  │            │
                  │            ▼
                  │      MongoDB Atlas
                  │
                  ▼
          FastAPI AI Service
                  │
                  ▼
               Ollama LLM
          (qwen2.5:3b Model)
                  │
                  ▼
         Whisper Speech Model
```

---

# 📂 Project Structure

```
AI-Interviewer
│
├── frontend
│   ├── Dockerfile
│   ├── nginx.conf
│   └── ...
│
├── backend
│   ├── Dockerfile
│   └── ...
│
├── ai-service
│   ├── Dockerfile
│   ├── requirements.txt
│   └── ...
│
├── docker-compose.yml
├── .env.example
├── README.md
└── .gitignore
```

---

# ⚙️ Prerequisites

Install the following before running the project:

* Docker Desktop
* Git

No need to install:

* Node.js
* Python
* Ollama
* FFmpeg

Docker handles everything.

---

# 📦 Running the Project (Docker)

## 1. Clone the repository

```bash
git clone https://github.com/Saksham0070/ai-interviewer.git

cd ai-interviewer
```

---

## 2. Create a root `.env`

Example:

```env
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
```

---

## 3. Start the application

```bash
docker compose up --build
```

Docker automatically:

* Builds all services
* Starts React
* Starts Express
* Starts FastAPI
* Downloads the Ollama model (first run only)
* Starts Ollama
* Creates Docker networking

---

## 4. Open the application

Frontend

```
http://localhost
```

Backend

```
http://localhost:5000
```

FastAPI

```
http://localhost:8000
```

Swagger UI

```
http://localhost:8000/docs
```

Ollama

```
http://localhost:11434
```

---

# 🖥 Running Without Docker

### Frontend

```bash
cd frontend

npm install

npm run dev
```

---

### Backend

```bash
cd backend

npm install

npm start
```

---

### AI Service

Create a virtual environment.

Install dependencies.

```bash
pip install -r requirements.txt
```

Start FastAPI.

```bash
python main.py
```

Run Ollama locally.

```bash
ollama serve
```

---

# 🔑 Environment Variables

## Frontend

```
VITE_API_URL

VITE_GOOGLE_CLIENT_ID
```

---

## Backend

```
MONGO_URI

PORT

JWT_SECRET

GOOGLE_CLIENT_ID

AI_SERVICE_URL
```

---

## AI Service

```
AI_SERVICE_PORT

OLLAMA_MODEL_NAME
```

---

# 📡 API Endpoints

## Backend

```
POST /api/users

POST /api/sessions
```

---

## AI Service

```
GET /

POST /generate-questions

POST /transcribe

POST /evaluate
```

---

# 🐳 Docker Services

The application consists of five containers.

| Service     | Purpose                                       |
| ----------- | --------------------------------------------- |
| frontend    | React application served by Nginx             |
| backend     | Express REST API                              |
| ai-service  | FastAPI AI microservice                       |
| ollama      | Local LLM server                              |
| ollama-init | Downloads the required model on first startup |

---

# 📈 Future Improvements

* Kubernetes deployment
* CI/CD using GitHub Actions
* HTTPS support
* Redis caching
* Role-based dashboards
* Multiple LLM model selection
* Resume analysis
* Interview history analytics

---

# 📷 Screenshots

Add screenshots of:

* Login Page
* Dashboard
* Interview Screen
* Coding Round
* AI Evaluation
* Analytics Dashboard

---

# 👨‍💻 Author

**Saksham Sagar**

Software Engineer

GitHub: https://github.com/Saksham0070

LinkedIn: *(Add your LinkedIn profile here.)*

---

# ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub.

Contributions, issues, and feature requests are welcome.

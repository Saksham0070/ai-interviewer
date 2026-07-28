# 🤖 AI Interviewer

An AI-powered technical interview platform built using the **MERN stack** with a dedicated **FastAPI AI microservice**.

The platform simulates real technical interviews by generating customized interview questions, accepting candidate responses through text, code, and voice, and providing AI-based evaluation with feedback.

---

## 🚀 Features

### 👨‍💻 AI Generated Interviews
- Generate customized interview questions based on:
  - Job role
  - Experience level
  - Interview type
  - Number of questions

- Supports:
  - Conceptual questions
  - Coding challenges
  - Mixed interviews

---

### 🧠 AI Interview Evaluation

The AI evaluates candidate responses based on:

- Technical correctness
- Confidence level
- Explanation quality
- Coding approach
- Overall performance

Provides:
- Technical score
- Confidence score
- AI-generated feedback
- Ideal answers

---

### 🎤 Voice Based Interview

Candidates can answer questions using voice.

Features:
- Audio recording
- Speech-to-text conversion
- Whisper AI transcription
- Automatic evaluation of responses

---

### 💻 Coding Interview Support

Includes:

- Code editor integration using Monaco Editor
- Coding challenge evaluation
- AI feedback on submitted solutions

---

### 🔐 Authentication

Supports:

- User registration and login
- JWT-based authentication
- Google OAuth authentication

---

### ⚡ Real-Time Communication

Implemented using:

- Socket.IO
- Real-time interview updates
- Live session communication

---

# 🏗️ System Architecture


```

```
                React Frontend
                     |
                     |
                     v

              Node.js Backend
                     |
      --------------------------------
      |                              |
      v                              v

  MongoDB                    FastAPI AI Service
                                     |
                       -----------------------------
                       |                           |
                       v                           v

                   Ollama LLM              Whisper AI Model
```

```

---

# 🛠️ Tech Stack

## Frontend

- React.js
- Vite
- Tailwind CSS
- Redux Toolkit
- React Router
- Axios
- Socket.IO Client
- Monaco Editor


## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Google OAuth
- Socket.IO
- Multer


## AI Service

- Python
- FastAPI
- Ollama
- Whisper Speech Recognition
- Pydantic
- FFmpeg
- PyDub


## Database

- MongoDB


---

# 📂 Project Structure

```

AI-Interviewer

│
├── frontend
│   ├── src
│   ├── package.json
│   └── vite.config.js
│
│
├── backend
│   ├── controllers
│   ├── models
│   ├── routes
│   ├── middleware
│   ├── server.js
│   └── package.json
│
│
└── ai-service
├── main.py
├── requirements.txt
└── .env

````

---

# ⚙️ Installation & Setup

## 1. Clone Repository

```bash
git clone https://github.com/Saksham0070/ai-interviewer.git

cd ai-interviewer
````

---

# Frontend Setup

Navigate to frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create `.env` file:

```
VITE_BACKEND_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

Run frontend:

```bash
npm run dev
```

Frontend will run on:

```
http://localhost:5173
```

---

# Backend Setup

Navigate:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create `.env` file:

Example:

```
PORT=5000

MONGO_URI=<your_mongodb_connection_string>

JWT_SECRET=<your_secret>

GOOGLE_CLIENT_ID=<your_google_client_id>

AI_SERVICE_URL=http://localhost:8000
```

Start backend:

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Backend runs on:

```
http://localhost:5000
```

---

# AI Service Setup

Navigate:

```bash
cd ai-service
```

Create Python environment:

```bash
python -m venv venv
```

Activate environment:

Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create `.env`

Example:

```
AI_SERVICE_PORT=8000

OLLAMA_MODEL_NAME=qwen2.5:3b
```

Start FastAPI server:

```bash
uvicorn main:app --reload
```

AI Service runs on:

```
http://localhost:8000
```

---

# 🤖 AI Model Setup

This project uses Ollama for local LLM inference.

Install Ollama:

[https://ollama.com/](https://ollama.com/)

Pull required model:

```bash
ollama pull qwen2.5:3b
```

Verify:

```bash
ollama list
```

---

# 🔌 API Endpoints

## Generate Interview Questions

```
POST /generate-questions
```

Generates AI-based interview questions.

---

## Speech Transcription

```
POST /transcribe
```

Converts candidate audio responses into text using Whisper.

---

## Evaluate Answer

```
POST /evaluate
```

Evaluates candidate answers and returns:

```json
{
 "technicalScore":90,
 "confidenceScore":85,
 "aiFeedback":"...",
 "idealAnswer":"..."
}
```

---

# 🔒 Environment Variables

The following files should never be committed:

```
.env
node_modules/
venv/
```

Example environment files:

```
.env.example
```

should be used for sharing required variables.

---

# 📌 Future Improvements

* [ ] Docker containerization
* [ ] Cloud deployment
* [ ] Resume based interview generation
* [ ] Advanced AI voice interaction
* [ ] Interview analytics dashboard
* [ ] Candidate ranking system

---

# 👨‍💻 Author

**Saksham Sagar**

Software Developer

GitHub:
[https://github.com/Saksham0070](https://github.com/Saksham0070)

---

# ⭐ If you like this project

Give it a star ⭐ and feel free to contribute!




# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1OGopsHEczLZ_B_H2mN6fAxV-XAIjx72L

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
# URL Risk Analyzer (URL Checker)

An explainable, risk-based URL analysis tool that helps users understand why a URL might be unsafe before clicking it.

Instead of giving a simple Safe / Unsafe result, this application evaluates a URL using multiple heuristic and structural signals, generates a risk score (0–100), and provides human-readable explanations to improve user awareness and decision-making.

---

## Features

✅ URL validation & sanitization

🛡️ Basic SSRF protection on backend

📊 Risk score generation (0–100)

🧠 Explainable analysis (why the URL is risky)

⚡ Fast, modern UI built with React + Vite

🔐 Backend logic separated for security & scalability

---

## How It Works

1. User enters a URL in the frontend

2. URL is validated and sanitized

3. Backend analyzes:

  - URL structure

  - Suspicious patterns

  - Protocol and domain indicators

4. A risk score is calculated

5. The system returns:

  - Risk score

  - Risk level (Low / Medium / High)

  - Clear explanation of detected issues

---

## Tech Stack

Frontend

  - React (TypeScript)

  - Vite

  - CSS

Backend

  - Node.js

  - Express.js

  - Custom URL analysis logic

---

## Project Structure

url-checker/
├── components/        # React UI components
├── services/          # API & helper services
├── api.js             # API logic
├── backend.js         # Backend server & security checks
├── App.tsx            # Main React app
├── index.tsx          # Entry point
├── ui.js              # UI helpers
├── types.ts           # Type definitions
├── style.css          # Styling
├── index.html         # HTML template
├── vite.config.ts     # Vite configuration
├── tsconfig.json      # TypeScript configuration
├── package.json       # Dependencies & scripts
└── README.md          # Project documentation

---

## Running the Project Locally

Prerequisites

  - Node.js (v18 or higher recommended)

  - npm

Steps
# Install dependencies
npm install

# Start the development server
npm run dev


The app will be available at:

http://localhost:5173

---

## Security Considerations

Prevents basic SSRF attacks

Rejects invalid or malformed URLs

Avoids direct requests to internal/private IP ranges

Designed to be extended with more advanced threat intelligence

---

## Use Cases

Checking suspicious links before clicking

Educational tool for learning URL-based security risks

Foundation for phishing detection systems

Cybersecurity mini-project or hackathon demo

---

## Future Improvements

🌐 Domain reputation lookup

🧪 Machine learning–based risk scoring

🧩 Browser extension integration

📈 Analytics dashboard

🔑 Authentication & rate limiting

---

## Contributing

Contributions are welcome!

Fork the repository

Create a new branch

Commit your changes

Open a Pull Request

---

## License

This project is licensed under the MIT License.

---

## Acknowledgements

Built as a beginner-friendly, security-focused project to promote safer browsing and explainable risk analysis.

---

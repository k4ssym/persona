
# Virtual Receptionist

A modern AI-powered virtual receptionist with real-time voice conversation capabilities, 3D avatar visualization, and a comprehensive admin dashboard.

## Overview
Virtual Receptionist is a production-ready AI assistant designed to greet visitors, answer questions, and provide navigation assistance within an organization. It features:

- Real-time voice conversations powered by Vapi.ai
- 3D animated avatar using Ready Player Me
- Automatic face detection for hands-free activation
- Conversation logging with analytics
- Admin dashboard for monitoring and configuration
- Persistent data storage with Supabase

## Features

### Voice AI
- **Speech-to-Text**: Deepgram Nova-2 with Russian language support
- **Large Language Model**: OpenAI GPT-4o-mini for intelligent responses
- **Text-to-Speech**: ElevenLabs multilingual v2 for natural voice output
- **Low latency**: Real-time conversation with minimal delay

### 3D Avatar
- Ready Player Me integration for customizable avatars
- Lip sync animation synchronized with speech
- Eye blinking and subtle idle animations
- Responsive design for all screen sizes

### Face Detection
- Webcam-based presence detection
- Auto-start conversations when a visitor approaches
- Privacy-focused: Processing done locally in browser

### Admin Dashboard -- uses hotkey CTRL + SHIFT + A
- **Analytics & Reporting**: Charts for conversation trends (daily/weekly/monthly), resolution rates, latency, and costs.
- **Conversation Logs**: Full history with search, filtering (Resolved/Unresolved), and CSV export.
- **System Settings**: Real-time configuration of sensitivity, prompt behavior, voice settings, and language.
- **Security**: Password-protected access (or Supabase Auth).

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Database** | Supabase (PostgreSQL) |
| **3D Rendering** | React Three Fiber, Three.js |
| **Voice AI** | Vapi.ai |
| **Avatar** | Ready Player Me |
| **STT** | Deepgram |
| **TTS** | ElevenLabs |
| **LLM** | OpenAI GPT-4o-mini |

## Prerequisites
- Node.js 18+
- npm or yarn
- Vapi.ai account (free tier available)
- Supabase account (free tier available)
- Ready Player Me avatar (free)

## Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/virtual-receptionist.git
cd virtual-receptionist
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_VAPI_KEY=your-vapi-public-key
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your-assistant-id
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_AVATAR_URL=https://models.readyplayer.me/your-avatar-id.glb
NEXT_PUBLIC_ADMIN_PASSWORD=your-secure-password
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-for-webhooks
```

> **Note**: If you require a ready-to-go `.env` file for testing or evaluation, please contact me via Telegram: **@k4ssym**

### 4. Database Setup
1. Create a new Supabase project.
2. Run the SQL schema provided in `supabase_schema.sql` in your Supabase SQL Editor to create the necessary tables (`conversations`, `messages`).

### 5. Run the development server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

## Project Structure
```
virtual-receptionist/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main receptionist interface
│   │   ├── admin/
│   │   │   └── page.tsx      # Admin dashboard
│   │   ├── api/
│   │   │   └── webhook/      # Vapi webhook handler
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   └── Avatar3D.tsx      # 3D avatar component
│   ├── hooks/
│   │   └── useFaceDetection.ts  # Webcam face detection
│   └── lib/
│       ├── logger.ts         # Supabase logging logic
│       └── supabase.ts       # Supabase client initialization
├── public/                   # Static assets
├── .env.local                # Environment variables
├── next.config.ts            # Next.js configuration
├── package.json
└── README.md
```

## Configuration

### Customizing the AI Prompt
Edit the system prompt in `src/app/page.tsx` or use the **Admin Dashboard** > **Settings** tab to update the prompt dynamically without redeploying.

### Webhook Setup (Optional for Analytics)
To receive accurate cost and latency data from Vapi:
1. Deploy the app or use `ngrok` to expose localhost.
2. Add your webhook URL (`https://your-domain.com/api/webhook`) to the Vapi Assistant settings.

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub.
2. Import project on `vercel.com`.
3. Add environment variables in Settings.
4. Deploy.

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Security
- Admin dashboard is password-protected.
- API keys are stored in environment variables.
- Face detection is processed locally (no video sent to servers).
- Database access is secured via Supabase RLS policies (optional).

## Admin Dashboard
Access the admin panel at `/admin`

**Default password**: `admin2024` (or as set in `NEXT_PUBLIC_ADMIN_PASSWORD`)

**Features:**
- View real-time conversation statistics.
- Filter conversations by status (Resolved/Unresolved).
- Search logs by ID, content, or date.
- Export conversation history to CSV.
- Update AI assistant prompt and settings.

## License
MIT License - see LICENSE for details.

## Contact
For inquiries, support, or ready-to-use configuration files, please contact via Telegram: **@k4ssym**

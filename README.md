# Nivaran - Smart Civic Issue Reporting App

A comprehensive civic issue reporting platform built with React Native (Expo), Node.js backend, and AI-powered image verification.

## 🚀 Features

- **Mobile App**: React Native with Expo for cross-platform compatibility
- **AI Verification**: Automatic issue detection and verification using YOLO models
- **Real-time Backend**: Node.js/Express API with Supabase integration
- **Interactive Maps**: Location-based issue reporting and visualization
- **User Authentication**: Secure signup/login with Supabase Auth
- **Rewards System**: Gamification to encourage community participation

## 📁 Project Structure

```
├── CivicReportApp/          # React Native/Expo frontend
├── backend/                 # Node.js/Express API server
├── ai-service/             # Python FastAPI AI verification service
└── README.md               # This file
```

## 🛠️ Tech Stack

### Frontend (CivicReportApp)
- React Native with Expo
- TypeScript
- React Navigation
- Supabase Client
- Expo Location, Camera, Image Picker
- Leaflet Maps

### Backend
- Node.js with Express
- Supabase (PostgreSQL)
- JWT Authentication
- Multer for file uploads
- CORS and security middleware

### AI Service
- Python with FastAPI
- YOLOv8 (Ultralytics)
- PyTorch
- PIL for image processing

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Python 3.8+
- Expo CLI: `npm install -g @expo/cli`
- Supabase account

### 1. Clone the Repository

```bash
git clone https://github.com/satvik-svg/NivaranMobile.git
cd NivaranMobile
```

### 2. Set Up Environment Variables

Copy the example environment files and fill in your credentials:

```bash
# Frontend
cp CivicReportApp/.env.example CivicReportApp/.env

# Backend
cp backend/.env.example backend/.env

# AI Service
cp ai-service/.env.example ai-service/.env
```

### 3. Install Dependencies

```bash
# Frontend
cd CivicReportApp
npm install --legacy-peer-deps

# Backend
cd ../backend
npm install

# AI Service
cd ../ai-service
pip install -r requirements.txt
```

### 4. Start the Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - AI Service:**
```bash
cd ai-service
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Terminal 3 - Frontend:**
```bash
cd CivicReportApp
npx expo start
```

### 5. Configure for Mobile Testing

For mobile testing, update the API URLs in your `.env` files to use your computer's IP address instead of `localhost`:

```bash
# Find your IP address
ifconfig | grep "inet " | grep -v 127.0.0.1

# Update CivicReportApp/.env
EXPO_PUBLIC_API_URL=http://YOUR_IP:1200/api

# Update backend/.env
AI_SERVICE_URL=http://YOUR_IP:8000
```

## 📱 Mobile App Usage

1. Install Expo Go on your mobile device
2. Scan the QR code from the Expo development server
3. Create an account or log in
4. Start reporting civic issues with photos
5. View issues on the interactive map
6. Earn rewards for community participation

## 🔧 Configuration

### Supabase Setup

1. Create a new Supabase project
2. Set up authentication (email/password and OAuth)
3. Create the required database tables (see `backend/database/` for schema)
4. Update environment variables with your Supabase credentials

### Google Maps Integration

1. Get a Google Maps API key
2. Enable required APIs (Maps JavaScript API, Places API)
3. Add the API key to your environment variables

### AI Model Setup

The AI service uses YOLOv8 for issue detection. You can:
- Use the pre-trained model (downloads automatically)
- Train your own model and place it in `ai-service/models/best.pt`

## 🐛 Troubleshooting

### Common Issues

1. **App stuck on loading**: Check network connectivity and API URLs
2. **Image verification fails**: Ensure AI service is running and accessible
3. **Authentication errors**: Verify Supabase credentials and configuration
4. **Map not loading**: Check Google Maps API key and permissions

### Debug Mode

Enable detailed logging by checking the console outputs in:
- Expo developer tools (for frontend)
- Terminal running backend server
- Terminal running AI service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Supabase for backend infrastructure
- Expo team for the excellent development platform
- Ultralytics for YOLOv8
- OpenStreetMap for map data

## 📞 Support

For issues and questions:
1. Check existing issues in the repository
2. Create a new issue with detailed description
3. Include device/platform information and logs

---

**Happy Civic Reporting! 🏙️📱**
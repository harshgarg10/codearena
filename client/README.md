# AlgoArena - Competitive Programming Duel Platform

A real-time competitive programming platform where users can duel against each other or friends in coding challenges.

## Features

- 🎯 **Online Matchmaking**: Get matched with players of similar skill level
- 👥 **Friend Duels**: Create private rooms and invite friends
- 🏆 **Rating System**: Track your progress and climb the leaderboard
- 💻 **Multi-language Support**: Code in C++, Python, or Java
- ⚡ **Real-time**: Live updates during duels using WebSockets

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/algoarena.git
   cd algoarena
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Set up the database**
   - Create a MySQL database named `codearena`
   - Import the schema: `mysql -u root -p codearena < server/db/schema.sql`

4. **Configure environment variables**
   - Copy `server/.env.example` to `server/.env`
   - Update the database credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=your_password
   DB_NAME=codearena
   JWT_SECRET=your_jwt_secret_here
   PORT=5000
   ```

5. **Start the application**
   ```bash
   # Start the server (from server directory)
   npm run dev
   
   # Start the client (from client directory, in a new terminal)
   npm start
   ```

6. **Access the application**
   - Open your browser and go to `http://localhost:3000`
   - The server runs on `http://localhost:5000`

## Database Setup

The application will automatically seed the database with initial problems when you start the server for the first time. If you need to manually seed the database:

```bash
cd server
npm run seed
```

## Technology Stack

### Frontend
- React 18
- React Router v6
- Tailwind CSS
- Socket.io Client
- Monaco Editor (VS Code editor)
- Lucide React (Icons)

### Backend
- Node.js
- Express.js
- Socket.io
- MySQL
- JWT Authentication
- bcrypt for password hashing

## Project Structure

```
algoarena/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── utils/          # Utility functions
│   │   └── ...
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/             # Database configuration
│   ├── controllers/        # Route controllers
│   ├── db/                 # Database files
│   ├── middleware/         # Custom middleware
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   └── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues, please file an issue on the GitHub repository.
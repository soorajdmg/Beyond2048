# 🔢 Beyond 2048

A challenging evolution of the classic 2048 game with enhanced features and gameplay mechanics. Push your strategic thinking to new heights!

## 🚀 Table of Contents

- Introduction
- Features
- Tech Stack
- Installation
- Gameplay
- Controls
- Strategy Tips
- Contributing
- Contact
  
## 📖 Introduction

Welcome to Beyond2048! This project takes the addictive sliding tile puzzle concept of the original 2048 and elevates it with new mechanics, challenges, and visual enhancements. Built as a full-stack application, it comes with user authentication, personalized profiles, a leaderboard system, and multiple visual themes to make your gameplay experience fun, competitive, and modern.

## 🌟 Features

- **Enhanced Gameplay**: Easy to play, hard to master.
- **User Accounts**: Create a profile to save your progress and track your statistics.
- **Customizable Themes**: Pick from Classic, Dark, Neon, or Childish for a personalized look.
- **Smooth Animations**: Enjoy a seamless gaming experience.
- **Global Leaderboards**: Compete with players worldwide and see where you rank.
- **Game History**: Review your recent games and analyze your performance.
- **Persistent Data**: All data is stored and retrieved from MongoDB to ensure your progress is saved.

## 💻 Tech Stack

- **Frontend**: React.js with modern hooks and state management
- **Backend**: Node.js with Express for API endpoints
- **Database**: MongoDB for user data, game statistics, and leaderboards
- **Authentication**: JWT for secure user sessions
- **Styling**: CSS for responsive and themed designs

## 🛠 Installation

To get Beyond2048 running on your local machine, follow these steps:

- Prerequisites
    - Node.js (v14 or higher)
    - npm or yarn
    - MongoDB (local instance or connection string to MongoDB Atlas)

1. **Clone the repository:**
    ```sh
    git clone https://github.com/soorajdmg/Beyond2048
    ```

2. **Install backend dependencies:**
    ```sh
    cd Beyond2048/server
    npm install
    ```

3. **Configure environment variables:**
    - Create a `.env` file in the server directory
    - Add your MongoDB connection string and JWT secret:
      ```
        MONGODB_URI=your_mongodb_connection_string
        JWT_SECRET=your_jwt_secret
        PORT=5000
      ```

4. **Install frontend dependencies:**
    ```sh
    cd ../client    
    npm install 
    ```

5. **Start the development servers:**
    - For backend:
    ```sh
    cd ../client    
    npm install 
    ```

    - For frontend:
    ```sh
    cd ../client
    npm start
    ```

6. **Access the application:**
    - Open your browser and navigate to `http://localhost:3000`

## 🎮 Gameplay

- Slide numbered tiles on the grid to combine identical values.
- When two tiles with the same number touch, they merge into one with their sum.
- The goal is to create a tile with the value 2048 and beyond!

## 🕹 Controls

1. **Desktop:**
    - Arrow Keys: Slide tiles in the chosen direction
2. **Mobile:**
    - Swipe: Slide tiles in the swipe direction

## 💡 Strategy Tips

- Focus on keeping your highest value tile in a corner.
- Build a "snake chain" of descending values to maintain order.
- Save power-ups for critical moments when the board gets crowded.
- Think several moves ahead - plan for tile spawns after each move.

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📬 Contact

Have a question or want to collaborate? Reach out to me:

- **Email:** [soorajmurugaraj@gmail.com](soorajmurugaraj@gmail.com)
- **GitHub:** https://github.com/soorajdmg

---

⭐️ Don't forget to give a star if you like the project!

---
---
---


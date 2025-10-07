import React from 'react';
import { GameProvider } from './contexts/gameContext'; 
import Navbar from './components/navbar';
import Game from './components/game';
import Controls from './components/controls';
import Footer from './components/footer';
import './App.css';

const App = () => {
  return (
    <GameProvider>
      <div className="app-container">
        <div className="game-wrapper">
          <Navbar />
          <Game />
          <Controls />
          <Footer />
        </div>
      </div>
    </GameProvider>
  );
};

export default App;
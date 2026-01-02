import React, { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import GameScene from './components/GameScene';
import UIOverlay from './components/UIOverlay';
import { WeaponType } from './types';
import { PLAYER_CONFIG, WEAPONS } from './constants';

const App: React.FC = () => {
  const [score, setScore] = useState(0);
  const [weapon, setWeapon] = useState<WeaponType>('rifle');
  const [msg, setMsg] = useState<string | null>(null);
  const [enemyCount, setEnemyCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [health, setHealth] = useState(PLAYER_CONFIG.maxHealth);
  const [gameStarted, setGameStarted] = useState(false);
  
  // Ammo State
  const [currentAmmo, setCurrentAmmo] = useState(WEAPONS['rifle'].magSize);
  const [maxAmmo, setMaxAmmo] = useState(WEAPONS['rifle'].magSize);
  const [isReloading, setIsReloading] = useState(false);

  const handleStart = useCallback(() => {
    setGameStarted(true);
    // Explicitly target the game canvas to avoid selecting minimap or other canvases
    const canvas = document.querySelector('canvas[data-engine="three.js r169"]') as HTMLCanvasElement || document.querySelector('canvas');
    if (canvas) {
        // Must be called directly from user gesture (click/key)
        canvas.requestPointerLock();
    }
  }, []);

  const showMessage = useCallback((text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 1500);
  }, []);

  const handleAmmoUpdate = useCallback((curr: number, max: number, reloading: boolean) => {
      setCurrentAmmo(curr);
      setMaxAmmo(max);
      setIsReloading(reloading);
  }, []);

  return (
    <div className="relative w-full h-full bg-black">
      <Canvas shadows camera={{ fov: 75, position: [0, 1.7, 5] }}>
        <GameScene 
          onScoreUpdate={setScore}
          onWeaponChange={(w) => setWeapon(w as WeaponType)}
          onMsg={showMessage}
          onEnemiesUpdate={setEnemyCount}
          onLockedChange={setIsLocked}
          onHealthUpdate={setHealth}
          onAmmoUpdate={handleAmmoUpdate}
          gameStarted={gameStarted}
        />
      </Canvas>
      <UIOverlay 
        score={score} 
        weapon={weapon}
        enemyCount={enemyCount}
        message={msg}
        isLocked={isLocked}
        onStart={handleStart}
        health={health}
        currentAmmo={currentAmmo}
        maxAmmo={maxAmmo}
        isReloading={isReloading}
      />
    </div>
  );
};

export default App;
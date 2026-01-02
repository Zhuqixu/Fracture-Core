import React, { useEffect } from 'react';
import { WeaponType } from '../types';
import { WEAPONS, PLAYER_CONFIG } from '../constants';

interface UIProps {
  score: number;
  weapon: WeaponType;
  enemyCount: number;
  message: string | null;
  isLocked: boolean;
  onStart: () => void;
  health: number;
  currentAmmo: number;
  maxAmmo: number;
  isReloading: boolean;
}

const UIOverlay: React.FC<UIProps> = ({ score, weapon, enemyCount, message, isLocked, onStart, health, currentAmmo, maxAmmo, isReloading }) => {
  
  // Listen for any key press to start game when not locked
  useEffect(() => {
    if (!isLocked) {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Prevent default browser actions that might interfere
        onStart();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isLocked, onStart]);

  return (
    <div className={`absolute top-0 left-0 w-full h-full select-none font-mono ${isLocked ? 'pointer-events-none' : 'pointer-events-auto'}`}>
      
      {/* HUD Layer */}
      {isLocked && (
        <>
          {/* Reticle */}
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-red-500 rounded-full border border-white transform -translate-x-1/2 -translate-y-1/2 z-10" />

          {/* Minimap Container (Goal 4) */}
          <div className="absolute top-5 left-5 z-20">
              <div className="w-40 h-40 rounded-full border-2 border-cyan-500 bg-black/80 overflow-hidden shadow-lg relative">
                 {/* Canvas for Minimap Drawing - Accessed by GameScene */}
                 <canvas id="minimap-canvas" width="160" height="160" className="w-full h-full opacity-80" />
                 
                 {/* Compass Directions */}
                 <div className="absolute top-1 left-1/2 -translate-x-1/2 text-xs text-white font-bold">N</div>
              </div>
          </div>

          {/* Bottom Left: Health & Ammo */}
          <div className="absolute bottom-5 left-5 space-y-4">
             {/* Health Bar */}
             <div className="bg-black/50 p-4 border-l-4 border-green-500 w-64">
                <div className="flex justify-between text-lg font-bold text-red-400 mb-1">
                    <span>生命值</span>
                    <span>{Math.ceil(health)} / {PLAYER_CONFIG.maxHealth}</span>
                </div>
                <div className="w-full h-4 bg-gray-800 rounded overflow-hidden border border-gray-600">
                    <div 
                        className="h-full bg-red-600 transition-all duration-200" 
                        style={{ width: `${(health / PLAYER_CONFIG.maxHealth) * 100}%` }}
                    />
                </div>
            </div>

            {/* Ammo Display */}
            <div className="bg-black/50 p-4 border-l-4 border-yellow-500 w-64 relative overflow-hidden">
                <div className="flex justify-between text-lg font-bold text-yellow-400 mb-1">
                    <span>弹药</span>
                    <span className={isReloading ? "animate-pulse" : ""}>
                        {isReloading ? "RELOADING..." : `${currentAmmo} / ${maxAmmo}`}
                    </span>
                </div>
                {/* Visual Bullet Bar */}
                <div className="w-full h-4 bg-gray-800 rounded overflow-hidden border border-gray-600 flex">
                   {/* Create blocks for bullets */}
                   {Array.from({ length: 20 }).map((_, i) => {
                       const percentage = (i + 1) * 5; // simplified 5% steps
                       const isActive = (currentAmmo / maxAmmo) * 100 >= percentage;
                       return (
                           <div 
                               key={i} 
                               className={`flex-1 mx-px ${isActive ? (isReloading ? 'bg-red-500 animate-pulse-fast' : 'bg-yellow-500') : 'bg-transparent'}`} 
                           />
                       );
                   })}
                </div>
                <div className="text-xs text-gray-400 mt-1 uppercase tracking-widest">
                   [R] RELOAD
                </div>
            </div>
          </div>

          {/* Bottom Right: Stats */}
          <div className="absolute bottom-5 right-5 bg-black/50 p-4 border-r-4 border-cyan-500 text-right text-green-400">
            <div className="text-2xl font-bold mb-1 text-cyan-400 drop-shadow-md uppercase">
              {WEAPONS[weapon].name}
            </div>
            <div className="text-xl">得分: {score}</div>
            <div className="text-xl">敌人剩余: {enemyCount}</div>
            <div className="text-xs text-gray-400 mt-2">
               [1-4] 切换武器 | [E] 盾牌 | [右键] 瞄准锁定
            </div>
          </div>

          <div className={`absolute top-1/4 w-full text-center text-4xl font-black text-red-600 tracking-widest transition-opacity duration-300 ${message ? 'opacity-100 scale-110' : 'opacity-0 scale-100'}`}>
            {message}
          </div>
        </>
      )}

      {/* Menu Layer */}
      {!isLocked && (
        <div 
            className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 cursor-pointer"
            onClick={onStart} // Fallback click handler on the entire background
        >
          <h1 className="text-6xl font-bold text-red-500 tracking-[0.2em] mb-4 uppercase drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]">
            FRACTURE CORE
          </h1>
          <div className="bg-gray-900 border border-gray-700 p-8 rounded shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation() /* Prevent double trigger if clicking modal, but trigger start manually */ }>
            <h2 className="text-white text-xl mb-4 border-b border-gray-700 pb-2">任务控制</h2>
            <div className="space-y-2 text-gray-300">
              <p><span className="text-cyan-400 font-bold">WASD</span> 移动</p>
              <p><span className="text-cyan-400 font-bold">空格键</span> 跳跃</p>
              <p><span className="text-cyan-400 font-bold">1</span> 突击步枪 | <span className="text-cyan-400 font-bold">2</span> 重型狙击枪</p>
              <p><span className="text-cyan-400 font-bold">3</span> 冲锋枪 | <span className="text-cyan-400 font-bold">4</span> RPG-7</p>
              <p><span className="text-cyan-400 font-bold">左键</span> 射击 | <span className="text-cyan-400 font-bold">右键</span> 瞄准</p>
              <p><span className="text-cyan-400 font-bold">R</span> 装填弹药</p>
              <p><span className="text-cyan-400 font-bold">E (长按)</span> 防御盾牌</p>
              <div className="mt-4 text-sm text-gray-500 italic">
                * 注意弹药管理，敌人换弹时是进攻的好时机。
              </div>
            </div>
            <div 
              className="mt-8 w-full py-4 text-center text-red-500 font-bold text-xl uppercase tracking-wider animate-pulse border border-red-900/30 bg-red-900/10 rounded cursor-pointer hover:bg-red-900/30 transition-colors"
              onClick={onStart}
            >
              按下任意按键或点击此处进入游戏
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UIOverlay;
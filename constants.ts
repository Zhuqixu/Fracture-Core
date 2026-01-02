import { WeaponStats, WeaponType, EnemyWeaponType } from './types';
import * as THREE from 'three';

export const PLAYER_CONFIG = {
  speed: 1.5,      
  runSpeed: 2.25,  
  jumpForce: 10.0,
  height: 1.7,
  radius: 0.5,
  gravity: 25.0,
  stepHeight: 0.6,
  maxHealth: 100,
};

// Goal 1 & 2: Optimized Updraft Positions (In gaps, not through floors)
// Connecting Ground -> Layer 1 -> Layer 2
export const UPDRAFTS = [
    // Ground to Layer 1 (Mid) - Placed in the open corners relative to the central hub
    { x: -25, z: 25, radius: 4, force: 45.0, visualHeight: 20 }, 
    { x: 25, z: -25, radius: 4, force: 45.0, visualHeight: 20 },
    
    // Layer 1 to Layer 2 (High) - Placed at the edges of the wings
    { x: -45, z: 0, radius: 4, force: 50.0, visualHeight: 30 }, 
    { x: 45, z: 0, radius: 4, force: 50.0, visualHeight: 30 },
];
export const UPDRAFT_CONFIG = UPDRAFTS[0];

export const ENEMY_CONFIG = {
    meleeRange: 3.5, 
    meleeDamage: 15, 
    meleeRate: 1000,  // Slower melee attacks (was 500)
    attackRange: 80, 
    attackRate: 800, // Slower general fallback rate (was 400)
    decisionRate: 600, 
};

// High Aggression / Low Damage Tuning / Rate Halved
export const ENEMY_WEAPONS: Record<EnemyWeaponType, { 
    rate: number, range: number, dmg: number, speed: number, color: number, size: number, spread: number, burst?: number,
    magSize: number, reloadTime: number
}> = {
    'rifle': { 
        rate: 240, 
        range: 70, 
        dmg: 3,   
        speed: 35, 
        color: 0xffaa00, 
        size: 0.15, 
        spread: 0.08,
        magSize: 30,
        reloadTime: 2500 
    },
    'shotgun': { 
        rate: 2000, 
        range: 25, 
        dmg: 2,    
        speed: 30, 
        color: 0xffffff, 
        size: 0.08, 
        spread: 0.25, 
        burst: 8,
        magSize: 6,
        reloadTime: 3000
    },
    'laser': { 
        rate: 300, 
        range: 90, 
        dmg: 6,    
        speed: 120, 
        color: 0x00ffff, 
        size: 0.1, 
        spread: 0.02,
        magSize: 15, // Shots before overheat/reload
        reloadTime: 2000 
    },
    'flamethrower': { 
        rate: 80,  
        range: 18, 
        dmg: 0.5,  
        speed: 12, 
        color: 0xff4400, 
        size: 0.35, 
        spread: 0.2,
        magSize: 100, // Ticks of fuel
        reloadTime: 4000
    }
};

export const WEAPONS: Record<WeaponType, WeaponStats> = {
  rifle: { 
    name: "突击步枪", rate: 100, dmg: 20, spread: 0.01, recoil: 0.02, 
    speed: 600, size: 0.1, color: 0xffff00, explosive: false,
    magSize: 30, reloadTime: 2200
  },
  sniper: { 
    name: "重型狙击枪", rate: 1500, dmg: 150, spread: 0.001, recoil: 0.3, 
    speed: 1000, size: 0.2, color: 0xffffff, explosive: false,
    magSize: 5, reloadTime: 3500
  },
  smg: { 
    name: "冲锋枪", rate: 50, dmg: 10, spread: 0.05, recoil: 0.015, 
    speed: 500, size: 0.1, color: 0xffaa00, explosive: false,
    magSize: 45, reloadTime: 1800
  },
  rpg: { 
    name: "RPG-7 火箭筒", rate: 2000, dmg: 300, spread: 0.02, recoil: 0.4, 
    speed: 80, size: 0.4, color: 0xff4400, explosive: true, radius: 10, force: 30,
    magSize: 1, reloadTime: 3000
  },
};

export const ENEMY_PARTS_CONFIG = {
  'Head':  { size: [0.3, 0.35, 0.3], offset: [0, 2.05, 0], maxHp: 100, multiplier: 2.5 }, 
  'Torso': { size: [0.6, 0.9, 0.35], offset: [0, 1.35, 0], maxHp: 600, multiplier: 1.0 }, 
  'LArm':  { size: [0.2, 0.9, 0.2], offset: [-0.45, 1.4, 0], maxHp: 30, multiplier: 0.6 },
  'RArm':  { size: [0.2, 0.9, 0.2], offset: [0.45, 1.4, 0], maxHp: 30, multiplier: 0.6 },
  'LLeg':  { size: [0.22, 1.0, 0.25], offset: [-0.2, 0.45, 0], maxHp: 40, multiplier: 0.7 },
  'RLeg':  { size: [0.22, 1.0, 0.25], offset: [0.2, 0.45, 0], maxHp: 40, multiplier: 0.7 },
};

const LAYER_1_Y = 12;
const LAYER_2_Y = 24;

export const MAP_BOUNDS = {
  floor: { x: 0, y: -0.5, z: 0, w: 100, h: 1, d: 100 },
  
  platforms: [
      // Layer 1 (Mid)
      { x: 0, y: LAYER_1_Y - 0.5, z: 0, w: 40, h: 1, d: 40 }, // Central Hub
      { x: -35, y: LAYER_1_Y - 0.5, z: 0, w: 20, h: 1, d: 10 }, // West Wing
      { x: 35, y: LAYER_1_Y - 0.5, z: 0, w: 20, h: 1, d: 10 }, // East Wing
      
      // Layer 2 (High)
      { x: 0, y: LAYER_2_Y - 0.5, z: -35, w: 30, h: 1, d: 20 }, // North Tower
      { x: 0, y: LAYER_2_Y - 0.5, z: 35, w: 30, h: 1, d: 20 }, // South Tower
      { x: 0, y: LAYER_2_Y - 0.5, z: 0, w: 10, h: 1, d: 80 }, // Bridge connecting N-S
  ],

  walls: [
    // Outer Bounds
    { x: 0, y: 15, z: -50, w: 100, h: 30, d: 2 },
    { x: 0, y: 15, z: 50, w: 100, h: 30, d: 2 },
    { x: -50, y: 15, z: 0, w: 2, h: 30, d: 100 },
    { x: 50, y: 15, z: 0, w: 2, h: 30, d: 100 },
    
    // Ground Cover
    { x: -15, y: 3, z: 15, w: 10, h: 6, d: 2 }, 
    { x: 15, y: 3, z: -15, w: 10, h: 6, d: 2 },
    
    // Layer 1 Cover
    { x: 0, y: LAYER_1_Y + 2, z: 18, w: 20, h: 4, d: 1 }, 
    { x: 0, y: LAYER_1_Y + 2, z: -18, w: 20, h: 4, d: 1 },

    // Layer 2 Cover
    { x: -10, y: LAYER_2_Y + 2, z: -30, w: 1, h: 4, d: 10 },
    { x: 10, y: LAYER_2_Y + 2, z: 30, w: 1, h: 4, d: 10 },
  ]
};

export const COLLISION_BOXES = [
  new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(MAP_BOUNDS.floor.x, MAP_BOUNDS.floor.y, MAP_BOUNDS.floor.z),
    new THREE.Vector3(MAP_BOUNDS.floor.w, MAP_BOUNDS.floor.h, MAP_BOUNDS.floor.d)
  ),
  ...MAP_BOUNDS.platforms.map(p => new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(p.x, p.y, p.z),
      new THREE.Vector3(p.w, p.h, p.d)
  )),
  ...MAP_BOUNDS.walls.map(w => new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(w.x, w.y, w.z),
    new THREE.Vector3(w.w, w.h, w.d)
  ))
];
import * as THREE from 'three';

export type WeaponType = 'rifle' | 'sniper' | 'smg' | 'rpg';
export type EnemyWeaponType = 'rifle' | 'shotgun' | 'laser' | 'flamethrower';

export interface WeaponStats {
  name: string;
  rate: number; // ms between shots
  dmg: number;
  spread: number;
  recoil: number;
  speed: number; // Projectile speed
  size: number; // Projectile hit radius
  color: number;
  explosive: boolean;
  radius?: number; // explosion radius
  force?: number; // explosion knockback force
  
  // New Ammo Stats
  magSize: number;
  reloadTime: number; // ms
}

export interface PlayerState {
  health: number;
  score: number;
  weapon: WeaponType;
  // Map of weapon type to current ammo count
  ammo: Record<WeaponType, number>;
  isReloading: boolean;
  reloadEndTime: number;
}

export interface InputState {
  f: boolean;
  b: boolean;
  l: boolean;
  r: boolean;
  jump: boolean;
  fire: boolean;
  aim: boolean;
  shield: boolean;
  reload: boolean; // New input
}

export interface EnemyPartData {
  name: string;
  maxHp: number;
  hp: number;
  broken: boolean;
  multiplier: number;
  // Dimensions for physical debris
  size: [number, number, number]; 
  offset: [number, number, number];
}

export type EnemyAIState = 'chase' | 'evade' | 'tactical_cover' | 'seek_updraft' | 'flank' | 'suppress' | 'reloading';

export interface EnemyData {
  id: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  parts: { [key: string]: EnemyPartData }; 
  isCrawling: boolean;
  isDead: boolean;
  speed: number;
  aiState: EnemyAIState;
  weaponType: EnemyWeaponType; 
  
  // Ammo & Reload for Enemy
  ammo: number;
  isReloading: boolean;
  reloadFinishTime: number;

  // AI Timers
  changeStateTime: number; 
  lastAttackTime: number; 
  lastMeleeTime: number; 
  tacticalTimer: number; // For strafing/cover decisions
  burstCount: number; // For burst fire logic
  
  targetPos: THREE.Vector3; // Where AI wants to go
  velocity: THREE.Vector3; 
}

// Physical debris (limbs, weapons)
export interface DebrisData {
  id: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  velocity: THREE.Vector3;
  rotVelocity: THREE.Vector3;
  size: [number, number, number];
  color: number;
  type: 'limb' | 'weapon';
  life: number; // -1 for permanent until cleanup
}

export interface ProjectileData {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lastPosition: THREE.Vector3; // For continuous collision detection
  type: WeaponType | 'enemy_bullet'; // New: Distinguish projectile source
  radius: number;
  damage: number;
  life: number;
  owner: 'player' | 'enemy'; // New: Prevent self-damage
  
  // New Tracking Fields
  sourceEntityId?: string; // Who fired this?
  targetId?: string;       // Who is this tracking?
  targetPart?: string;     // Which part is this tracking?
  color: number;           // Dynamic color support
}
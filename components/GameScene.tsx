import React, { useEffect, useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PointerLockControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import Level from './Level';
import Enemy from './Enemy';
import WeaponModel from './WeaponModel';
import { PLAYER_CONFIG, COLLISION_BOXES, WEAPONS, UPDRAFTS, ENEMY_PARTS_CONFIG, ENEMY_CONFIG, MAP_BOUNDS, ENEMY_WEAPONS } from '../constants';
import { WeaponType, EnemyData, ProjectileData, DebrisData, WeaponStats, EnemyPartData, InputState, EnemyWeaponType } from '../types';

// Audio Context
const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
const audioCtx = new AudioContextClass();

const playSound = (type: 'shoot' | 'reload' | 'hit' | 'kill' | 'rpg' | 'jump_pad' | 'explode' | 'player_hit' | 'shield_hit' | 'knife_hit' | 'block' | 'empty') => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;

  if (type === 'shoot') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now); osc.stop(now + 0.1);
  } else if (type === 'reload') {
    // Mechanical reload sound
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(300, now + 0.1);
    osc.frequency.setValueAtTime(300, now + 0.2);
    osc.frequency.linearRampToValueAtTime(600, now + 0.4);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);
    osc.start(now); osc.stop(now + 0.5);
  } else if (type === 'empty') {
    // Click sound
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc.start(now); osc.stop(now + 0.05);
  } else if (type === 'rpg') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(50, now + 0.5);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc.start(now); osc.stop(now + 0.5);
  } else if (type === 'explode') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(10, now + 0.5);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc.start(now); osc.stop(now + 0.5);
  } else if (type === 'hit') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.05);
    osc.start(now); osc.stop(now + 0.05);
  } else if (type === 'kill') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);
    osc.start(now); osc.stop(now + 0.2);
  } else if (type === 'jump_pad') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.5);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);
    osc.start(now); osc.stop(now + 0.5);
  } else if (type === 'player_hit') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.1);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);
    osc.start(now); osc.stop(now + 0.2);
  } else if (type === 'shield_hit') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.1);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.start(now); osc.stop(now + 0.2);
  } else if (type === 'knife_hit') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(200, now + 0.1);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.1);
    osc.start(now); osc.stop(now + 0.1);
  } else if (type === 'block') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, now);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.start(now); osc.stop(now + 0.15);
  }
};

const generateUUID = () => Math.random().toString(36).substring(2, 9);

interface GameSceneProps {
  onScoreUpdate: (score: number) => void;
  onWeaponChange: (weapon: string) => void;
  onMsg: (msg: string) => void;
  onEnemiesUpdate: (count: number) => void;
  onLockedChange: (locked: boolean) => void;
  onHealthUpdate: (hp: number) => void;
  onAmmoUpdate: (current: number, max: number, isReloading: boolean) => void;
  gameStarted: boolean;
}

const GameScene: React.FC<GameSceneProps> = ({ 
  onScoreUpdate, onWeaponChange, onMsg, onEnemiesUpdate, onLockedChange, onHealthUpdate, onAmmoUpdate, gameStarted
}) => {
  const { camera } = useThree();
  const weaponGroupRef = useRef<THREE.Group>(null);
  const flashRef = useRef<THREE.Mesh>(null); 
  const aimAssistPointsRef = useRef<THREE.Group>(null); 
  
  // -- GAME STATE --
  const playerState = useRef({
    health: PLAYER_CONFIG.maxHealth,
    velocity: new THREE.Vector3(),
    onGround: false,
    inUpdraft: false,
    hasUsedUpdraft: false,
    weapon: 'rifle' as WeaponType,
    // Initialize ammo for all weapons
    ammo: {
        rifle: WEAPONS.rifle.magSize,
        sniper: WEAPONS.sniper.magSize,
        smg: WEAPONS.smg.magSize,
        rpg: WEAPONS.rpg.magSize
    } as Record<WeaponType, number>,
    isReloading: false,
    reloadEndTime: 0,
    lastFire: 0,
    score: 0,
    recoil: 0,
    hitFlash: 0,
  });

  // Inputs
  const inputs = useRef<InputState>({ f: false, b: false, l: false, r: false, jump: false, fire: false, aim: false, shield: false, reload: false });
  
  // Track currently locked target for aiming
  const lockedTargetRef = useRef<{id: string, part: string} | null>(null);

  // Core Entities
  const enemiesRef = useRef<EnemyData[]>([]);
  const projectilesRef = useRef<ProjectileData[]>([]);
  const debrisRef = useRef<DebrisData[]>([]);
  const particlesRef = useRef<any[]>([]);

  // Instanced Rendering Refs
  const debrisGroupRef = useRef<THREE.Group>(null);
  const projectileGroupRef = useRef<THREE.Group>(null);
  const particleGroupRef = useRef<THREE.Group>(null);

  // Minimap
  const minimapCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [activeWeapon, setActiveWeapon] = useState<WeaponType>('rifle');
  const [renderVer, setRenderVer] = useState(0); 

  // -- INIT --
  useEffect(() => {
    if (gameStarted) {
        const initialEnemies: EnemyData[] = [];
        for(let i=0; i<6; i++) initialEnemies.push(createEnemy());
        enemiesRef.current = initialEnemies;
        setRenderVer(v => v + 1);
        onEnemiesUpdate(initialEnemies.length);
        onHealthUpdate(PLAYER_CONFIG.maxHealth);
        playerState.current.health = PLAYER_CONFIG.maxHealth;
        onMsg("FRACTURE CORE: 任务开始");
        updateAmmoUI();
    }
  }, [gameStarted]);

  const updateAmmoUI = () => {
      const ps = playerState.current;
      const wStats = WEAPONS[ps.weapon];
      onAmmoUpdate(ps.ammo[ps.weapon], wStats.magSize, ps.isReloading);
  };

  // -- CONTROLS --
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch(e.code) {
        case 'KeyW': inputs.current.f = true; break;
        case 'KeyS': inputs.current.b = true; break;
        case 'KeyA': inputs.current.l = true; break;
        case 'KeyD': inputs.current.r = true; break;
        case 'Space': inputs.current.jump = true; break;
        case 'Digit1': changeWeapon('rifle'); break;
        case 'Digit2': changeWeapon('sniper'); break;
        case 'Digit3': changeWeapon('smg'); break;
        case 'Digit4': changeWeapon('rpg'); break;
        case 'KeyE': inputs.current.shield = true; break;
        case 'KeyR': inputs.current.reload = true; break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      switch(e.code) {
        case 'KeyW': inputs.current.f = false; break;
        case 'KeyS': inputs.current.b = false; break;
        case 'KeyA': inputs.current.l = false; break;
        case 'KeyD': inputs.current.r = false; break;
        case 'Space': inputs.current.jump = false; break;
        case 'KeyE': inputs.current.shield = false; break;
        case 'KeyR': inputs.current.reload = false; break;
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      if(e.button === 0) inputs.current.fire = true;
      if(e.button === 2) inputs.current.aim = true;
    };
    const onMouseUp = (e: MouseEvent) => {
      if(e.button === 0) inputs.current.fire = false;
      if(e.button === 2) inputs.current.aim = false;
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const changeWeapon = (w: WeaponType) => {
    // Cancel reload if switching? Or allow background reload? Let's cancel for simplicity.
    if (playerState.current.isReloading) {
        playerState.current.isReloading = false;
        onMsg("装填中断");
    }
    playerState.current.weapon = w;
    setActiveWeapon(w);
    onWeaponChange(w);
    updateAmmoUI();
  };

  const createEnemy = (): EnemyData => {
    let pos = new THREE.Vector3();
    if (Math.random() > 0.5) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * 20;
        pos.set(Math.sin(angle) * dist, 5, Math.cos(angle) * dist); 
    } else {
        pos.set((Math.random() - 0.5) * 50, 6, 35 + (Math.random() - 0.5) * 10);
    }

    const parts: any = {};
    Object.entries(ENEMY_PARTS_CONFIG).forEach(([key, cfg]: [string, any]) => {
        parts[key] = { 
            name: key, maxHp: cfg.maxHp, hp: cfg.maxHp, broken: false, 
            multiplier: cfg.multiplier, meshId: generateUUID(), 
            size: cfg.size, offset: cfg.offset
        };
    });

    // Goal 4: Varied Weapons
    const weaponTypes: EnemyWeaponType[] = ['rifle', 'shotgun', 'laser', 'flamethrower'];
    const wType = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
    const wConfig = ENEMY_WEAPONS[wType];

    return {
      id: generateUUID(),
      position: pos,
      rotation: new THREE.Euler(0, Math.random() * Math.PI * 2, 0),
      isCrawling: false,
      isDead: false,
      speed: 2 + Math.random() * 2,
      aiState: 'chase',
      weaponType: wType,
      ammo: wConfig.magSize,
      isReloading: false,
      reloadFinishTime: 0,
      changeStateTime: 0,
      lastAttackTime: 0,
      lastMeleeTime: 0,
      tacticalTimer: 0,
      burstCount: 0,
      targetPos: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      parts
    };
  };

  // --- HELPER AI FUNCTIONS ---
  const findNearestUpdraft = (pos: THREE.Vector3) => {
      let nearest = null;
      let minDst = Infinity;
      for(const u of UPDRAFTS) {
          const uPos = new THREE.Vector3(u.x, pos.y, u.z);
          const d = pos.distanceTo(uPos);
          if (d < minDst) {
              minDst = d;
              nearest = u;
          }
      }
      return nearest;
  };

  const getCoverPosition = (enemyPos: THREE.Vector3, playerPos: THREE.Vector3) => {
      let bestPos = enemyPos.clone();
      let bestScore = -Infinity;
      for(const w of MAP_BOUNDS.walls) {
          const wallPos = new THREE.Vector3(w.x, enemyPos.y, w.z);
          const distToWall = enemyPos.distanceTo(wallPos);
          if (distToWall > 30) continue; 
          
          // Improved Cover: Check 4 sides of wall
          const offsets = [
              new THREE.Vector3(4, 0, 0), new THREE.Vector3(-4, 0, 0),
              new THREE.Vector3(0, 0, 4), new THREE.Vector3(0, 0, -4)
          ];

          for (const off of offsets) {
             const candidate = wallPos.clone().add(off);
             const wallToPlayer = new THREE.Vector3().subVectors(playerPos, wallPos);
             const wallToCand = new THREE.Vector3().subVectors(candidate, wallPos);
             
             // If vectors are opposite (dot product negative), then they are on opposite sides
             if (wallToPlayer.dot(wallToCand) < 0) {
                 const score = -enemyPos.distanceTo(candidate); // closer is better
                 if (score > bestScore) {
                     bestScore = score;
                     bestPos = candidate;
                 }
             }
          }
      }
      return bestPos;
  };
  
  const hasLineOfSight = (start: THREE.Vector3, end: THREE.Vector3) => {
      const dir = new THREE.Vector3().subVectors(end, start);
      const dist = dir.length();
      if (dist < 1.0) return true;
      dir.normalize();
      const ray = new THREE.Ray(start, dir);
      for (const box of COLLISION_BOXES) {
          const intersection = new THREE.Vector3();
          if (ray.intersectBox(box, intersection)) {
              const distToHit = start.distanceTo(intersection);
              if (distToHit > 0.5 && distToHit < dist - 0.5) return false;
          }
      }
      return true;
  };


  // --- SPAWNERS ---
  const spawnDebris = (pos: THREE.Vector3, rot: THREE.Euler, size: [number, number, number], color: number, vel: THREE.Vector3, type: 'limb'|'weapon' = 'limb') => {
      const finalVel = vel.clone().add(new THREE.Vector3((Math.random()-0.5)*5, Math.random()*5, (Math.random()-0.5)*5));
      const debris: DebrisData = {
          id: generateUUID(),
          position: pos.clone(),
          rotation: rot.clone(),
          velocity: finalVel,
          rotVelocity: new THREE.Vector3((Math.random()-0.5)*10, (Math.random()-0.5)*10, (Math.random()-0.5)*10),
          size, color, type, life: -1
      };
      if (debrisGroupRef.current) {
          const mat = new THREE.MeshStandardMaterial({ color });
          const geo = new THREE.BoxGeometry(size[0], size[1], size[2]);
          const mesh = new THREE.Mesh(geo, mat);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.position.copy(pos);
          mesh.userData = { debrisId: debris.id };
          debrisGroupRef.current.add(mesh);
          if (type === 'weapon') {
              const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.6), new THREE.MeshStandardMaterial({color:0x111111}));
              barrel.rotation.x = Math.PI/2;
              barrel.position.z = -0.3;
              mesh.add(barrel);
          }
      }
      debrisRef.current.push(debris);
  };

  const spawnParticle = (pos: THREE.Vector3, type: 'blood'|'smoke'|'spark') => {
      const p = {
          id: generateUUID(),
          position: pos.clone(),
          velocity: new THREE.Vector3((Math.random()-0.5)*3, (Math.random()-0.5)*3 + 2, (Math.random()-0.5)*3),
          life: 1.0,
          type,
          mesh: null as THREE.Mesh | null
      };
      if (particleGroupRef.current) {
          const size = type === 'blood' ? 0.1 : (type==='smoke'?0.3:0.1);
          const color = type === 'blood' ? 0xcc0000 : (type==='smoke'?0xaaaaaa:0xffaa00);
          const mesh = new THREE.Mesh(new THREE.BoxGeometry(size,size,size), new THREE.MeshBasicMaterial({ color, transparent: true }));
          mesh.position.copy(pos);
          particleGroupRef.current.add(mesh);
          p.mesh = mesh;
      }
      particlesRef.current.push(p);
  };

  const spawnProjectile = (start: THREE.Vector3, dir: THREE.Vector3, speed: number, size: number, color: number, damage: number, type: WeaponType | 'enemy_bullet', explosive: boolean, radius: number = 0, force: number = 0, owner: 'player' | 'enemy', sourceEntityId?: string, targetId?: string, targetPart?: string) => {
      const proj: ProjectileData = {
          id: generateUUID(),
          position: start.clone(),
          lastPosition: start.clone(),
          velocity: dir.clone().multiplyScalar(speed),
          type,
          radius: size,
          damage,
          life: 3.0,
          owner,
          sourceEntityId,
          targetId,
          targetPart,
          color
      };
      if (projectileGroupRef.current) {
          const mesh = new THREE.Mesh(
              new THREE.SphereGeometry(size, 8, 8), 
              new THREE.MeshBasicMaterial({ color: color })
          );
          mesh.position.copy(start);
          mesh.userData = { projId: proj.id };
          projectileGroupRef.current.add(mesh);
      }
      projectilesRef.current.push(proj);
  };

  const spawnExplosion = (pos: THREE.Vector3, radius: number, force: number, damage: number) => {
      playSound('explode');
      for(let i=0; i<30; i++) spawnParticle(pos, 'smoke');
      for(let i=0; i<15; i++) spawnParticle(pos, 'spark');
      const enemiesToRemove: string[] = [];
      enemiesRef.current.forEach(e => {
          const dist = e.position.distanceTo(pos);
          if (dist < radius) {
              const impact = 1 - (dist/radius);
              const dmg = damage * impact;
              const dir = new THREE.Vector3().subVectors(e.position, pos).normalize();
              e.velocity.add(dir.multiplyScalar(force * impact));
              e.position.y += 0.5; 
              // Goal 3: Shared HP logic
              e.parts['Torso'].hp -= dmg;
              if (e.parts['Torso'].hp <= 0 && !e.isDead) enemiesToRemove.push(e.id);
          }
      });
      enemiesToRemove.forEach(killEnemy);
      debrisRef.current.forEach(d => {
          const dist = d.position.distanceTo(pos);
          if (dist < radius) {
              const impact = 1 - (dist/radius);
              const dir = new THREE.Vector3().subVectors(d.position, pos).normalize();
              d.velocity.add(dir.multiplyScalar(force * impact * 1.5)); 
              d.position.y += 0.5;
          }
      });
  };

  const damagePlayer = (amount: number) => {
    playerState.current.health = Math.max(0, playerState.current.health - amount);
    onHealthUpdate(playerState.current.health);
    playSound('player_hit');
    playerState.current.hitFlash = 1.0; 
    if (playerState.current.health <= 0) {
        onMsg("你已阵亡!");
        setTimeout(() => {
            playerState.current.health = PLAYER_CONFIG.maxHealth;
            onHealthUpdate(100);
            camera.position.set(0, 5, 0);
            onMsg("重生...");
        }, 2000);
    }
  };

  const reloadPlayerWeapon = () => {
      const ps = playerState.current;
      const wStats = WEAPONS[ps.weapon];
      
      if (ps.isReloading) return;
      if (ps.ammo[ps.weapon] >= wStats.magSize) return; // Full already

      ps.isReloading = true;
      ps.reloadEndTime = performance.now() + wStats.reloadTime;
      playSound('reload');
      updateAmmoUI();
  };

  // --- COMBAT ---
  const fireWeapon = () => {
    const now = performance.now();
    const ps = playerState.current;
    
    // Check Reload State
    if (ps.isReloading) {
        if (now >= ps.reloadEndTime) {
            ps.isReloading = false;
            ps.ammo[ps.weapon] = WEAPONS[ps.weapon].magSize;
            updateAmmoUI();
        } else {
            return; // Still reloading
        }
    }

    const wData = WEAPONS[ps.weapon];
    if (now - ps.lastFire < wData.rate) return;
    if (inputs.current.shield) return; 

    // Ammo Check
    if (ps.ammo[ps.weapon] <= 0) {
        playSound('empty');
        ps.lastFire = now + 500; // prevent spamming click sound
        reloadPlayerWeapon();
        return;
    }

    // Fire!
    ps.ammo[ps.weapon]--;
    updateAmmoUI();
    
    ps.lastFire = now;
    ps.recoil = wData.recoil; 
    camera.rotation.x += wData.recoil * 0.05;

    playSound(wData.explosive ? 'rpg' : 'shoot');

    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    const muzzleOffset = inputs.current.aim 
        ? new THREE.Vector3(0, -0.15, -0.5) 
        : new THREE.Vector3(0.3, -0.2, -0.5); 
    
    const pos = camera.position.clone();
    pos.add(right.clone().multiplyScalar(muzzleOffset.x));
    pos.add(up.clone().multiplyScalar(muzzleOffset.y));
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    pos.add(forward.multiplyScalar(-muzzleOffset.z)); 

    spawnDebris(pos, new THREE.Euler(), [0.02, 0.08, 0.02], 0xccaa00, right.multiplyScalar(3), 'limb');

    const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
    const spreadMult = inputs.current.aim ? 0.05 : 1.0; 
    dir.x += (Math.random()-0.5) * wData.spread * spreadMult;
    dir.y += (Math.random()-0.5) * wData.spread * spreadMult;
    dir.z += (Math.random()-0.5) * wData.spread * spreadMult;
    dir.normalize();

    let targetId: string | undefined;
    let targetPart: string | undefined;

    if (lockedTargetRef.current) {
        targetId = lockedTargetRef.current.id;
        targetPart = lockedTargetRef.current.part;
    }

    const startPos = camera.position.clone().add(dir.clone().multiplyScalar(1));
    spawnProjectile(startPos, dir, wData.speed, wData.size, wData.color, wData.dmg, playerState.current.weapon, wData.explosive, wData.radius, wData.force, 'player', 'player', targetId, targetPart);
  };

  const enemyFire = (e: EnemyData) => {
    // Enemy Ammo Check
    if (e.isReloading) return;
    if (e.ammo <= 0) {
        e.isReloading = true;
        const wConfig = ENEMY_WEAPONS[e.weaponType];
        e.reloadFinishTime = performance.now() + wConfig.reloadTime;
        // Visual indicator for enemy reload? For now, they just stop shooting.
        return;
    }

    const wConfig = ENEMY_WEAPONS[e.weaponType];
    const firePos = e.position.clone();
    let armOffset = new THREE.Vector3(0.45, 1.4, 0.5); 
    if (e.isCrawling) armOffset.set(0.45, 0.5, 0.8);
    armOffset.applyEuler(e.rotation);
    firePos.add(armOffset);

    const dir = new THREE.Vector3().subVectors(camera.position, firePos).normalize();
    
    // Decrement Enemy Ammo
    e.ammo--;

    // Weapon specific fire logic
    if (e.weaponType === 'shotgun') {
        for(let i=0; i< (wConfig.burst || 4); i++) {
             const spreadDir = dir.clone();
             spreadDir.x += (Math.random()-0.5) * wConfig.spread;
             spreadDir.y += (Math.random()-0.5) * wConfig.spread;
             spreadDir.z += (Math.random()-0.5) * wConfig.spread;
             spreadDir.normalize();
             spawnProjectile(firePos, spreadDir, wConfig.speed, wConfig.size, wConfig.color, wConfig.dmg, 'enemy_bullet', false, 0, 0, 'enemy', e.id);
        }
        playSound('shoot');
    } 
    else if (e.weaponType === 'flamethrower') {
         const spreadDir = dir.clone();
         spreadDir.x += (Math.random()-0.5) * wConfig.spread;
         spreadDir.y += (Math.random()-0.5) * wConfig.spread;
         spreadDir.z += (Math.random()-0.5) * wConfig.spread;
         spreadDir.normalize();
         spawnProjectile(firePos, spreadDir, wConfig.speed, wConfig.size, wConfig.color, wConfig.dmg, 'enemy_bullet', false, 0, 0, 'enemy', e.id);
    }
    else {
        // Rifle & Laser
        dir.x += (Math.random()-0.5) * wConfig.spread;
        dir.y += (Math.random()-0.5) * wConfig.spread;
        dir.z += (Math.random()-0.5) * wConfig.spread;
        dir.normalize();
        spawnProjectile(firePos, dir, wConfig.speed, wConfig.size, wConfig.color, wConfig.dmg, 'enemy_bullet', false, 0, 0, 'enemy', e.id);
        playSound('shoot');
    }
  };

  const handleHit = (enemyId: string, partName: string, damage: number, hitPos: THREE.Vector3, velocity: THREE.Vector3) => {
      const enemy = enemiesRef.current.find(e => e.id === enemyId);
      if (!enemy) return;
      
      enemy.aiState = 'chase'; 
      const part = enemy.parts[partName];
      if (!part || part.broken) return;
      
      playSound('hit');
      spawnParticle(hitPos, 'blood');
      
      const dmg = damage * part.multiplier;
      part.hp -= dmg;
      
      if (partName === 'Head' || partName === 'Torso') {
           if (partName === 'Head') {
               enemy.parts['Torso'].hp -= dmg;
           } else {
               enemy.parts['Torso'].hp -= dmg; 
           }
      } else {
          enemy.parts['Torso'].hp -= dmg;
      }
      
      enemy.velocity.add(velocity.clone().normalize().multiplyScalar(2));

      if (part.hp <= 0 && !part.broken) {
          part.broken = true;
          const partWorldPos = enemy.position.clone();
          partWorldPos.y += part.offset[1]; 
          partWorldPos.x += (Math.random()-0.5)*0.2;
          partWorldPos.z += (Math.random()-0.5)*0.2;

          spawnDebris(partWorldPos, enemy.rotation, part.size, 0xaa5555, velocity.clone().multiplyScalar(0.2), 'limb');

          if (partName === 'RArm') {
              spawnDebris(partWorldPos.clone().add(new THREE.Vector3(0.2, 0, 0.2)), enemy.rotation, [0.1, 0.1, 0.5], 0x222222, velocity.clone().multiplyScalar(0.1), 'weapon');
              onMsg("敌人被解除武装!");
          }
          if (partName === 'LArm') {
             spawnDebris(partWorldPos.clone().add(new THREE.Vector3(-0.2, 0, 0.2)), enemy.rotation, [0.05, 0.2, 0.05], 0x444444, velocity.clone().multiplyScalar(0.1), 'weapon');
             onMsg("敌人匕首掉落!");
          }

          if (partName === 'Head') onMsg("爆头击碎!");
          
          if (['LLeg', 'RLeg'].includes(partName)) {
              const lLeg = enemy.parts['LLeg'];
              const rLeg = enemy.parts['RLeg'];
              
              if (lLeg.broken && rLeg.broken) {
                  enemy.isCrawling = true; 
                  enemy.speed = 0; 
                  onMsg("敌人双腿尽断，无法移动!");
              } else {
                  enemy.speed *= 0.5;
                  onMsg("敌人腿部断裂，速度减慢!");
              }
          }
      }

      if (enemy.parts['Torso'].hp <= 0 && !enemy.isDead) killEnemy(enemy.id);
  };

  const killEnemy = (id: string) => {
    const idx = enemiesRef.current.findIndex(e => e.id === id);
    if(idx === -1) return;
    const enemy = enemiesRef.current[idx];
    enemy.isDead = true;

    if (lockedTargetRef.current?.id === id) {
        lockedTargetRef.current = null;
    }

    Object.entries(enemy.parts).forEach(([name, p]) => {
        const part = p as EnemyPartData;
        if (!part.broken) {
             const pPos = enemy.position.clone();
             pPos.y += part.offset[1];
             if(enemy.isCrawling) pPos.y = 0.5; 
             pPos.x += (Math.random()-0.5)*0.2;
             pPos.z += (Math.random()-0.5)*0.2;
             spawnDebris(pPos, enemy.rotation, part.size, name==='Head'||name.includes('Arm') ? 0xaa5555 : 0x333333, enemy.velocity.clone().add(new THREE.Vector3(0,2,0)), 'limb');
        }
    });

    if (!enemy.parts['RArm'].broken) {
         spawnDebris(enemy.position.clone().add(new THREE.Vector3(0, 1.5, 0)), enemy.rotation, [0.1, 0.1, 0.5], 0x222222, enemy.velocity, 'weapon');
    }

    enemiesRef.current.splice(idx, 1);
    playSound('kill');
    playerState.current.score += 100;
    onScoreUpdate(playerState.current.score);
    onMsg("敌人粉碎!");
    setRenderVer(v => v+1);
    onEnemiesUpdate(enemiesRef.current.length);

    setTimeout(() => {
        if (gameStarted) {
            enemiesRef.current.push(createEnemy());
            setRenderVer(v => v + 1);
            onEnemiesUpdate(enemiesRef.current.length);
        }
    }, 4000);
  };

  // --- MAIN LOOP ---
  useFrame((state, delta) => {
    const now = performance.now();
    
    // Player Reload Check Loop
    if (playerState.current.isReloading) {
        if (now >= playerState.current.reloadEndTime) {
            playerState.current.isReloading = false;
            playerState.current.ammo[playerState.current.weapon] = WEAPONS[playerState.current.weapon].magSize;
            updateAmmoUI();
        }
    }

    // Manual Reload Input
    if (inputs.current.reload && gameStarted) {
        reloadPlayerWeapon();
    }
    
    // 0. ADS ZOOM / FOV INTERPOLATION
    const targetFov = inputs.current.aim ? 50 : 75; 
    const cam = state.camera as THREE.PerspectiveCamera;
    cam.fov = THREE.MathUtils.lerp(cam.fov, targetFov, delta * 10);
    cam.updateProjectionMatrix();

    // 0.1 MINIMAP LOGIC (Goal 2: Rotating Map, Fixed Player Up)
    if (!minimapCtxRef.current) {
        const canvas = document.getElementById('minimap-canvas') as HTMLCanvasElement;
        if (canvas) minimapCtxRef.current = canvas.getContext('2d');
    }

    if (minimapCtxRef.current) {
        const ctx = minimapCtxRef.current;
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const cx = width / 2;
        const cy = height / 2;
        const scale = 3.0; 
        const radius = width / 2;

        ctx.clearRect(0, 0, width, height);
        
        // Calculate Rotation based on Camera Yaw
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        // We want the map to rotate so that "Up" on screen is where the player is looking.
        // If player yaw is theta, we rotate the world by -theta.
        const theta = Math.atan2(camDir.x, camDir.z); 
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);

        // Helper to transform world coords to Rotating Map coords
        const transformPoint = (x: number, z: number) => {
            // Translate to player local
            const dx = x - camera.position.x;
            const dz = z - camera.position.z;
            
            // Rotate
            // Standard 2D rotation: x' = x*cos - y*sin, y' = x*sin + y*cos
            // Our Z is Up in 2D map terms (but mapped to Y in canvas)
            const rx = dx * cos - dz * sin;
            const rz = dx * sin + dz * cos;
            
            return {
                x: cx + rx * scale,
                y: cy - rz * scale // Canvas Y is down, so invert Z
            };
        };

        // Draw Walls (Rotated)
        ctx.fillStyle = '#666';
        for (const w of MAP_BOUNDS.walls) {
            // To draw a rotated rectangle, we need to transform its 4 corners or just the center.
            // For simplicity in this dot-matrix style map, we transform center and draw small rect.
            // A better way would be transforming the polygon, but dots work well for FPS HUDs.
            const p = transformPoint(w.x, w.z);
            if (p.x > 0 && p.x < width && p.y > 0 && p.y < height) {
                ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
            }
        }

        // Draw Updrafts
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 1;
        const pulse = (Math.sin(now * 0.005) + 1) * 2; 
        for (const u of UPDRAFTS) {
            const p = transformPoint(u.x, u.z);
            const dist = Math.hypot(p.x - cx, p.y - cy);
            if (dist < radius + 10) { 
                ctx.beginPath();
                ctx.arc(p.x, p.y, u.radius * scale * 0.5 + pulse, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Draw Player Arrow (Fixed Up)
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 6);
        ctx.lineTo(cx - 5, cy + 5);
        ctx.lineTo(cx + 5, cy + 5);
        ctx.fill();
        
        // Draw Field of View (Fixed Up)
        ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, 40, -Math.PI/2 - 0.5, -Math.PI/2 + 0.5); 
        ctx.fill();

        // Draw Enemies
        enemiesRef.current.forEach(e => {
            if (e.isDead) return;
            const p = transformPoint(e.position.x, e.position.z);
            
            const vx = p.x - cx;
            const vy = p.y - cy;
            const dist = Math.hypot(vx, vy);
            
            // Check if harmless (both arms broken)
            const isHarmless = e.parts['LArm'].broken && e.parts['RArm'].broken;
            const color = isHarmless ? '#00ff00' : '#ff0000';

            if (dist < radius - 5) {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                ctx.fill();
            } else {
                const angle = Math.atan2(vy, vx);
                const edgeX = cx + Math.cos(angle) * (radius - 8);
                const edgeY = cy + Math.sin(angle) * (radius - 8);
                
                ctx.save();
                ctx.translate(edgeX, edgeY);
                ctx.rotate(angle);
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(5, 0); 
                ctx.lineTo(-4, -4);
                ctx.lineTo(-4, 4);
                ctx.fill();
                ctx.restore();
            }
        });
    }

    // 0.5 AIM ASSIST VISUALS & LOGIC
    if (aimAssistPointsRef.current) {
        aimAssistPointsRef.current.clear();
        
        let foundTarget = false;

        if (inputs.current.aim && gameStarted) {
            let closestPartDist = Infinity;
            let closestPartPos = new THREE.Vector3();
            let foundTargetId = "";
            let foundTargetPart = "";

            const camDir = new THREE.Vector3();
            state.camera.getWorldDirection(camDir);

            enemiesRef.current.forEach(e => {
                if (e.isDead) return;
                
                Object.entries(e.parts).forEach(([name, part]) => {
                    if (part.broken) return;
                    
                    const partPos = e.position.clone();
                    if (e.isCrawling) {
                        partPos.y = 0.5;
                        partPos.add(new THREE.Vector3(part.offset[0], 0, part.offset[1] ? 0 : 0).applyEuler(e.rotation));
                    } else {
                        partPos.y += part.offset[1];
                        partPos.add(new THREE.Vector3(part.offset[0], 0, part.offset[2]).applyEuler(e.rotation));
                    }

                    const dirToPart = new THREE.Vector3().subVectors(partPos, state.camera.position).normalize();
                    const angle = camDir.angleTo(dirToPart); 
                    
                    if (angle < 0.3) {
                        if (angle < closestPartDist) {
                            closestPartDist = angle;
                            closestPartPos = partPos;
                            foundTargetId = e.id;
                            foundTargetPart = name;
                        }
                    }
                });
            });

            if (closestPartPos.lengthSq() > 0) {
                 foundTarget = true;
                 lockedTargetRef.current = { id: foundTargetId, part: foundTargetPart };

                 const dotGeo = new THREE.SphereGeometry(0.08, 8, 8);
                 const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true, opacity: 0.9 });
                 const dot = new THREE.Mesh(dotGeo, dotMat);
                 dot.position.copy(closestPartPos);
                 dot.renderOrder = 999;
                 aimAssistPointsRef.current!.add(dot);

                 const m = new THREE.Matrix4().lookAt(state.camera.position, closestPartPos, new THREE.Vector3(0, 1, 0));
                 const targetQuat = new THREE.Quaternion().setFromRotationMatrix(m);
                 state.camera.quaternion.slerp(targetQuat, 0.3);
            }
        }

        if (!foundTarget) {
            lockedTargetRef.current = null;
        }
    }

    if (flashRef.current) {
        const mat = flashRef.current.material as THREE.MeshBasicMaterial;
        if (playerState.current.hitFlash > 0) {
            playerState.current.hitFlash -= delta * 3;
            mat.opacity = Math.max(0, playerState.current.hitFlash * 0.5);
        } else {
            mat.opacity = 0;
        }
    }

    // 1. PROJECTILES
    if (projectileGroupRef.current) {
        for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
            const p = projectilesRef.current[i];
            p.life -= delta;
            
            if (p.targetId) {
                const targetEnemy = enemiesRef.current.find(e => e.id === p.targetId);
                if (targetEnemy && !targetEnemy.isDead) {
                    let targetPos = targetEnemy.position.clone();
                    if (p.targetPart) {
                         const part = targetEnemy.parts[p.targetPart];
                         if (part) {
                            if (targetEnemy.isCrawling) {
                                targetPos.y = 0.5;
                                targetPos.add(new THREE.Vector3(part.offset[0], 0, part.offset[1] ? 0 : 0).applyEuler(targetEnemy.rotation));
                            } else {
                                targetPos.y += part.offset[1];
                                targetPos.add(new THREE.Vector3(part.offset[0], 0, part.offset[2]).applyEuler(targetEnemy.rotation));
                            }
                         } else {
                             targetPos.y += targetEnemy.isCrawling ? 0.5 : 1.35;
                         }
                    } else {
                         targetPos.y += targetEnemy.isCrawling ? 0.5 : 1.35;
                    }
                    
                    const desiredDir = new THREE.Vector3().subVectors(targetPos, p.position).normalize();
                    const currentDir = p.velocity.clone().normalize();
                    
                    const newDir = new THREE.Vector3().copy(currentDir).lerp(desiredDir, 0.5).normalize();
                    const currentSpeed = p.velocity.length();
                    p.velocity.copy(newDir.multiplyScalar(currentSpeed));
                }
            }

            const moveVec = p.velocity.clone().multiplyScalar(delta);
            const nextPos = p.position.clone().add(moveVec);
            
            let hit = false;
            let hitPoint = nextPos;
            
            const pBox = new THREE.Box3().setFromCenterAndSize(nextPos, new THREE.Vector3(p.radius*2, p.radius*2, p.radius*2));
            for(let box of COLLISION_BOXES) {
                if(pBox.intersectsBox(box)) { hit = true; hitPoint = nextPos; break; }
            }

            if (!hit) {
                if (p.owner === 'enemy') {
                    if (inputs.current.shield) {
                         const distToPlayer = p.position.distanceTo(camera.position);
                         if (distToPlayer < 3.0) {
                             const camDir = new THREE.Vector3();
                             camera.getWorldDirection(camDir);
                             
                             const projDir = p.velocity.clone().normalize();
                             const dot = camDir.dot(projDir); 
                             
                             if (dot < 0) {
                                 p.velocity.negate().multiplyScalar(2);
                                 p.owner = 'player';
                                 p.life = 2.0; 
                                 
                                 p.color = 0xffff00; 
                                 const mesh = projectileGroupRef.current.children.find(c => c.userData.projId === p.id);
                                 if (mesh) (mesh as THREE.Mesh).material = new THREE.MeshBasicMaterial({ color: 0xffff00 });

                                 if (p.sourceEntityId) {
                                     p.targetId = p.sourceEntityId;
                                     p.targetPart = 'Torso';
                                 }

                                 playSound('shield_hit');
                                 
                                 p.position.add(p.velocity.clone().multiplyScalar(delta));
                                 continue; 
                             }
                         }
                    }

                    const playerDist = nextPos.distanceTo(camera.position);
                    if (playerDist < 0.8) { 
                        hit = true;
                        damagePlayer(p.damage);
                    }

                } else if (p.owner === 'player') {
                    if (p.targetId) {
                        const targetEnemy = enemiesRef.current.find(e => e.id === p.targetId);
                         if (targetEnemy) {
                             let targetPos = targetEnemy.position.clone();
                             if (p.targetPart && targetEnemy.parts[p.targetPart]) {
                                 const part = targetEnemy.parts[p.targetPart];
                                 if (targetEnemy.isCrawling) {
                                     targetPos.y = 0.5;
                                     targetPos.add(new THREE.Vector3(part.offset[0], 0, part.offset[1] ? 0 : 0).applyEuler(targetEnemy.rotation));
                                 } else {
                                     targetPos.y += part.offset[1];
                                     targetPos.add(new THREE.Vector3(part.offset[0], 0, part.offset[2]).applyEuler(targetEnemy.rotation));
                                 }
                             } else {
                                targetPos.y += 1.35;
                             }
                             
                             if (nextPos.distanceTo(targetPos) < 1.0) {
                                 hit = true;
                                 hitPoint = targetPos;
                                 if (p.targetPart) {
                                     handleHit(targetEnemy.id, p.targetPart, p.damage, hitPoint, p.velocity);
                                 } else {
                                     handleHit(targetEnemy.id, 'Torso', p.damage, hitPoint, p.velocity);
                                 }
                             }
                         }
                    }

                    if (!hit) {
                        const rayDir = p.velocity.clone().normalize();
                        const rayDist = moveVec.length(); 
                        const ray = new THREE.Ray(p.position, rayDir);

                        for (const enemy of enemiesRef.current) {
                            if (enemy.isDead) continue;
                            if (p.targetId && p.targetId !== enemy.id) continue;

                            const enemyCenter = enemy.position.clone();
                            enemyCenter.y += 1.0;
                            if (enemyCenter.distanceTo(p.position) > rayDist + 3.0) continue; 

                            for (const [key, pData] of Object.entries(enemy.parts)) {
                                const part = pData as EnemyPartData;
                                if (part.broken) continue;
                                if (p.targetPart && p.targetPart !== key) continue;

                                const partPos = enemy.position.clone();
                                if (enemy.isCrawling) {
                                    partPos.y = 0.5;
                                    partPos.add(new THREE.Vector3(part.offset[0], 0, part.offset[1] ? 0 : 0).applyEuler(enemy.rotation));
                                } else {
                                    partPos.y += part.offset[1];
                                    partPos.add(new THREE.Vector3(part.offset[0], 0, part.offset[2]).applyEuler(enemy.rotation));
                                }
                                
                                const partBox = new THREE.Box3().setFromCenterAndSize(partPos, new THREE.Vector3(part.size[0], part.size[1], part.size[2]));
                                const intersection = new THREE.Vector3();
                                
                                if (ray.intersectBox(partBox, intersection)) {
                                    if (p.position.distanceTo(intersection) <= rayDist) {
                                        hit = true; 
                                        hitPoint = intersection;
                                        
                                        if (WEAPONS[p.type as WeaponType]?.explosive) {
                                            spawnExplosion(hitPoint, WEAPONS[p.type as WeaponType].radius!, WEAPONS[p.type as WeaponType].force!, p.damage);
                                        } else {
                                            handleHit(enemy.id, key, p.damage, hitPoint, p.velocity);
                                        }
                                        break; 
                                    }
                                }
                            }
                            if (hit) break; 
                        }
                    }
                }
            }

            if (hit || p.life <= 0) {
                 if (hit && p.type !== 'enemy_bullet' && WEAPONS[p.type as WeaponType]?.explosive) {
                     spawnExplosion(hitPoint, WEAPONS[p.type as WeaponType].radius!, WEAPONS[p.type as WeaponType].force!, p.damage);
                 } else if (hit) {
                     spawnParticle(hitPoint, 'spark');
                 }
                 const mesh = projectileGroupRef.current.children.find(c => c.userData.projId === p.id);
                 if (mesh) projectileGroupRef.current.remove(mesh);
                 projectilesRef.current.splice(i, 1);
            } else {
                 p.position.copy(nextPos);
                 const mesh = projectileGroupRef.current.children.find(c => c.userData.projId === p.id);
                 if (mesh) mesh.position.copy(nextPos);
            }
        }
    }

    if (debrisGroupRef.current) {
         for (let i = debrisRef.current.length - 1; i >= 0; i--) {
            const d = debrisRef.current[i];
            d.velocity.y -= PLAYER_CONFIG.gravity * delta;
            d.position.add(d.velocity.clone().multiplyScalar(delta));
            d.rotation.x += d.rotVelocity.x * delta;
            d.rotation.y += d.rotVelocity.y * delta;
            
            let groundY = 0;
            if (d.position.y > 10 && d.position.y < 14) groundY = 12;
            if (d.position.y > 22) groundY = 24;
            
            if (d.position.y < groundY + d.size[1]/2) {
                d.position.y = groundY + d.size[1]/2;
                d.velocity.y *= -0.5; d.velocity.x *= 0.8; d.velocity.z *= 0.8; d.rotVelocity.multiplyScalar(0.8);
            }
            const mesh = debrisGroupRef.current.children.find(c => c.userData.debrisId === d.id);
            if(mesh) { mesh.position.copy(d.position); mesh.rotation.copy(d.rotation); }
            if (d.position.y < -50) { if(mesh) debrisGroupRef.current.remove(mesh); debrisRef.current.splice(i, 1); }
        }
    }

    const ps = playerState.current;
    
    ps.inUpdraft = false;
    for (const u of UPDRAFTS) {
        const distToUpdraft = Math.hypot(camera.position.x - u.x, camera.position.z - u.z);
        if (distToUpdraft < u.radius) {
            ps.inUpdraft = true;
            break;
        }
    }

    ps.velocity.y -= PLAYER_CONFIG.gravity * delta;
    
    const moveMult = (inputs.current.aim || inputs.current.shield) ? 0.5 : 1.0;
    const speed = (inputs.current.f && !inputs.current.b ? PLAYER_CONFIG.runSpeed : PLAYER_CONFIG.speed) * moveMult;
    
    const direction = new THREE.Vector3(Number(inputs.current.r)-Number(inputs.current.l), 0, Number(inputs.current.f)-Number(inputs.current.b));
    direction.normalize();
    if(direction.length()>0) {
        const camDir = new THREE.Vector3(); camera.getWorldDirection(camDir); camDir.y=0; camDir.normalize();
        const camRight = new THREE.Vector3(-camDir.z, 0, camDir.x);
        const move = new THREE.Vector3().addScaledVector(camDir, direction.z).addScaledVector(camRight, direction.x);
        ps.velocity.x += (move.x*speed*8 - ps.velocity.x) * 10 * delta;
        ps.velocity.z += (move.z*speed*8 - ps.velocity.z) * 10 * delta;
    } else {
        ps.velocity.x -= ps.velocity.x * 10 * delta;
        ps.velocity.z -= ps.velocity.z * 10 * delta;
    }

    if (inputs.current.jump) {
        if (ps.inUpdraft && !ps.hasUsedUpdraft) { 
            ps.velocity.y = 45.0; 
            playSound('jump_pad'); 
            inputs.current.jump = false; 
            ps.hasUsedUpdraft = true; 
        }
        else if (ps.onGround) { 
            ps.velocity.y = PLAYER_CONFIG.jumpForce; 
            ps.onGround = false; 
        }
    }

    const nextP = camera.position.clone().add(ps.velocity.clone().multiplyScalar(delta));
    const checkCol = (pos: THREE.Vector3) => {
        const box = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(pos.x, pos.y-0.75, pos.z), new THREE.Vector3(0.6, 1.7, 0.6));
        return COLLISION_BOXES.some(b => b.intersectsBox(box));
    };

    ps.onGround = false;
    if (checkCol(new THREE.Vector3(camera.position.x, nextP.y, camera.position.z))) {
        if(ps.velocity.y < 0) { 
            ps.onGround = true; 
            ps.velocity.y = 0; 
            ps.hasUsedUpdraft = false; 
        }
        else { ps.velocity.y = 0; }
    } else { camera.position.y = nextP.y; }

    if(!checkCol(new THREE.Vector3(nextP.x, camera.position.y, camera.position.z))) camera.position.x = nextP.x;
    else ps.velocity.x = 0;
    if(!checkCol(new THREE.Vector3(camera.position.x, camera.position.y, nextP.z))) camera.position.z = nextP.z;
    else ps.velocity.z = 0;
    if(camera.position.y < -10) { camera.position.set(0, 5, 0); ps.velocity.set(0,0,0); damagePlayer(100); }

    if (inputs.current.fire && gameStarted) fireWeapon();

    enemiesRef.current.forEach(e => {
        if(e.isDead) return;

        // Check Enemy Reload Timer
        if (e.isReloading) {
            if (now >= e.reloadFinishTime) {
                e.isReloading = false;
                const wConfig = ENEMY_WEAPONS[e.weaponType];
                e.ammo = wConfig.magSize;
            }
        }

        e.velocity.y -= PLAYER_CONFIG.gravity * delta;
        
        let groundY = 0;
        for (const p of MAP_BOUNDS.platforms) {
             const halfW = p.w / 2;
             const halfD = p.d / 2;
             if (e.position.x >= p.x - halfW && e.position.x <= p.x + halfW &&
                 e.position.z >= p.z - halfD && e.position.z <= p.z + halfD) {
                 const surfaceY = p.y + p.h / 2;
                 if (e.position.y >= surfaceY - 1.0) {
                     if (surfaceY > groundY) groundY = surfaceY;
                 }
             }
        }
        if (Math.abs(e.position.x) > 50 || Math.abs(e.position.z) > 50) groundY = -100;

        let inUpdraft = false;
        if (e.aiState === 'seek_updraft') {
            const nearest = findNearestUpdraft(e.position);
            if (nearest) {
                const dist2 = Math.hypot(e.position.x - nearest.x, e.position.z - nearest.z);
                if (dist2 < nearest.radius) {
                    e.velocity.y += 60.0 * delta; 
                    inUpdraft = true;
                    const dirToPlayer = new THREE.Vector3().subVectors(camera.position, e.position);
                    dirToPlayer.y = 0; 
                    dirToPlayer.normalize();
                    e.position.add(dirToPlayer.multiplyScalar(e.speed * 2.0 * delta));

                    if (e.position.y > camera.position.y + 2) e.aiState = 'chase'; 
                }
            }
        }

        const nextY = e.position.y + e.velocity.y * delta;
        if (!inUpdraft && nextY < groundY) {
            e.position.y = groundY;
            e.velocity.y = 0;
        } else {
            e.position.y = nextY;
        }

        e.position.add(new THREE.Vector3(e.velocity.x*delta, 0, e.velocity.z*delta));
        e.velocity.x *= 0.9;
        e.velocity.z *= 0.9;

        const dist = e.position.distanceTo(camera.position);

        // Goal 1: Aggressive AI Behavior (Tweaked for more shooting)
        if (now - e.tacticalTimer > ENEMY_CONFIG.decisionRate) {
            e.tacticalTimer = now;
            const healthPct = e.parts['Torso'].hp / e.parts['Torso'].maxHp;

            // Priority 1: Updrafts
            if (camera.position.y > e.position.y + 5.0) {
                 e.aiState = 'seek_updraft';
            } 
            // Priority 2: Health Critical -> Less probability to hide than before, stay fighting
            else if (healthPct < 0.2) {
                 if (e.aiState !== 'tactical_cover' && Math.random() > 0.5) {
                     e.aiState = 'tactical_cover';
                     e.targetPos = getCoverPosition(e.position, camera.position);
                 }
            }
            // Priority 3: Tactical Combat
            else if (dist > 15) {
                const rand = Math.random();
                const eyePos = e.position.clone().add(new THREE.Vector3(0, 1.6, 0));
                
                if (rand < 0.15 && hasLineOfSight(eyePos, camera.position)) {
                     // Reduced cover chance (was 0.3)
                     e.aiState = 'tactical_cover';
                     e.targetPos = getCoverPosition(e.position, camera.position);
                } else if (rand < 0.4) {
                     // Reduced flank chance (was 0.6)
                     e.aiState = 'flank';
                } else {
                    // Increased Chase/Suppress chance (now 60%)
                    e.aiState = 'chase';
                }
            }
            else {
                e.aiState = 'chase';
            }
        }

        let moveDir = new THREE.Vector3();

        if (e.velocity.length() < 2.0) {
            if (e.aiState === 'seek_updraft') {
                 const nearest = findNearestUpdraft(e.position);
                 if (nearest) {
                     moveDir.set(nearest.x - e.position.x, 0, nearest.z - e.position.z).normalize();
                 }
            } else if (e.aiState === 'tactical_cover') {
                 moveDir.subVectors(e.targetPos, e.position).normalize();
            } else if (e.aiState === 'flank') {
                 // Move perpendicular to player direction
                 const toPlayer = new THREE.Vector3().subVectors(camera.position, e.position).normalize();
                 moveDir.crossVectors(toPlayer, new THREE.Vector3(0,1,0)).normalize();
                 // Oscillate direction based on ID
                 if (parseInt(e.id.substring(0,1), 36) % 2 === 0) moveDir.negate();
            } else {
                if (dist > ENEMY_CONFIG.meleeRange) {
                    moveDir.subVectors(camera.position, e.position).normalize();
                    if (dist < 30) {
                        // Check side movement using eye pos for LoS? No, movement doesn't use LoS strictly.
                        // But let's check LoS for strafing logic properly
                         const eyePos = e.position.clone().add(new THREE.Vector3(0, 1.6, 0));
                         if (hasLineOfSight(eyePos, camera.position)) {
                             const side = new THREE.Vector3(-moveDir.z, 0, moveDir.x);
                             if (Math.sin(now * 0.002 + parseFloat(e.id)) > 0) side.negate();
                             moveDir.add(side.multiplyScalar(0.5)).normalize();
                         }
                    }
                } else if (!e.parts['LArm'].broken) {
                    moveDir.subVectors(camera.position, e.position).normalize();
                }
            }

            const speed = e.speed * (e.aiState === 'seek_updraft' ? 1.5 : 1.0); 
            e.position.x += moveDir.x * speed * delta;
            e.position.z += moveDir.z * speed * delta;
            
            if (Math.abs(e.position.x) > 48) e.position.x = Math.sign(e.position.x) * 48;
            if (Math.abs(e.position.z) > 48) e.position.z = Math.sign(e.position.z) * 48;
        }

        const targetX = camera.position.x;
        const targetZ = camera.position.z;
        const dx = targetX - e.position.x;
        const dz = targetZ - e.position.z;
        const angle = Math.atan2(dx, dz); 
        e.rotation.set(0, angle, 0);

        // Goal 3: Strict Melee Check
        if (dist < ENEMY_CONFIG.meleeRange && !e.parts['LArm'].broken) {
            if (now - e.lastMeleeTime > ENEMY_CONFIG.meleeRate) {
                e.lastMeleeTime = now;
                let blocked = false;
                if (inputs.current.shield) {
                    const camDir = new THREE.Vector3();
                    camera.getWorldDirection(camDir);
                    const enemyDir = new THREE.Vector3().subVectors(e.position, camera.position).normalize();
                    if (camDir.dot(enemyDir) > 0.5) blocked = true;
                }
                if (blocked) playSound('block');
                else {
                    playSound('knife_hit');
                    damagePlayer(ENEMY_CONFIG.meleeDamage);
                    onMsg("受到匕首重击!");
                }
            }
        } else {
             // Goal 3: Faster Shooting Rate
             const wConfig = ENEMY_WEAPONS[e.weaponType];
             const canShoot = !e.parts['RArm'].broken && dist < wConfig.range && (now - e.lastAttackTime > wConfig.rate);
             
             if (canShoot) {
                 // Check Line of Sight from EYE HEIGHT
                 const eyePos = e.position.clone().add(new THREE.Vector3(0, 1.6, 0));
                 // Aim at player's chest (camera - 0.2) to be safe
                 const playerChest = camera.position.clone().add(new THREE.Vector3(0, -0.2, 0));
                 
                 if (hasLineOfSight(eyePos, playerChest)) {
                    e.lastAttackTime = now;
                    enemyFire(e);
                 }
             }
        }
    });

    if (particleGroupRef.current) {
        for(let i=particlesRef.current.length-1; i>=0; i--) {
            const p = particlesRef.current[i];
            p.life -= delta;
            p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));
            if(p.life <= 0) { particleGroupRef.current.remove(p.mesh); particlesRef.current.splice(i, 1); }
        }
    }

    if (weaponGroupRef.current) {
        weaponGroupRef.current.position.copy(camera.position);
        weaponGroupRef.current.rotation.copy(camera.rotation);
        if (playerState.current.recoil > 0) playerState.current.recoil -= delta * 5;
        weaponGroupRef.current.translateZ(Math.max(0, playerState.current.recoil) * 0.2);
    }
  });

  return (
    <>
        <ambientLight intensity={0.8} />
        <directionalLight position={[50, 100, 50]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
        <Environment preset="night" />
        <fog attach="fog" args={['#222', 0, 90]} />

        <PointerLockControls onLock={() => onLockedChange(true)} onUnlock={() => onLockedChange(false)} />
        
        <mesh ref={flashRef} position={[0, 0, -1]}>
             <planeGeometry args={[100, 100]} />
             <meshBasicMaterial color="red" transparent opacity={0} depthTest={false} />
        </mesh>

        <Level />
        
        {enemiesRef.current.map(e => <Enemy key={e.id} data={e} />)}

        <group ref={aimAssistPointsRef} />

        <group ref={projectileGroupRef} />
        <group ref={debrisGroupRef} />
        <group ref={particleGroupRef} />

        <group ref={weaponGroupRef}>
           <WeaponModel 
                type={activeWeapon} 
                inputs={inputs}
                recoilAmount={0.2} 
           />
        </group>
    </>
  );
};

export default GameScene;
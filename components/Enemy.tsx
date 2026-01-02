import React, { useMemo, useRef } from 'react';
import { EnemyData } from '../types';
import { ENEMY_PARTS_CONFIG } from '../constants';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface EnemyProps {
  data: EnemyData;
}

const Enemy: React.FC<EnemyProps> = ({ data }) => {
  const groupRef = useRef<THREE.Group>(null);
  const hpBarRef = useRef<THREE.Group>(null);
  const hpMeshRef = useRef<THREE.Mesh>(null);
  
  // Materials
  const matSkin = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xaa5555 }), []);
  const matCore = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x333333 }), []);
  const matHpBg = useMemo(() => new THREE.MeshBasicMaterial({ color: 0x000000 }), []);
  const matHpFg = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xff0000 }), []);
  const matGun = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x222222 }), []);
  const matLaserGun = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xeeeeee, emissive: 0x00ffff, emissiveIntensity: 0.5 }), []);
  const matFlameGun = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x552200, roughness: 0.8 }), []);
  
  const matKnifeHandle = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x111111 }), []);
  const matKnifeBlade = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.8, roughness: 0.2, emissive: 0x550000 }), []);

  useFrame((state) => {
    if (groupRef.current) {
        // Base Position syncing
        groupRef.current.position.copy(data.position);
        
        // --- CRAWLING / DYING PHYSICS ANIMATION ---
        if (data.isCrawling) {
            const q = new THREE.Quaternion();
            q.setFromEuler(new THREE.Euler(-Math.PI / 2, data.rotation.y, 0));
            groupRef.current.quaternion.copy(q);
            groupRef.current.position.y = 0.3; 
        } else {
            groupRef.current.rotation.copy(data.rotation);
        }

        // --- PROCEDURAL ANIMATION ---
        const time = state.clock.elapsedTime * data.speed * 3;
        
        groupRef.current.children.forEach((child) => {
           const partName = child.userData.partName;
           if (!partName) return;

           const part = data.parts[partName];
           if (part && part.broken) {
              child.visible = false;
              return;
           }
           child.visible = true;

           // WALKING ANIMATION
           if (!data.isCrawling) {
               if (partName === 'LLeg') {
                   child.rotation.x = Math.sin(time) * 0.5;
               } else if (partName === 'RLeg') {
                   child.rotation.x = Math.sin(time + Math.PI) * 0.5;
               } else if (partName === 'LArm') {
                   // Goal 5: Aggressive Knife Swing only if attacking melee
                   // We don't have isAttackingMelee flag directly but can infer if close
                   child.rotation.x = Math.sin(time * 2) * 0.5 - 0.5; 
                   child.rotation.z = 0.2;
               } else if (partName === 'RArm') {
                   // Aiming gun
                   child.rotation.x = -Math.PI / 2 + Math.sin(time * 2) * 0.05; 
               }
           } 
           // CRAWLING ANIMATION
           else {
                if (partName === 'LArm') {
                   child.rotation.x = Math.sin(time * 2) * 0.8;
                } else if (partName === 'RArm') {
                   child.rotation.x = Math.sin(time * 2 + Math.PI) * 0.8;
                }
           }
        });
    }

    // Update HP Bar
    if (hpBarRef.current && hpMeshRef.current) {
        hpBarRef.current.position.set(0, data.isCrawling ? 1.0 : 2.6, 0);
        hpBarRef.current.lookAt(state.camera.position);
        
        const torso = data.parts['Torso'];
        const hpPercent = Math.max(0, torso.hp / torso.maxHp);
        hpMeshRef.current.scale.x = hpPercent;
        hpMeshRef.current.position.x = (hpPercent - 1) * 0.5; 
        hpBarRef.current.visible = !data.isDead;
    }
  });

  const renderWeapon = () => {
      switch(data.weaponType) {
          case 'laser':
              return (
                <group position={[0.2, -0.4, 0.4]}>
                    <mesh material={matLaserGun}><boxGeometry args={[0.08, 0.1, 0.6]} /></mesh>
                    <mesh position={[0, 0, 0.35]} rotation={[Math.PI/2,0,0]} material={new THREE.MeshBasicMaterial({color: 0x00ffff})}><cylinderGeometry args={[0.01, 0.01, 0.2]} /></mesh>
                </group>
              );
          case 'flamethrower':
              return (
                 <group position={[0.2, -0.4, 0.4]}>
                    <mesh rotation={[Math.PI/2,0,0]} material={matFlameGun}><cylinderGeometry args={[0.08, 0.1, 0.5]} /></mesh>
                    <mesh position={[0.1, 0, 0]} material={new THREE.MeshStandardMaterial({color: 0xff4400})}><boxGeometry args={[0.1, 0.15, 0.4]} /></mesh>
                </group>
              );
          case 'shotgun':
              return (
                <group position={[0.2, -0.4, 0.4]}>
                    <mesh material={matGun}><boxGeometry args={[0.08, 0.12, 0.4]} /></mesh>
                    <mesh position={[0, 0.04, 0.2]} rotation={[Math.PI/2,0,0]} material={new THREE.MeshStandardMaterial({color: 0x111111})}><cylinderGeometry args={[0.03, 0.03, 0.4]} /></mesh>
                    <mesh position={[0, -0.02, 0.2]} rotation={[Math.PI/2,0,0]} material={new THREE.MeshStandardMaterial({color: 0x111111})}><cylinderGeometry args={[0.03, 0.03, 0.4]} /></mesh>
                </group>
              );
          case 'rifle':
          default:
              return (
                <mesh position={[0.2, -0.4, 0.4]} rotation={[0,0,0]} material={matGun}>
                    <boxGeometry args={[0.1, 0.1, 0.5]} />
                </mesh>
              );
      }
  };

  return (
    <group ref={groupRef}>
      {Object.entries(ENEMY_PARTS_CONFIG).map(([key, cfg]: [string, any]) => (
          <mesh
            key={key}
            position={cfg.offset}
            castShadow
            receiveShadow
            userData={{ type: 'enemy', enemyId: data.id, partName: key }}
          >
            <boxGeometry args={cfg.size} />
            <primitive object={key==='Head'||key.includes('Arm') ? matSkin : matCore} attach="material" />
            
            {/* Right Arm: Gun */}
            {key === 'RArm' && renderWeapon()}

            {/* Left Arm: Knife */}
            {key === 'LArm' && (
                <group position={[-0.2, -0.45, 0.4]} rotation={[Math.PI/2, 0, -0.5]}>
                    {/* Handle */}
                    <mesh material={matKnifeHandle}>
                        <cylinderGeometry args={[0.03, 0.04, 0.2]} />
                    </mesh>
                    {/* Blade */}
                    <mesh position={[0, 0.25, 0]} material={matKnifeBlade}>
                        <boxGeometry args={[0.08, 0.35, 0.02]} />
                    </mesh>
                </group>
            )}
          </mesh>
      ))}

      <group ref={hpBarRef}>
        <mesh>
          <planeGeometry args={[1, 0.1]} />
          <primitive object={matHpBg} attach="material" />
        </mesh>
        <mesh ref={hpMeshRef} position={[0, 0, 0.01]}>
          <planeGeometry args={[1, 0.1]} />
          <primitive object={matHpFg} attach="material" />
        </mesh>
      </group>
    </group>
  );
};

export default Enemy;
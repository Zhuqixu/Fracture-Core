import React, { useRef } from 'react';
import { WeaponType, InputState } from '../types';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface WeaponModelProps {
  type: WeaponType;
  inputs: React.MutableRefObject<InputState>;
  recoilAmount: number;
}

const WeaponModel: React.FC<WeaponModelProps> = ({ type, inputs, recoilAmount }) => {
  const groupRef = useRef<THREE.Group>(null);
  const shieldRef = useRef<THREE.Group>(null);
  
  // Materials
  const matBlack = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.6 });
  const matGrey = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.4, metalness: 0.7 });
  const matWood = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
  const matGreen = new THREE.MeshStandardMaterial({ color: 0x3d4b3d, roughness: 0.8 });
  const matScopeLens = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.1, metalness: 0.9 });
  
  // Goal 6: Riot Shield Glass Material (Polycarbonate)
  const matShieldGlass = new THREE.MeshPhysicalMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.15, // Very transparent
      transmission: 0.95, // Glass effect
      roughness: 0.05,
      metalness: 0.1,
      ior: 1.5,
      thickness: 0.1,
      side: THREE.DoubleSide
  });
  // Dark Frame for shield
  const matShieldFrame = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 });
  // Viewport/Text decal
  const matShieldDecal = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.5 });

  useFrame((state, delta) => {
    const { aim, fire, shield } = inputs.current;

    if (groupRef.current) {
        // Aiming Logic
        const targetPos = aim 
            ? new THREE.Vector3(0, -0.24, -0.4) 
            : new THREE.Vector3(0.4, -0.4, -0.6);
        
        const recoilZ = fire ? recoilAmount : 0;
        targetPos.z += recoilZ;

        groupRef.current.position.lerp(targetPos, delta * 15);
    }

    if (shieldRef.current) {
        // Shield animation
        // Position: Front and center when active
        const targetPos = shield 
            ? new THREE.Vector3(0, -0.1, -0.5) 
            : new THREE.Vector3(-0.5, -2.0, -0.5); 
            
        const targetRot = shield
            ? new THREE.Euler(0, 0, 0)
            : new THREE.Euler(0, 0, -0.5);

        shieldRef.current.position.lerp(targetPos, delta * 15);
        shieldRef.current.rotation.z = THREE.MathUtils.lerp(shieldRef.current.rotation.z, targetRot.z, delta * 10);
    }
  });

  const renderRifle = () => (
      <group>
          <mesh material={matBlack} position={[0, 0, 0]}><boxGeometry args={[0.1, 0.15, 0.6]} /></mesh>
          <mesh material={matGrey} position={[0, 0.05, -0.5]} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.02, 0.02, 0.6]} /></mesh>
          <mesh material={matBlack} position={[0, 0, -0.35]}><boxGeometry args={[0.11, 0.12, 0.3]} /></mesh>
          <mesh material={matGrey} position={[0, -0.15, 0.1]} rotation={[0.2, 0, 0]}><boxGeometry args={[0.08, 0.25, 0.1]} /></mesh>
          <mesh material={matBlack} position={[0, -0.05, 0.45]}><boxGeometry args={[0.08, 0.18, 0.3]} /></mesh>
          <mesh material={matBlack} position={[0, 0.1, 0.2]}><boxGeometry args={[0.04, 0.04, 0.1]} /></mesh>
          <mesh material={matBlack} position={[0, 0.1, -0.45]}><boxGeometry args={[0.02, 0.04, 0.02]} /></mesh>
      </group>
  );

  const renderSniper = () => (
      <group>
          <mesh material={matGreen} position={[0, 0, 0.1]}><boxGeometry args={[0.1, 0.12, 0.7]} /></mesh>
          <mesh material={matBlack} position={[0, 0.03, -0.6]} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.025, 0.03, 1.2]} /></mesh>
          <mesh material={matGrey} position={[0, 0.03, -1.2]} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.04, 0.04, 0.1]} /></mesh>
          <group position={[0, 0.12, 0.1]}>
              <mesh material={matBlack} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.035, 0.04, 0.5]} /></mesh>
              <mesh material={matScopeLens} position={[0, 0, -0.25]} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.03, 0.03, 0.01]} /></mesh>
          </group>
          <mesh material={matGrey} position={[0.08, 0.05, 0.2]}><boxGeometry args={[0.08, 0.02, 0.02]} /></mesh>
          <mesh material={matGreen} position={[0, -0.05, 0.6]}><boxGeometry args={[0.08, 0.15, 0.4]} /></mesh>
      </group>
  );

  const renderSMG = () => (
      <group>
          <mesh material={matBlack} position={[0, 0, 0]}><boxGeometry args={[0.12, 0.15, 0.4]} /></mesh>
          <mesh material={matGrey} position={[0, 0.02, -0.3]} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.025, 0.025, 0.3]} /></mesh>
          <mesh material={matGrey} position={[-0.15, 0.02, 0]} rotation={[0, 0, 1.5]}><boxGeometry args={[0.08, 0.3, 0.1]} /></mesh>
          <mesh material={matGrey} position={[0, 0.05, 0.35]}><boxGeometry args={[0.14, 0.02, 0.3]} /></mesh>
      </group>
  );

  const renderRPG = () => (
      <group position={[0.1, 0, 0]}> 
          <mesh material={matGreen} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.08, 0.08, 1.2]} /></mesh>
          <mesh material={matWood} position={[0, 0, 0.1]} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.085, 0.085, 0.4]} /></mesh>
          <group position={[0, 0, -0.7]}>
              <mesh material={matGreen} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.04, 0.12, 0.2]} /></mesh>
              <mesh material={matGreen} position={[0, 0, -0.2]} rotation={[Math.PI/2, 0, 0]}><coneGeometry args={[0.12, 0.3, 16]} /></mesh>
          </group>
          <mesh material={matBlack} position={[-0.05, 0.12, -0.4]}><boxGeometry args={[0.02, 0.1, 0.05]} /></mesh>
      </group>
  );

  const renderShield = () => (
      <group>
          {/* Main Glass Panel (Curved approx via scale or just flat) */}
          <mesh material={matShieldGlass}>
              <boxGeometry args={[0.7, 1.1, 0.02]} />
          </mesh>
          
          {/* Frame */}
          <mesh material={matShieldFrame} position={[0, 0.55, 0]}><boxGeometry args={[0.72, 0.02, 0.04]} /></mesh>
          <mesh material={matShieldFrame} position={[0, -0.55, 0]}><boxGeometry args={[0.72, 0.02, 0.04]} /></mesh>
          <mesh material={matShieldFrame} position={[-0.35, 0, 0]}><boxGeometry args={[0.02, 1.1, 0.04]} /></mesh>
          <mesh material={matShieldFrame} position={[0.35, 0, 0]}><boxGeometry args={[0.02, 1.1, 0.04]} /></mesh>

          {/* Handle */}
          <mesh material={matBlack} position={[0, 0, 0.1]} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.1, 0.1, 0.15, 16]} /></mesh>

          {/* "POLICE" or Decal Text strip */}
          <mesh material={matShieldDecal} position={[0, 0.3, 0.015]}>
              <planeGeometry args={[0.4, 0.1]} />
          </mesh>
      </group>
  );

  return (
    <group>
        <group ref={groupRef}>
          {type === 'rifle' && renderRifle()}
          {type === 'sniper' && renderSniper()}
          {type === 'smg' && renderSMG()}
          {type === 'rpg' && renderRPG()}
        </group>
        
        <group ref={shieldRef}>
            {renderShield()}
        </group>
    </group>
  );
};

export default WeaponModel;
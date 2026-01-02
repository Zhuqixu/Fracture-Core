import React, { useRef } from 'react';
import { MAP_BOUNDS, UPDRAFTS } from '../constants';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

const Level: React.FC = () => {
  const matFloor = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
  const matPlatform = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.3 });
  const matWall = new THREE.MeshStandardMaterial({ color: 0xa0a090, roughness: 0.6 });
  const matObstacle = new THREE.MeshStandardMaterial({ color: 0x805040, roughness: 0.7 });
  
  const updraftsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (updraftsRef.current) {
        updraftsRef.current.children.forEach((group, i) => {
             // Animate each updraft
             group.rotation.y += 0.02 * (i % 2 === 0 ? 1 : -1);
             const s = 1 + Math.sin(state.clock.elapsedTime * 3 + i) * 0.05;
             group.scale.set(s, 1, s);
        });
    }
  });

  return (
    <group>
      {/* Floor 0 */}
      <mesh 
        position={[MAP_BOUNDS.floor.x, MAP_BOUNDS.floor.y, MAP_BOUNDS.floor.z]} 
        receiveShadow
      >
        <boxGeometry args={[MAP_BOUNDS.floor.w, MAP_BOUNDS.floor.h, MAP_BOUNDS.floor.d]} />
        <primitive object={matFloor} attach="material" />
      </mesh>

      <gridHelper args={[100, 50, 0x444444, 0x222222]} position={[0, 0.01, 0]} />

      {/* Platforms (Layers 1 & 2) */}
      {MAP_BOUNDS.platforms.map((p, idx) => (
         <mesh key={`plat-${idx}`} position={[p.x, p.y, p.z]} castShadow receiveShadow>
             <boxGeometry args={[p.w, p.h, p.d]} />
             <primitive object={matPlatform} attach="material" />
             {/* Goal 1: Removed the flickering stripe mesh that caused z-fighting on platform bottoms */}
         </mesh>
      ))}

      {/* Walls & Structures */}
      {MAP_BOUNDS.walls.map((w, idx) => (
        <mesh 
          key={`wall-${idx}`} 
          position={[w.x, w.y, w.z]} 
          castShadow 
          receiveShadow
        >
          <boxGeometry args={[w.w, w.h, w.d]} />
          <primitive object={w.y > 10 ? matObstacle : matWall} attach="material" />
        </mesh>
      ))}

      {/* Multiple Updrafts */}
      <group ref={updraftsRef}>
          {UPDRAFTS.map((u, i) => (
              <group key={`up-${i}`} position={[u.x, u.visualHeight/2, u.z]}>
                  <mesh>
                    <cylinderGeometry args={[u.radius, u.radius, u.visualHeight, 16, 1, true]} />
                    <meshBasicMaterial color={0x00ffff} transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
                </mesh>
                <mesh>
                    <cylinderGeometry args={[u.radius * 0.8, u.radius * 0.8, u.visualHeight, 8, 1, true]} />
                    <meshBasicMaterial color={0xaaffff} wireframe transparent opacity={0.1} />
                </mesh>
              </group>
          ))}
      </group>

    </group>
  );
};

export default Level;
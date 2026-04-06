/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Outlines } from '@react-three/drei';
import { useStore } from '../../store';
import { LANE_WIDTH } from '../../types';

const StarField: React.FC = () => {
    const speed = useStore(state => state.speed);
    const count = 3000; // Increased star count for better density
    const meshRef = useRef<THREE.Points>(null);

    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            let x = (Math.random() - 0.5) * 400;
            let y = (Math.random() - 0.5) * 200 + 50; // Keep mostly above horizon

            // Distribute Z randomly along the entire travel path plus buffer
            // Range: -550 to 100 to ensure full coverage from start
            let z = -550 + Math.random() * 650;

            // Exclude stars from the central play area
            if (Math.abs(x) < 15 && y > -5 && y < 20) {
                if (x < 0) x -= 15;
                else x += 15;
            }

            pos[i * 3] = x;
            pos[i * 3 + 1] = y;
            pos[i * 3 + 2] = z;
        }
        return pos;
    }, []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
        const activeSpeed = speed > 0 ? speed : 2; // Always move slightly even when stopped

        for (let i = 0; i < count; i++) {
            let z = positions[i * 3 + 2];
            z += activeSpeed * delta * 2.0; // Parallax effect

            // Reset when it passes the camera (z > 100 gives plenty of buffer behind camera)
            if (z > 100) {
                // Reset far back with a random buffer to prevent "walls" of stars
                z = -550 - Math.random() * 50;

                // Re-randomize X/Y on respawn with exclusion logic
                let x = (Math.random() - 0.5) * 400;
                let y = (Math.random() - 0.5) * 200 + 50;

                if (Math.abs(x) < 15 && y > -5 && y < 20) {
                    if (x < 0) x -= 15;
                    else x += 15;
                }

                positions[i * 3] = x;
                positions[i * 3 + 1] = y;
            }
            positions[i * 3 + 2] = z;
        }
        meshRef.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={meshRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={1.5}
                color="#00ffcc"
                transparent={false}
                sizeAttenuation
            />
        </points>
    );
};

const LaneGuides: React.FC = () => {
    const { laneCount } = useStore();

    const separators = useMemo(() => {
        const lines: number[] = [];
        const startX = -(laneCount * LANE_WIDTH) / 2;

        for (let i = 0; i <= laneCount; i++) {
            lines.push(startX + (i * LANE_WIDTH));
        }
        return lines;
    }, [laneCount]);

    return (
        <group position={[0, 0.02, 0]}>
            {/* Lane Floor - Concrete color */}
            <mesh position={[0, -0.02, -20]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[laneCount * LANE_WIDTH, 200]} />
                <meshBasicMaterial color="#222222" />
            </mesh>

            {/* Lane Separators - Solid Yellow Paint */}
            {separators.map((x, i) => (
                <mesh key={`sep-${i}`} position={[x, 0, -20]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[0.15, 200]} />
                    <meshBasicMaterial color="#ffff00" />
                </mesh>
            ))}
        </group>
    );
};

const UrbanSculpture: React.FC = () => {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.position.y = 30 + Math.sin(state.clock.elapsedTime * 0.2) * 5.0;
            groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
            groupRef.current.rotation.x = state.clock.elapsedTime * 0.1;
        }
    });

    return (
        <group ref={groupRef} position={[0, 30, -180]}>
            <mesh>
                <icosahedronGeometry args={[25, 0]} />
                <meshToonMaterial color="#ff0055" />
                <Outlines thickness={0.04} color="black" />
            </mesh>
            <mesh position={[30, -10, 20]}>
                <boxGeometry args={[15, 15, 15]} />
                <meshToonMaterial color="#00ffcc" />
                <Outlines thickness={0.04} color="black" />
            </mesh>
            <mesh position={[-20, 25, 10]}>
                <torusGeometry args={[12, 3, 16, 100]} />
                <meshToonMaterial color="#ffff00" />
                <Outlines thickness={0.04} color="black" />
            </mesh>
        </group>
    );
};

const MovingGrid: React.FC = () => {
    const speed = useStore(state => state.speed);
    const meshRef = useRef<THREE.Mesh>(null);
    const offsetRef = useRef(0);

    useFrame((state, delta) => {
        if (meshRef.current) {
            const activeSpeed = speed > 0 ? speed : 5;
            offsetRef.current += activeSpeed * delta;

            // Grid cell size = 400 (length) / 40 (segments) = 10 units
            const cellSize = 10;

            // Move mesh forward (+Z) to simulate travel, then snap back
            const zPos = -100 + (offsetRef.current % cellSize);
            meshRef.current.position.z = zPos;
        }
    });

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, -100]}>
            <planeGeometry args={[300, 400, 10, 10]} />
            <meshBasicMaterial
                color="#333333"
            />
        </mesh>
    );
};

export const Environment: React.FC = () => {
    return (
        <>
            <color attach="background" args={['#2a2b2e']} />
            <fog attach="fog" args={['#2a2b2e', 40, 160]} />

            <ambientLight intensity={0.6} color="#ffffff" />
            <directionalLight position={[0, 20, -10]} intensity={1.5} color="#ffffff" />
            <pointLight position={[0, 25, -150]} intensity={3} color="#ffffff" distance={200} decay={1} />

            <StarField />
            <MovingGrid />
            <LaneGuides />

            <UrbanSculpture />
        </>
    );
};

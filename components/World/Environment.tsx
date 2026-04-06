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

const AmbientDoodles: React.FC = () => {
    const speed = useStore(state => state.speed);
    const groupRef = useRef<THREE.Group>(null);
    const items = useMemo(() => {
        return Array.from({ length: 50 }).map(() => ({
            x: (Math.random() - 0.5) * 150,
            y: Math.random() * 80,
            z: Math.random() * -300,
            rotSpeed: (Math.random() - 0.5) * 5,
            scale: 0.8 + Math.random() * 1.5,
            type: Math.floor(Math.random() * 3)
        }));
    }, []);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const activeSpeed = speed > 0 ? speed : 2;
        groupRef.current.children.forEach((child, i) => {
            const item = items[i];
            child.position.z += activeSpeed * delta * 2.0;
            child.rotation.x += item.rotSpeed * delta;
            child.rotation.y += item.rotSpeed * delta;

            const time = state.clock.elapsedTime;
            const bounce = 1 + Math.sin(time * 4 + i) * 0.15;
            child.scale.set(item.scale * bounce, item.scale * (1 + Math.sin(time * 5 + i) * 0.15), item.scale * bounce);

            if (child.position.z > 50) {
                child.position.z = -300 - Math.random() * 100;
                // Exclude central lane path for nice framing
                let nextX = (Math.random() - 0.5) * 150;
                if (Math.abs(nextX) < 15) {
                    nextX = nextX < 0 ? nextX - 15 : nextX + 15;
                }
                child.position.x = nextX;
                child.position.y = Math.random() * 80;
            }
        });
    });

    return (
        <group ref={groupRef}>
            {items.map((item, i) => (
                <mesh key={i} position={[item.x, item.y, item.z]}>
                    {item.type === 0 && <torusGeometry args={[1.5, 0.5, 6, 8]} />}
                    {item.type === 1 && <boxGeometry args={[2, 2, 2]} />}
                    {item.type === 2 && <octahedronGeometry args={[2, 0]} />}
                    <meshToonMaterial color={item.type === 0 ? "#ff0055" : item.type === 1 ? "#00ffcc" : "#ffff00"} />
                    <Outlines thickness={0.1} color="black" />
                </mesh>
            ))}
        </group>
    );
};

const AnimatedSeparator: React.FC<{ startX: number }> = ({ startX }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (meshRef.current) {
            // Wavy doodle line logic
            meshRef.current.position.x = startX + Math.sin(state.clock.elapsedTime * 10 + startX) * 0.15;
            const scalePulse = 1 + Math.abs(Math.sin(state.clock.elapsedTime * 5 + startX)) * 0.2;
            meshRef.current.scale.set(scalePulse, 1, 1);
        }
    });

    return (
        <mesh ref={meshRef} position={[startX, 0.05, -20]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.25, 200]} />
            <meshBasicMaterial color="#ffff00" transparent opacity={0.8} />
        </mesh>
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
                <planeGeometry args={[laneCount * LANE_WIDTH + 2, 200]} />
                <meshBasicMaterial color="#222222" />
            </mesh>

            {/* Wavy Lane Separators */}
            {separators.map((x, i) => (
                <AnimatedSeparator key={`sep-${i}`} startX={x} />
            ))}
        </group>
    );
};

const UrbanSculpture: React.FC = () => {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            const time = state.clock.elapsedTime;
            groupRef.current.position.y = 30 + Math.sin(time * 0.5) * 5.0;
            // Hyper-active background orbits
            groupRef.current.rotation.y = time * 0.4;
            groupRef.current.rotation.x = time * 0.2;
            groupRef.current.rotation.z = Math.sin(time * 0.3) * 0.2;

            // Breathing / Bouncing Scale overall
            const breathe = 1 + Math.sin(time * 2) * 0.1;
            groupRef.current.scale.set(breathe, 1 + Math.sin(time * 2.5) * 0.15, breathe);
        }
    });

    return (
        <group ref={groupRef} position={[0, 40, -180]}>
            <mesh position={[-10, 0, 0]}>
                <icosahedronGeometry args={[35, 0]} />
                <meshToonMaterial color="#ff0055" />
                <Outlines thickness={0.08} color="black" />
            </mesh>
            <mesh position={[40, -20, 20]}>
                <boxGeometry args={[20, 20, 20]} />
                <meshToonMaterial color="#00ffcc" />
                <Outlines thickness={0.08} color="black" />
            </mesh>
            <mesh position={[-30, 35, 20]}>
                <torusGeometry args={[18, 4, 8, 10]} />
                <meshToonMaterial color="#ffff00" />
                <Outlines thickness={0.08} color="black" />
            </mesh>
        </group>
    );
};

const SpeedLinesFloor: React.FC = () => {
    const speed = useStore(state => state.speed);
    const groupRef = useRef<THREE.Group>(null);
    const lineCount = 60;

    const lines = useMemo(() => {
        return Array.from({ length: lineCount }).map(() => ({
            x: (Math.random() - 0.5) * 50,
            z: Math.random() * -200,
            length: 1 + Math.random() * 8, // Exaggerated line length
            speedMult: 1 + Math.random() * 2
        }));
    }, []);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const activeSpeed = speed > 0 ? speed * 3.5 : 15;
        groupRef.current.children.forEach((child, i) => {
            const l = lines[i];
            child.position.z += activeSpeed * l.speedMult * delta;

            // Squash and Stretch Speed Lines
            const scaleY = 1 + Math.sin(state.clock.elapsedTime * 8 + i) * 0.2;
            child.scale.set(1, scaleY, 1);

            if (child.position.z > 20) {
                child.position.z = -200 - Math.random() * 50;
                child.position.x = (Math.random() - 0.5) * 60;
            }
        });
    });

    return (
        <group ref={groupRef} position={[0, -0.01, 0]}>
            {lines.map((l, i) => (
                <mesh key={i} position={[l.x, 0, l.z]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[0.3, l.length]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
                </mesh>
            ))}
        </group>
    );
};

export const Environment: React.FC = () => {
    return (
        <>
            <color attach="background" args={['#2a2b2e']} />
            <fog attach="fog" args={['#2a2b2e', 40, 150]} />

            <ambientLight intensity={0.6} color="#ffffff" />
            <directionalLight position={[0, 20, -10]} intensity={1.5} color="#ffffff" />
            <pointLight position={[0, 25, -150]} intensity={4} color="#ffffff" distance={250} decay={1} />

            <AmbientDoodles />
            <SpeedLinesFloor />
            <LaneGuides />

            <UrbanSculpture />
        </>
    );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Outlines } from '@react-three/drei';
import { useStore } from '../../store';

const GORILLA_BODY = new THREE.BoxGeometry(2, 2.5, 2);
const GORILLA_ARM = new THREE.BoxGeometry(0.8, 2.2, 0.8);
const GORILLA_HEAD = new THREE.BoxGeometry(1.5, 1.5, 1.5);

const Gorilla: React.FC<{ index: number, xOffset: number, baseZ: number }> = ({ index, xOffset, baseZ }) => {
    const groupRef = useRef<THREE.Group>(null);
    const armLRef = useRef<THREE.Mesh>(null);
    const armRRef = useRef<THREE.Mesh>(null);

    const mat = useMemo(() => new THREE.MeshToonMaterial({ color: '#222222' }), []);
    const faceMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffaaaa' }), []);

    useFrame((state) => {
        if (!groupRef.current || !armLRef.current || !armRRef.current) return;
        const t = state.clock.elapsedTime * 18 + index * 2;

        // Aggressive bouncing dash
        groupRef.current.position.y = 1.25 + Math.abs(Math.sin(t)) * 1.5;
        groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.1;
        groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.1;

        // Big arm swinging
        armLRef.current.rotation.x = Math.sin(t) * 1.5;
        armRRef.current.rotation.x = -Math.sin(t) * 1.5;

        // Squash and stretch
        const stretch = 1 + Math.abs(Math.sin(t)) * 0.2;
        groupRef.current.scale.set(1 / stretch, stretch, 1 / stretch);
    });

    return (
        <group ref={groupRef} position={[xOffset, 1.25, baseZ]}>
            <mesh geometry={GORILLA_BODY} material={mat}>
                <Outlines thickness={0.1} color="black" />
            </mesh>
            <mesh position={[0, 1.8, -0.2]} geometry={GORILLA_HEAD} material={mat}>
                <Outlines thickness={0.1} color="black" />
            </mesh>
            {/* Angry pink face */}
            <mesh position={[0, 1.8, -0.96]} material={faceMat}>
                <planeGeometry args={[1, 0.6]} />
            </mesh>
            {/* Eyes */}
            <mesh position={[-0.2, 1.9, -0.97]}>
                <planeGeometry args={[0.2, 0.1]} />
                <meshBasicMaterial color="black" />
            </mesh>
            <mesh position={[0.2, 1.9, -0.97]}>
                <planeGeometry args={[0.2, 0.1]} />
                <meshBasicMaterial color="black" />
            </mesh>

            <mesh ref={armLRef} position={[-1.5, 0.5, 0]} geometry={GORILLA_ARM} material={mat}>
                <Outlines thickness={0.1} color="black" />
            </mesh>
            <mesh ref={armRRef} position={[1.5, 0.5, 0]} geometry={GORILLA_ARM} material={mat}>
                <Outlines thickness={0.1} color="black" />
            </mesh>
        </group>
    );
};

export const GorillaSwarm: React.FC = () => {
    const gorillaDistance = useStore(state => state.gorillaDistance);
    const speed = useStore(state => state.speed);

    // We will render 5 gorillas spread across lanes behind the player
    const gorillas = useMemo(() => {
        return [
            { x: -6, z: 8 },
            { x: -3, z: 2 },
            { x: 0, z: -2 }, // Lead gorilla
            { x: 3, z: 3 },
            { x: 6, z: 7 }
        ];
    }, []);

    const swarmRef = useRef<THREE.Group>(null);

    useFrame((_, delta) => {
        if (!swarmRef.current) return;

        // Z mapping: if distance=0 (caught), they are at z=0 (player).
        // If distance=100 (safe), they are at z=60. 
        const targetZ = gorillaDistance * 0.6;
        swarmRef.current.position.z = THREE.MathUtils.lerp(swarmRef.current.position.z, targetZ, delta * 4);
    });

    return (
        <group ref={swarmRef} position={[0, 0, 60]}>
            {gorillas.map((g, i) => (
                <Gorilla key={i} index={i} xOffset={g.x} baseZ={g.z} />
            ))}
        </group>
    );
};

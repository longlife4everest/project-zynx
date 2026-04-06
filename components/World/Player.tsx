/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Outlines } from '@react-three/drei';
import { useStore } from '../../store';
import { LANE_WIDTH, GameStatus } from '../../types';
import { audio } from '../System/Audio';

// Physics Constants
const GRAVITY = 50;
const JUMP_FORCE = 16;

// Character Geometries
// Shark Body
const SHARK_BODY_GEO = new THREE.CapsuleGeometry(0.3, 0.7, 4, 8);
const SHARK_SNOUT_GEO = new THREE.ConeGeometry(0.3, 0.6, 8);
const SHARK_TAIL_GEO = new THREE.ConeGeometry(0.2, 0.5, 8);
const SHARK_FIN_GEO = new THREE.ConeGeometry(0.15, 0.4, 4);

// Rider
const RIDER_BODY_GEO = new THREE.BoxGeometry(0.25, 0.35, 0.25);
const RIDER_HEAD_GEO = new THREE.BoxGeometry(0.25, 0.25, 0.25);

// Equipment
const ROCKET_GEO = new THREE.CylinderGeometry(0.12, 0.15, 0.5, 8);
const NOS_FLAME_GEO = new THREE.ConeGeometry(0.15, 0.6, 8);
const SHADOW_GEO = new THREE.CircleGeometry(0.6, 32);

export const Player: React.FC = () => {
    const groupRef = useRef<THREE.Group>(null);
    const bodyRef = useRef<THREE.Group>(null);
    const shadowRef = useRef<THREE.Mesh>(null);

    // Animation Refs
    const sharkRef = useRef<THREE.Group>(null);
    const tailRef = useRef<THREE.Group>(null);
    const nosRef = useRef<THREE.Mesh>(null);
    const riderRef = useRef<THREE.Group>(null);

    const { status, laneCount, takeDamage, hasDoubleJump, activateImmortality, isImmortalityActive } = useStore();

    const [lane, setLane] = React.useState(0);
    const targetX = useRef(0);

    // Physics State
    const isJumping = useRef(false);
    const velocityY = useRef(0);
    const jumpsPerformed = useRef(0);
    const spinRotation = useRef(0);

    const touchStartX = useRef(0);
    const touchStartY = useRef(0);

    const isInvincible = useRef(false);
    const lastDamageTime = useRef(0);

    // Materials
    const { sharkMaterial, bellyMaterial, riderMaterial, rocketMaterial, flameMaterial } = useMemo(() => {
        const primaryColor = isImmortalityActive ? '#ffd700' : '#00aaff'; // Cyber blue shark
        return {
            sharkMaterial: new THREE.MeshToonMaterial({ color: primaryColor }),
            bellyMaterial: new THREE.MeshToonMaterial({ color: '#ffffff' }),
            riderMaterial: new THREE.MeshToonMaterial({ color: '#ff0055' }),
            rocketMaterial: new THREE.MeshToonMaterial({ color: '#333333' }),
            flameMaterial: new THREE.MeshBasicMaterial({ color: '#ffcc00' })
        };
    }, [isImmortalityActive]);

    // Reset State
    useEffect(() => {
        if (status === GameStatus.PLAYING) {
            isJumping.current = false;
            jumpsPerformed.current = 0;
            velocityY.current = 0;
            spinRotation.current = 0;
            if (groupRef.current) groupRef.current.position.y = 0;
            if (bodyRef.current) bodyRef.current.rotation.x = 0;
        }
    }, [status]);

    useEffect(() => {
        const maxLane = Math.floor(laneCount / 2);
        if (Math.abs(lane) > maxLane) {
            setLane(l => Math.max(Math.min(l, maxLane), -maxLane));
        }
    }, [laneCount, lane]);

    // Controls
    const triggerJump = () => {
        const maxJumps = hasDoubleJump ? 2 : 1;

        if (!isJumping.current) {
            audio.playJump(false);
            isJumping.current = true;
            jumpsPerformed.current = 1;
            velocityY.current = JUMP_FORCE;
        } else if (jumpsPerformed.current < maxJumps) {
            audio.playJump(true);
            jumpsPerformed.current += 1;
            velocityY.current = JUMP_FORCE;
            spinRotation.current = 0;
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (status !== GameStatus.PLAYING) return;
            const maxLane = Math.floor(laneCount / 2);

            if (e.key === 'ArrowLeft') setLane(l => Math.max(l - 1, -maxLane));
            else if (e.key === 'ArrowRight') setLane(l => Math.min(l + 1, maxLane));
            else if (e.key === 'ArrowUp' || e.key === 'w') triggerJump();
            else if (e.key === ' ' || e.key === 'Enter') {
                activateImmortality();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [status, laneCount, hasDoubleJump, activateImmortality]);

    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            touchStartX.current = e.touches[0].clientX;
            touchStartY.current = e.touches[0].clientY;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (status !== GameStatus.PLAYING) return;
            const deltaX = e.changedTouches[0].clientX - touchStartX.current;
            const deltaY = e.changedTouches[0].clientY - touchStartY.current;
            const maxLane = Math.floor(laneCount / 2);

            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
                if (deltaX > 0) setLane(l => Math.min(l + 1, maxLane));
                else setLane(l => Math.max(l - 1, -maxLane));
            } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < -30) {
                triggerJump();
            } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
                activateImmortality();
            }
        };

        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchend', handleTouchEnd);
        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [status, laneCount, hasDoubleJump, activateImmortality]);

    // Animation Loop
    useFrame((state, delta) => {
        if (!groupRef.current) return;
        if (status !== GameStatus.PLAYING && status !== GameStatus.SHOP) return;

        targetX.current = lane * LANE_WIDTH;
        groupRef.current.position.x = THREE.MathUtils.lerp(
            groupRef.current.position.x,
            targetX.current,
            delta * 15
        );

        // Physics 
        if (isJumping.current) {
            groupRef.current.position.y += velocityY.current * delta;
            velocityY.current -= GRAVITY * delta;

            if (groupRef.current.position.y <= 0) {
                groupRef.current.position.y = 0;
                isJumping.current = false;
                jumpsPerformed.current = 0;
                velocityY.current = 0;
                if (bodyRef.current) bodyRef.current.rotation.x = 0;
            }

            // Double Jump Trick Flip
            if (jumpsPerformed.current === 2 && bodyRef.current) {
                spinRotation.current -= delta * 15;
                if (spinRotation.current < -Math.PI * 2) spinRotation.current = -Math.PI * 2;
                bodyRef.current.rotation.x = spinRotation.current;
            }
        }

        // Banking Rotation (shark tilt side to side)
        const xDiff = targetX.current - groupRef.current.position.x;
        groupRef.current.rotation.z = -xDiff * 0.25;
        groupRef.current.rotation.x = isJumping.current ? 0.15 : 0.05;

        const time = state.clock.elapsedTime * 25;
        let squashY = 1.0;
        let squashXZ = 1.0;

        if (!isJumping.current) {
            squashY = 1.0 + Math.abs(Math.sin(time / 2)) * 0.12;
            squashXZ = 1.0 - Math.abs(Math.sin(time / 2)) * 0.06;

            if (bodyRef.current) {
                bodyRef.current.position.y = 0.5 + Math.abs(Math.sin(time)) * 0.1;
                bodyRef.current.scale.set(squashXZ, squashY, squashXZ);
            }
        } else {
            if (velocityY.current > 0) {
                const stretch = Math.min(velocityY.current / JUMP_FORCE, 1.0);
                squashY = 1.0 + stretch * 0.3;
                squashXZ = 1.0 - stretch * 0.15;
            } else {
                squashY = 1.0;
                squashXZ = 1.0;
            }
            if (bodyRef.current) {
                bodyRef.current.scale.set(squashXZ, squashY, squashXZ);
            }

            if (bodyRef.current && jumpsPerformed.current !== 2) bodyRef.current.position.y = 0.5;
        }

        // Component Animations
        // Tail wagging based on time
        if (tailRef.current) {
            tailRef.current.rotation.y = Math.sin(time) * 0.4;
            tailRef.current.rotation.z = Math.sin(time * 0.5) * 0.1;
        }
        // Rider bouncing
        if (riderRef.current) {
            riderRef.current.position.y = 0.4 + Math.abs(Math.sin(time + 2)) * 0.05;
            riderRef.current.rotation.z = Math.cos(time) * 0.1;
        }
        // Rocket NOS flickering exhaust
        if (nosRef.current) {
            const burst = 1 + Math.random() * 0.5 + Math.sin(time * 3) * 0.5;
            nosRef.current.scale.set(burst, burst * 1.5, burst);
            (nosRef.current.material as THREE.MeshBasicMaterial).color.setHSL((Math.random() * 0.1) + 0.05, 1, 0.5);
        }

        // Dynamic Shadow
        if (shadowRef.current) {
            const height = groupRef.current.position.y;
            const scale = Math.max(0.3, 1 - (height / 2.5) * 0.5);
            const runStretch = isJumping.current ? 1 : 1 + Math.abs(Math.sin(time)) * 0.2;

            shadowRef.current.scale.set(scale, scale, scale * runStretch);
            const material = shadowRef.current.material as THREE.MeshBasicMaterial;
            if (material) {
                material.opacity = Math.max(0.1, 0.4 - (height / 2.5) * 0.2);
            }
        }

        // Damage Flickering
        const showFlicker = isInvincible.current || isImmortalityActive;
        if (showFlicker) {
            if (isInvincible.current) {
                if (Date.now() - lastDamageTime.current > 1500) {
                    isInvincible.current = false;
                    groupRef.current.visible = true;
                } else {
                    groupRef.current.visible = Math.floor(Date.now() / 50) % 2 === 0;
                }
            }
            if (isImmortalityActive) groupRef.current.visible = true;
        } else {
            groupRef.current.visible = true;
        }
    });

    useEffect(() => {
        const checkHit = (e: any) => {
            if (isInvincible.current || isImmortalityActive) return;
            audio.playDamage();
            takeDamage();
            isInvincible.current = true;
            lastDamageTime.current = Date.now();
        };
        window.addEventListener('player-hit', checkHit);
        return () => window.removeEventListener('player-hit', checkHit);
    }, [takeDamage, isImmortalityActive]);

    // Construct Shark
    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            <group ref={bodyRef} position={[0, 0.5, 0]}>

                <group ref={sharkRef}>
                    {/* Main Hull */}
                    <mesh rotation={[Math.PI / 2, 0, 0]} geometry={SHARK_BODY_GEO} material={sharkMaterial}>
                        <Outlines thickness={0.07} color="black" />
                    </mesh>

                    {/* Snout */}
                    <mesh position={[0, 0, -0.6]} rotation={[-Math.PI / 2, 0, 0]} geometry={SHARK_SNOUT_GEO} material={sharkMaterial}>
                        <Outlines thickness={0.07} color="black" />
                    </mesh>

                    {/* Dorsal Fin */}
                    <mesh position={[0, 0.4, 0]} rotation={[0.4, 0, 0]} geometry={SHARK_FIN_GEO} material={sharkMaterial}>
                        <Outlines thickness={0.07} color="black" />
                    </mesh>

                    {/* Left/Right Pectoral Fins */}
                    <mesh position={[-0.35, 0, -0.2]} rotation={[0, 0, Math.PI / 3]} geometry={SHARK_FIN_GEO} material={sharkMaterial}>
                        <Outlines thickness={0.07} color="black" />
                    </mesh>
                    <mesh position={[0.35, 0, -0.2]} rotation={[0, 0, -Math.PI / 3]} geometry={SHARK_FIN_GEO} material={sharkMaterial}>
                        <Outlines thickness={0.07} color="black" />
                    </mesh>

                    {/* Tail Assembly */}
                    <group ref={tailRef} position={[0, 0, 0.5]}>
                        <mesh position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]} geometry={SHARK_TAIL_GEO} material={sharkMaterial}>
                            <Outlines thickness={0.07} color="black" />
                        </mesh>
                        <mesh position={[0, 0.2, 0.5]} rotation={[0.3, 0, 0]} geometry={SHARK_FIN_GEO} material={sharkMaterial}>
                            <Outlines thickness={0.07} color="black" />
                        </mesh>
                        <mesh position={[0, -0.2, 0.5]} rotation={[-0.3, 0, Math.PI]} geometry={SHARK_FIN_GEO} material={sharkMaterial}>
                            <Outlines thickness={0.07} color="black" />
                        </mesh>
                    </group>

                    {/* Rocket Launcher */}
                    <group position={[0.3, 0.1, 0.2]}>
                        <mesh rotation={[Math.PI / 2, 0, 0]} geometry={ROCKET_GEO} material={rocketMaterial}>
                            <Outlines thickness={0.07} color="black" />
                        </mesh>
                        {/* NOS Flame Thrust */}
                        <mesh ref={nosRef} position={[0, 0, 0.45]} rotation={[-Math.PI / 2, 0, 0]} geometry={NOS_FLAME_GEO} material={flameMaterial} />
                    </group>
                </group>

                {/* Toon Rider */}
                <group ref={riderRef} position={[0, 0.4, -0.1]}>
                    <mesh geometry={RIDER_BODY_GEO} material={riderMaterial}>
                        <Outlines thickness={0.07} color="black" />
                    </mesh>
                    <mesh position={[0, 0.3, 0.05]} geometry={RIDER_HEAD_GEO} material={bellyMaterial}>
                        <Outlines thickness={0.07} color="black" />
                    </mesh>
                </group>

            </group>

            <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} geometry={SHADOW_GEO}>
                <meshBasicMaterial color="#000000" opacity={0.4} transparent />
            </mesh>
        </group>
    );
};
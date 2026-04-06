/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { GameStatus, RUN_SPEED_BASE } from './types';

export interface ComicPopup {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  rotation: number;
}

interface GameState {
  status: GameStatus;
  score: number;
  lives: number;
  maxLives: number;
  speed: number;
  collectedLetters: number[];
  level: number;
  laneCount: number;
  gemsCollected: number;
  distance: number;

  // New Mechanics
  gorillaDistance: number; // 0 = caught, 100 = safe
  comicPopups: ComicPopup[];
  screenShakeIntensity: number;

  // Inventory / Abilities
  hasDoubleJump: boolean;
  hasImmortality: boolean;
  isImmortalityActive: boolean;

  // Actions
  startGame: () => void;
  restartGame: () => void;
  takeDamage: () => void;
  addScore: (amount: number) => void;
  collectGem: (value: number) => void;
  collectLetter: (index: number) => void;
  setStatus: (status: GameStatus) => void;
  setDistance: (dist: number) => void;

  triggerScreenShake: (intensity: number) => void;
  addPopup: (text: string, color?: string) => void;
  removePopup: (id: string) => void;
  increaseGorillaDistance: (amount: number) => void;

  // Shop / Abilities
  buyItem: (type: 'DOUBLE_JUMP' | 'MAX_LIFE' | 'HEAL' | 'IMMORTAL', cost: number) => boolean;
  advanceLevel: () => void;
  openShop: () => void;
  closeShop: () => void;
  activateImmortality: () => void;
}

const ZYNX_TARGET = ['Z', 'Y', 'N', 'X', '!', '!'];
const MAX_LEVEL = 3;
const INITIAL_GORILLA_DIST = 80;

export const useStore = create<GameState>((set, get) => ({
  status: GameStatus.MENU,
  score: 0,
  lives: 3,
  maxLives: 3,
  speed: 0,
  collectedLetters: [],
  level: 1,
  laneCount: 3,
  gemsCollected: 0,
  distance: 0,

  gorillaDistance: INITIAL_GORILLA_DIST,
  comicPopups: [],
  screenShakeIntensity: 0,

  hasDoubleJump: false,
  hasImmortality: false,
  isImmortalityActive: false,

  startGame: () => set({
    status: GameStatus.PLAYING,
    score: 0,
    lives: 3,
    maxLives: 3,
    speed: RUN_SPEED_BASE,
    collectedLetters: [],
    level: 1,
    laneCount: 3,
    gemsCollected: 0,
    distance: 0,
    gorillaDistance: INITIAL_GORILLA_DIST,
    comicPopups: [],
    screenShakeIntensity: 0,
    hasDoubleJump: false,
    hasImmortality: false,
    isImmortalityActive: false
  }),

  restartGame: () => set({
    status: GameStatus.PLAYING,
    score: 0,
    lives: 3,
    maxLives: 3,
    speed: RUN_SPEED_BASE,
    collectedLetters: [],
    level: 1,
    laneCount: 3,
    gemsCollected: 0,
    distance: 0,
    gorillaDistance: INITIAL_GORILLA_DIST,
    comicPopups: [],
    screenShakeIntensity: 0,
    hasDoubleJump: false,
    hasImmortality: false,
    isImmortalityActive: false
  }),

  takeDamage: () => {
    const { lives, isImmortalityActive, gorillaDistance } = get();
    if (isImmortalityActive) return;

    // Gorillas close in fast on error
    const newDist = Math.max(gorillaDistance - 30, 0);

    if (lives > 1) {
      set({ lives: lives - 1, gorillaDistance: newDist, screenShakeIntensity: 2.0 });
      get().addPopup("OUCH!", "#ff0055");
    } else {
      set({ lives: 0, status: GameStatus.GAME_OVER, speed: 0, gorillaDistance: newDist, screenShakeIntensity: 3.5 });
      get().addPopup("CRASH!", "#ff0000");
    }
  },

  addScore: (amount) => set((state) => ({ score: state.score + amount })),

  collectGem: (value) => {
    set((state) => ({
      score: state.score + value,
      gemsCollected: state.gemsCollected + 1
    }));
    get().addPopup("+BLING!", "#00ffcc");
  },

  setDistance: (dist) => set({ distance: dist }),

  triggerScreenShake: (intensity) => set({ screenShakeIntensity: intensity }),

  addPopup: (text, color = '#ffff00') => {
    const id = uuidv4();
    const newPopup: ComicPopup = {
      id,
      text,
      color,
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 40,
      rotation: (Math.random() - 0.5) * 30
    };
    set(state => ({ comicPopups: [...state.comicPopups, newPopup] }));

    setTimeout(() => {
      get().removePopup(id);
    }, 800);
  },

  removePopup: (id) => {
    set(state => ({ comicPopups: state.comicPopups.filter(p => p.id !== id) }));
  },

  increaseGorillaDistance: (amount) => {
    set(state => ({ gorillaDistance: Math.min(state.gorillaDistance + amount, 100) }));
  },

  collectLetter: (index) => {
    const { collectedLetters, level, speed } = get();
    if (!collectedLetters.includes(index)) {
      const newLetters = [...collectedLetters, index];
      const speedIncrease = RUN_SPEED_BASE * 0.10;
      const nextSpeed = speed + speedIncrease;

      set({
        collectedLetters: newLetters,
        speed: nextSpeed
      });

      get().addPopup(`GOT '${ZYNX_TARGET[index]}'!`, "#ff00ff");

      if (newLetters.length === ZYNX_TARGET.length) {
        if (level < MAX_LEVEL) {
          get().advanceLevel();
        } else {
          set({
            status: GameStatus.VICTORY,
            score: get().score + 5000,
            screenShakeIntensity: 2.0
          });
          get().addPopup("VICTORY!", "#00ff00");
        }
      }
    }
  },

  advanceLevel: () => {
    const { level, laneCount, speed } = get();
    const nextLevel = level + 1;
    const speedIncrease = RUN_SPEED_BASE * 0.40;
    const newSpeed = speed + speedIncrease;

    set({
      level: nextLevel,
      laneCount: Math.min(laneCount + 2, 9),
      status: GameStatus.PLAYING,
      speed: newSpeed,
      collectedLetters: [],
      screenShakeIntensity: 1.0,
      gorillaDistance: INITIAL_GORILLA_DIST // Reset gorillas on level up
    });
    get().addPopup("LEVEL UP!", "#00ffff");
  },

  openShop: () => set({ status: GameStatus.SHOP }),

  closeShop: () => set({ status: GameStatus.PLAYING }),

  buyItem: (type, cost) => {
    const { score, maxLives, lives } = get();

    if (score >= cost) {
      set({ score: score - cost });

      switch (type) {
        case 'DOUBLE_JUMP':
          set({ hasDoubleJump: true });
          get().addPopup("DOUBLE JUMP!", "#00ff00");
          break;
        case 'MAX_LIFE':
          set({ maxLives: maxLives + 1, lives: lives + 1 });
          get().addPopup("MAX HEALTH UP!", "#00ff00");
          break;
        case 'HEAL':
          set({ lives: Math.min(lives + 1, maxLives) });
          break;
        case 'IMMORTAL':
          set({ hasImmortality: true });
          get().addPopup("IMMORTAL POWER!", "#00ff00");
          break;
      }
      return true;
    }
    return false;
  },

  activateImmortality: () => {
    const { hasImmortality, isImmortalityActive } = get();
    if (hasImmortality && !isImmortalityActive) {
      set({ isImmortalityActive: true });
      get().triggerScreenShake(1.5);
      get().addPopup("IMMORTAL!", "#ffd700");

      setTimeout(() => {
        set({ isImmortalityActive: false });
      }, 5000);
    }
  },

  setStatus: (status) => set({ status }),
}));

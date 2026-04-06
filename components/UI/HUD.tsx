/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useEffect } from 'react';
import { Heart, Zap, Trophy, MapPin, Diamond, Rocket, ArrowUpCircle, Shield, Activity, PlusCircle, Play } from 'lucide-react';
import { useStore } from '../../store';
import { GameStatus, GEMINI_COLORS, ShopItem, RUN_SPEED_BASE } from '../../types';
import { audio } from '../System/Audio';

// Available Shop Items
const SHOP_ITEMS: ShopItem[] = [
    {
        id: 'DOUBLE_JUMP',
        name: 'DOUBLE JUMP',
        description: 'Jump again in mid-air. Essential for high obstacles.',
        cost: 1000,
        icon: ArrowUpCircle,
        oneTime: true
    },
    {
        id: 'MAX_LIFE',
        name: 'MAX LIFE UP',
        description: 'Permanently adds a heart slot and heals you.',
        cost: 1500,
        icon: Activity
    },
    {
        id: 'HEAL',
        name: 'REPAIR KIT',
        description: 'Restores 1 Life point instantly.',
        cost: 1000,
        icon: PlusCircle
    },
    {
        id: 'IMMORTAL',
        name: 'IMMORTALITY',
        description: 'Unlock Ability: Press Space/Tap to be invincible for 5s.',
        cost: 3000,
        icon: Shield,
        oneTime: true
    }
];

const ShopScreen: React.FC = () => {
    const { score, buyItem, closeShop, hasDoubleJump, hasImmortality } = useStore();
    const [items, setItems] = useState<ShopItem[]>([]);

    useEffect(() => {
        // Select 3 random items, filtering out one-time items already bought
        let pool = SHOP_ITEMS.filter(item => {
            if (item.id === 'DOUBLE_JUMP' && hasDoubleJump) return false;
            if (item.id === 'IMMORTAL' && hasImmortality) return false;
            return true;
        });

        // Shuffle and pick 3
        pool = pool.sort(() => 0.5 - Math.random());
        setItems(pool.slice(0, 3));
    }, []);

    return (
        <div className="absolute inset-0 bg-[#2a2b2e]/95 z-[100] text-black pointer-events-auto overflow-y-auto font-cyber">
            <div className="flex flex-col items-center justify-center min-h-full py-8 px-4">
                <div className="inline-block bg-yellow-400 border-4 border-black shadow-[6px_6px_0px_#000] transform -rotate-2 px-6 py-2 mb-6">
                    <h2 className="text-3xl md:text-5xl font-black tracking-widest text-center m-0">BLACK MARKET</h2>
                </div>
                <div className="flex items-center text-white bg-black border-4 border-black shadow-[4px_4px_0px_#ff0055] px-4 py-2 mb-8 transform rotate-1">
                    <span className="text-base md:text-lg mr-2 font-bold">STREET CRED:</span>
                    <span className="text-xl md:text-2xl font-black text-yellow-400">{score.toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl w-full mb-8">
                    {items.map(item => {
                        const Icon = item.icon;
                        const canAfford = score >= item.cost;
                        return (
                            <div key={item.id} className="bg-pink-500 border-4 border-black p-4 md:p-6 flex flex-col items-center text-center shadow-[8px_8px_0px_#000] hover:-translate-y-1 hover:shadow-[10px_10px_0px_#000] transition-all transform hover:rotate-1">
                                <div className="bg-yellow-400 border-4 border-black p-3 md:p-4 mb-3 md:mb-4 shadow-[4px_4px_0px_#000] rotate-[-5deg]">
                                    <Icon className="w-6 h-6 md:w-8 md:h-8 text-black" />
                                </div>
                                <h3 className="text-xl md:text-2xl font-black mb-2 text-black">{item.name}</h3>
                                <p className="text-black font-bold text-sm md:text-base mb-6 h-10 md:h-12 flex items-center justify-center bg-white/50 px-2 border-2 border-black rotate-1">{item.description}</p>
                                <button
                                    onClick={() => buyItem(item.id as any, item.cost)}
                                    disabled={!canAfford}
                                    className={`px-4 md:px-6 py-3 border-4 border-black font-black text-lg md:text-xl w-full shadow-[4px_4px_0px_#000] ${canAfford ? 'bg-cyan-400 text-black hover:bg-yellow-400 hover:translate-y-1 hover:shadow-[0px_0px_0px_#000] transition-all' : 'bg-gray-400 text-gray-700 cursor-not-allowed'}`}
                                >
                                    {item.cost} CRED
                                </button>
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={closeShop}
                    className="flex items-center px-8 md:px-10 py-3 md:py-4 bg-green-400 text-black border-4 border-black font-black text-xl md:text-2xl hover:bg-yellow-400 transition-all shadow-[8px_8px_0px_#000] hover:translate-y-1 hover:shadow-[4px_4px_0px_#000] transform -rotate-1"
                >
                    HIT THE STREETS <Play className="ml-2 w-6 h-6" fill="black" />
                </button>
            </div>
        </div>
    );
};

export const HUD: React.FC = () => {
    const { score, lives, maxLives, collectedLetters, status, level, restartGame, startGame, gemsCollected, distance, isImmortalityActive, speed } = useStore();
    const target = ['Z', 'Y', 'N', 'X', '!', '!'];

    // Common container style
    const containerClass = "absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-8 z-50";

    if (status === GameStatus.SHOP) {
        return <ShopScreen />;
    }

    if (status === GameStatus.MENU) {
        return (
            <div className="absolute inset-0 flex items-center justify-center z-[100] bg-[#2a2b2e]/90 p-4 pointer-events-auto">
                {/* Card Container */}
                <div className="relative w-full max-w-md border-8 border-black bg-[#ff0055] shadow-[15px_15px_0px_#000] rotate-1 animate-in zoom-in-95 duration-500">

                    {/* Image Container */}
                    <div className="relative w-full bg-yellow-400 border-b-8 border-black">
                        <img
                            src="https://www.gstatic.com/aistudio/starter-apps/gemini_runner/gemini_runner.png"
                            alt="Zynx Runner Cover"
                            className="w-full h-auto block filter contrast-125 saturate-150 mix-blend-multiply"
                        />
                        <div className="absolute inset-0 border-4 border-black m-2 pointer-events-none"></div>
                    </div>

                    {/* Content */}
                    <div className="p-6 pb-8 text-center bg-[#ff0055]">
                        <button
                            onClick={() => { audio.init(); startGame(); }}
                            className="w-full flex items-center justify-center px-6 py-4 bg-cyan-400 text-black border-4 border-black font-black text-2xl hover:bg-yellow-400 transition-all shadow-[6px_6px_0px_#000] hover:translate-y-1 hover:shadow-[2px_2px_0px_#000] font-cyber transform -rotate-2"
                        >
                            START RUNNING <Play className="ml-2 w-6 h-6 fill-black" />
                        </button>

                        <p className="text-black font-bold text-sm md:text-base mt-6 tracking-widest bg-yellow-400 inline-block px-3 py-1 border-2 border-black transform rotate-1">
                            [ ARROWS / SWIPE ]
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === GameStatus.GAME_OVER) {
        return (
            <div className="absolute inset-0 bg-[#2a2b2e]/95 z-[100] pointer-events-auto overflow-y-auto pattern-diagonal-lines">
                <div className="flex flex-col items-center justify-center min-h-full py-8 px-4">
                    <div className="bg-black border-4 border-black shadow-[10px_10px_0px_#ff0055] px-8 py-4 mb-8 transform rotate-3">
                        <h1 className="text-5xl md:text-7xl font-black text-yellow-400 font-cyber text-center m-0">BUSTED!</h1>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:gap-5 text-center mb-8 w-full max-w-md font-cyber">
                        <div className="bg-cyan-400 p-3 md:p-4 border-4 border-black shadow-[6px_6px_0px_#000] flex items-center justify-between transform -rotate-1">
                            <div className="flex items-center text-black font-black text-lg md:text-xl"><Trophy className="mr-2 w-5 h-5 md:w-6 md:h-6" /> ROUND</div>
                            <div className="text-2xl md:text-3xl font-black text-white" style={{ WebkitTextStroke: '1px black' }}>{level} / 3</div>
                        </div>
                        <div className="bg-pink-500 p-3 md:p-4 border-4 border-black shadow-[6px_6px_0px_#000] flex items-center justify-between transform rotate-1">
                            <div className="flex items-center text-black font-black text-lg md:text-xl"><Diamond className="mr-2 w-5 h-5 md:w-6 md:h-6" /> BLING</div>
                            <div className="text-2xl md:text-3xl font-black text-white" style={{ WebkitTextStroke: '1px black' }}>{gemsCollected}</div>
                        </div>
                        <div className="bg-yellow-400 p-3 md:p-4 border-4 border-black shadow-[6px_6px_0px_#000] flex items-center justify-between transform -rotate-2">
                            <div className="flex items-center text-black font-black text-lg md:text-xl"><MapPin className="mr-2 w-5 h-5 md:w-6 md:h-6" /> TURF</div>
                            <div className="text-2xl md:text-3xl font-black text-white" style={{ WebkitTextStroke: '1px black' }}>{Math.floor(distance)} FT</div>
                        </div>
                        <div className="bg-white p-4 md:p-6 border-4 border-black shadow-[8px_8px_0px_#000] flex flex-col items-center justify-center mt-4">
                            <div className="text-black font-bold text-xl md:text-2xl mb-1">FINAL SCORE</div>
                            <div className="text-4xl md:text-6xl font-black font-cyber text-[#ff0055] drop-shadow-[2px_2px_0px_#000]">{score.toLocaleString()}</div>
                        </div>
                    </div>

                    <button
                        onClick={() => { audio.init(); restartGame(); }}
                        className="px-8 md:px-12 py-4 md:py-5 bg-green-400 text-black border-4 border-black font-black text-2xl md:text-3xl hover:bg-yellow-400 transition-all shadow-[8px_8px_0px_#000] hover:translate-y-1 hover:shadow-[4px_4px_0px_#000] transform -rotate-1 mt-4"
                    >
                        AGAIN?
                    </button>
                </div>
            </div>
        );
    }

    if (status === GameStatus.VICTORY) {
        return (
            <div className="absolute inset-0 bg-[#2a2b2e] z-[100] pointer-events-auto overflow-y-auto">
                <div className="flex flex-col items-center justify-center min-h-full py-8 px-4 font-cyber">
                    <Rocket className="w-20 h-20 md:w-28 md:h-28 text-cyan-400 mb-6 drop-shadow-[6px_6px_0px_#000] rotate-12" />
                    <div className="bg-yellow-400 border-4 border-black px-6 py-2 shadow-[8px_8px_0px_#ff0055] -rotate-3 mb-4">
                        <h1 className="text-4xl md:text-7xl font-black text-black text-center m-0">UNSTOPPABLE!</h1>
                    </div>
                    <div className="bg-white px-4 py-2 border-border-black border-4 shadow-[4px_4px_0px_#000] rotate-2 mb-10">
                        <p className="text-black text-lg md:text-2xl font-black text-center m-0">
                            YOU OWN THESE STREETS
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 text-center mb-10 w-full max-w-md">
                        <div className="bg-pink-500 p-6 border-4 border-black shadow-[8px_8px_0px_#000] flex flex-col items-center">
                            <div className="text-xl md:text-2xl text-black font-bold mb-2">FINAL SCORE</div>
                            <div className="text-5xl md:text-7xl font-black text-white" style={{ WebkitTextStroke: '2px black' }}>{score.toLocaleString()}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-cyan-400 p-4 border-4 border-black shadow-[4px_4px_0px_#000] transform -rotate-2">
                                <div className="text-sm font-bold text-black border-b-2 border-black inline-block pb-1">BLING</div>
                                <div className="text-2xl md:text-3xl font-black text-white mt-1">{gemsCollected}</div>
                            </div>
                            <div className="bg-green-400 p-4 border-4 border-black shadow-[4px_4px_0px_#000] transform rotate-1">
                                <div className="text-sm font-bold text-black border-b-2 border-black inline-block pb-1">TURF</div>
                                <div className="text-2xl md:text-3xl font-black text-white mt-1">{Math.floor(distance)} FT</div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => { audio.init(); restartGame(); }}
                        className="px-8 md:px-12 py-4 md:py-5 bg-white text-black border-4 border-black font-black text-2xl md:text-3xl hover:bg-yellow-400 transition-all shadow-[8px_8px_0px_#000] hover:translate-y-1 hover:shadow-[4px_4px_0px_#000] transform -rotate-1"
                    >
                        PLAY AGAIN
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={containerClass}>
            {/* Top Bar */}
            <div className="flex justify-between items-start w-full">
                <div className="flex flex-col">
                    <div className="text-4xl md:text-6xl font-black text-[#ff0055] drop-shadow-[5px_5px_0px_#000] font-cyber transform -rotate-3 p-2 bg-yellow-400 border-4 border-black inline-block">
                        {score.toLocaleString()}
                    </div>
                </div>

                <div className="flex space-x-2 md:space-x-3 bg-white border-4 border-black p-3 shadow-[6px_6px_0px_#000] transform rotate-2">
                    {[...Array(maxLives)].map((_, i) => (
                        <Heart
                            key={i}
                            className={`w-8 h-8 md:w-10 md:h-10 ${i < lives ? 'text-pink-500 fill-pink-500' : 'text-gray-300 fill-gray-300'} drop-shadow-[2px_2px_0px_#000]`}
                        />
                    ))}
                </div>
            </div>

            {/* Level Indicator */}
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-xl md:text-3xl text-black font-black font-cyber bg-cyan-400 px-6 py-2 border-4 border-black shadow-[6px_6px_0px_#000] rotate-2 z-50">
                LEVEL {level} <span className="text-white bg-black px-2 py-1 rotate-1 whitespace-nowrap ml-2">/ 3</span>
            </div>

            {/* Active Skill Indicator */}
            {isImmortalityActive && (
                <div className="absolute top-28 left-1/2 transform -translate-x-1/2 text-black font-black text-2xl md:text-4xl animate-bounce flex items-center bg-yellow-400 px-6 py-3 border-4 border-black shadow-[6px_6px_0px_#000] -rotate-3 z-50">
                    <Shield className="mr-3 w-8 h-8 fill-black" /> UNTOUCHABLE
                </div>
            )}

            {/* Zynx Collection Status - Just below Top Bar */}
            <div className="absolute top-16 md:top-24 left-1/2 transform -translate-x-1/2 flex space-x-2 md:space-x-3">
                {target.map((char, idx) => {
                    const isCollected = collectedLetters.includes(idx);
                    const color = GEMINI_COLORS[idx];

                    return (
                        <div
                            key={idx}
                            style={{
                                borderColor: 'black',
                                color: isCollected ? 'black' : 'white',
                                boxShadow: isCollected ? `4px 4px 0px ${color}` : `6px 6px 0px #000`,
                                backgroundColor: isCollected ? color : '#2a2b2e'
                            }}
                            className={`w-10 h-12 md:w-14 md:h-16 flex items-center justify-center border-4 font-black text-2xl md:text-3xl font-cyber transform transition-all duration-100 ${idx % 2 === 0 ? 'rotate-3' : '-rotate-6'}`}
                        >
                            {char}
                        </div>
                    );
                })}
            </div>

            {/* Bottom Overlay */}
            <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 flex items-center justify-end">
                <div className="flex items-center space-x-3 bg-pink-500 border-4 border-black px-4 py-2 transform rotate-2 shadow-[4px_4px_0px_#000]">
                    <Zap className="w-5 h-5 md:w-8 md:h-8 animate-bounce fill-yellow-400 text-black" />
                    <span className="font-cyber font-black text-xl md:text-2xl text-black">SPEED {Math.round((speed / RUN_SPEED_BASE) * 100)}%</span>
                </div>
            </div>
        </div>
    );
};

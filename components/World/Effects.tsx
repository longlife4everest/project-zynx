/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React from 'react';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

export const Effects: React.FC = () => {
  return (
    <EffectComposer multisampling={0}>
      {/* Minimal bloom for cel-shading */}
      <Bloom
        luminanceThreshold={0.9}
        mipmapBlur
        intensity={0.2}
        radius={0.4}
        levels={4}
      />
      <Noise opacity={0.25} blendFunction={BlendFunction.OVERLAY} />
      <Vignette eskil={false} offset={0.1} darkness={0.6} />
    </EffectComposer>
  );
};

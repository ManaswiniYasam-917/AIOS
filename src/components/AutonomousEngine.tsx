import React, { useEffect } from 'react';
import { useAIOS } from '../context/AIOSContext';

/**
 * AutonomousEngine handles background system telemetry checks.
 * Automatic random event generation is disabled during active user missions to prevent state disruption.
 */
const AutonomousEngine: React.FC = () => {
  const { activeEventConfig } = useAIOS();

  useEffect(() => {
    // Telemetry sentinel — intentionally silent to prevent console noise
  }, [activeEventConfig]);

  return null;
};

export default AutonomousEngine;

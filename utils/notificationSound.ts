// Utility for playing notification sounds using Web Audio API
// This avoids having to host an audio file

/**
 * Creates and plays a notification sound using Web Audio API
 * This creates a short "ding" sound effect
 */
export const playNotificationSound = () => {
  try {
    // Only run in browser environment
    if (typeof window === 'undefined' || !window.AudioContext) {
      return;
    }
    
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create oscillator for the tone
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configure the sound
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    
    // Fade in
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
    // Fade out
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.4);
    
    // Play the sound
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.4);
    
  } catch (error) {
    console.error("Failed to play notification sound:", error);
  }
};

/**
 * Creates and plays a bell notification sound
 * This creates a more pleasant "ding-dong" sound
 */
export const playBellSound = () => {
  try {
    // Only run in browser environment
    if (typeof window === 'undefined' || !window.AudioContext) {
      return;
    }
    
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create oscillator for the tone
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configure the sound (bell-like tone)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(784, audioContext.currentTime); // G5 note
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    
    // Fade in
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.02);
    // Fade out with a longer decay for a bell-like sound
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.5);
    
    // Frequency shift for the bell effect
    oscillator.frequency.setValueAtTime(784, audioContext.currentTime); // G5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.2); // E5
    
    // Play the sound
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 1.5);
    
  } catch (error) {
    console.error("Failed to play bell sound:", error);
  }
}; 
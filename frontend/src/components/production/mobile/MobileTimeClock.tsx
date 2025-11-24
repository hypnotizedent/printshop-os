import { useState } from 'react';
import { saveTimeEntryOffline } from '../../../offline/offline-storage';
import { useOffline } from '../../../hooks/useOffline';
import { v4 as uuidv4 } from 'uuid';

export const MobileTimeClock = () => {
  const [pin, setPin] = useState('');
  const [isClockingIn, setIsClockingIn] = useState(false);
  const { isOnline } = useOffline();

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      setPin(pin + digit);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleClockIn = async () => {
    if (pin.length !== 4) {
      return;
    }

    setIsClockingIn(true);
    try {
      // SECURITY NOTE: In production, this PIN should be validated against a secure backend
      // and exchanged for a proper user identifier. Never use the PIN directly as a user ID.
      // This is a demo implementation showing the UI/UX flow only.
      // TODO: Implement secure PIN validation: 
      //   1. Hash PIN before sending to backend
      //   2. Backend validates against secure storage
      //   3. Backend returns JWT or session token with user ID
      //   4. Use token for authenticated requests
      
      const entry = {
        id: uuidv4(),
        userId: `temp-${pin}`, // Temporary - replace with validated user ID from backend
        timestamp: Date.now(),
        type: 'clock-in' as const,
        synced: false
      };

      await saveTimeEntryOffline(entry);
      
      // Show success message
      alert('Clocked in successfully!');
      setPin('');
    } catch (error) {
      console.error('Clock in failed:', error);
      alert('Failed to clock in. Please try again.');
    } finally {
      setIsClockingIn(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background p-4 sm:p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">PRODUCTION</h1>
        <h2 className="text-xl sm:text-2xl font-semibold">TIME CLOCK</h2>
        {!isOnline && (
          <div className="mt-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md text-sm">
            ⚠️ Offline Mode - Will sync when online
          </div>
        )}
      </div>

      {/* PIN Input Display */}
      <div className="mb-8 text-center">
        <p className="text-lg mb-4">Enter PIN:</p>
        <div className="flex justify-center gap-2 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-gray-300 rounded-md flex items-center justify-center text-2xl"
            >
              {pin[i] ? '•' : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-sm mx-auto mb-8">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <button
            key={digit}
            onClick={() => handlePinInput(digit.toString())}
            className="aspect-square min-h-[60px] bg-white border-2 border-gray-300 rounded-md text-2xl font-semibold hover:bg-gray-50 active:bg-gray-100 active:scale-95 transition-transform touch-manipulation"
            style={{ touchAction: 'manipulation' }}
          >
            {digit}
          </button>
        ))}
        <button
          onClick={handleBackspace}
          className="aspect-square min-h-[60px] bg-white border-2 border-gray-300 rounded-md text-xl font-semibold hover:bg-gray-50 active:bg-gray-100 active:scale-95 transition-transform touch-manipulation"
          style={{ touchAction: 'manipulation' }}
        >
          ◄
        </button>
        <button
          onClick={() => handlePinInput('0')}
          className="aspect-square min-h-[60px] bg-white border-2 border-gray-300 rounded-md text-2xl font-semibold hover:bg-gray-50 active:bg-gray-100 active:scale-95 transition-transform touch-manipulation"
          style={{ touchAction: 'manipulation' }}
        >
          0
        </button>
        <button
          onClick={handleClockIn}
          disabled={pin.length !== 4 || isClockingIn}
          className="aspect-square min-h-[60px] bg-green-600 text-white border-2 border-green-700 rounded-md text-xl font-semibold hover:bg-green-700 active:bg-green-800 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          style={{ touchAction: 'manipulation' }}
        >
          ✓
        </button>
      </div>

      {/* Clock In Button */}
      <button
        onClick={handleClockIn}
        disabled={pin.length !== 4 || isClockingIn}
        className="w-full max-w-sm mx-auto min-h-[60px] bg-blue-600 text-white text-xl font-bold rounded-md hover:bg-blue-700 active:bg-blue-800 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
        style={{ touchAction: 'manipulation' }}
      >
        {isClockingIn ? 'CLOCKING IN...' : 'CLOCK IN'}
      </button>
    </div>
  );
};

import React, { useState, useCallback, useEffect } from 'react';
import { Phone, PhoneOff, PhoneCall, Mic, MicOff } from 'lucide-react';
import { Device } from '@twilio/voice-sdk';

const VirtualPhone = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [status, setStatus] = useState('idle');
  const [device, setDevice] = useState(null);
  const [connection, setConnection] = useState(null);
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  // Initialize Twilio Device
  useEffect(() => {
    initializeTwilioDevice();
    return () => {
      if (device) {
        device.destroy();
      }
    };
  }, []);

  const initializeTwilioDevice = async () => {
    try {
      // Get token from backend
      const response = await fetch('/api/token');
      const data = await response.json();
      
      // Initialize Twilio Voice Device with token
      const newDevice = new Device(data.token, {
        debug: true,
        codecPreferences: ['opus', 'pcmu']
      });
      
      // Setup event listeners
      newDevice.on('incoming', handleIncomingCall);
      newDevice.on('error', handleError);
      newDevice.on('ready', () => console.log('Device ready'));
      
      await newDevice.register();
      setDevice(newDevice);
    } catch (err) {
      setError('Failed to initialize phone: ' + err.message);
    }
  };

  const handleIncomingCall = useCallback((conn) => {
		setStatus('ringing');
	
		// Save the connection in state
		setConnection(conn);
	
		// Setup connection event listeners
		conn.on('accept', () => {
			setStatus('connected');
		});
	
		conn.on('disconnect', () => {
			setStatus('idle');
			setConnection(null);
		});
	
		conn.on('error', (err) => {
			setError(err.message);
			setStatus('idle');
			setConnection(null);
		});
	}, []);

  const handleError = useCallback((err) => {
    setError(err.message);
    setStatus('idle');
  }, []);

  const makeCall = useCallback(async () => {
    if (!phoneNumber.match(/^\+?[\d\s-]+$/)) {
      setError('Please enter a valid phone number');
      return;
    }

    try {
      setStatus('calling');
      setError(null);
      
      if (!device) {
        throw new Error('Phone not initialized');
      }

			console.log("Calling phone number:", phoneNumber);
      
      const conn = await device.connect({
        params: { 
          To: phoneNumber,
          From: 'browser-user'
        }
      });
      
      setConnection(conn);
      setStatus('connected');
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  }, [phoneNumber, device]);

  const hangUp = useCallback(() => {
    if (connection) {
      connection.disconnect();
      setConnection(null);
      setStatus('idle');
    }
  }, [connection]);

  const toggleMute = useCallback(() => {
    if (connection) {
      if (isMuted) {
        connection.mute(false);
      } else {
        connection.mute(true);
      }
      setIsMuted(!isMuted);
    }
  }, [connection, isMuted]);

  const acceptIncomingCall = useCallback(() => {
		if (connection) {
			connection.accept(); // Accept the call
			setStatus('connected'); // Update status
		}
	}, [connection]);

  const rejectIncomingCall = useCallback(() => {
		if (connection) {
			connection.reject(); // Reject the call
			setConnection(null); // Clear the connection state
			setStatus('idle'); // Update status
		}
	}, [connection]);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg mt-10">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-center mb-6">Virtual Phone</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {status === 'ringing' ? (
          <div className="flex justify-center space-x-4">
            <button
              onClick={acceptIncomingCall}
              className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              <Phone className="w-6 h-6" />
            </button>
            <button
              onClick={rejectIncomingCall}
              className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        ) : (
          <div className="flex space-x-2">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
              className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={status !== 'idle'}
            />
            
            {status === 'idle' ? (
              <button
                onClick={makeCall}
                className="p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                disabled={!phoneNumber || !device}
              >
                <PhoneCall className="w-6 h-6" />
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={toggleMute}
                  className={`p-2 ${isMuted ? 'bg-gray-500' : 'bg-blue-500'} text-white rounded hover:opacity-80`}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
                <button
                  onClick={hangUp}
                  className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className="text-center">
          {status === 'calling' && (
            <div className="flex items-center justify-center space-x-2 text-blue-500">
              <Phone className="w-5 h-5 animate-pulse" />
              <span>Calling...</span>
            </div>
          )}
          {status === 'connected' && (
            <div className="flex items-center justify-center space-x-2 text-green-500">
              <Phone className="w-5 h-5" />
              <span>Connected</span>
            </div>
          )}
          {status === 'ringing' && (
            <div className="flex items-center justify-center space-x-2 text-yellow-500">
              <Phone className="w-5 h-5 animate-ping" />
              <span>Incoming Call</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VirtualPhone;
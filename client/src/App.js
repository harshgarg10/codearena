import React, { useState } from 'react';
import Signup from './Signup';
import Login from './Login';

function App() {
  const [view, setView] = useState('signup');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-4">

      <div className="bg-gray-800 bg-opacity-90 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden backdrop-blur-sm border border-gray-700">

        {/* tab buttons */}
        <div className="flex">
          {['signup','login'].map(tab => (
            <button
            key={tab}
            onClick={() => setView(tab)}
            className={`flex-1 py-3 text-center font-semibold transition-all duration-300 ${
              view === tab
                ? 'bg-purple-700 text-white shadow-md shadow-purple-500'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            {tab === 'signup' ? 'Sign Up' : 'Log In'}
          </button>
          ))}
        </div>

        {/* only render the active form */}
        <div className="p-8">
          {view === 'signup' ? <Signup /> : <Login />}
        </div>
      </div>
    </div>
  );
}

export default App;

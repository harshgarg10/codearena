import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Editor from '@monaco-editor/react';
// import { Clock, Trophy, AlertCircle, Loader2, ExitIcon } from 'lucide-react';
import { Clock, Trophy, AlertCircle, Loader2, LogOut } from 'lucide-react';
import { useSocket } from './context/SocketContext';
import { API_ENDPOINTS } from './config/api';
const languageTemplates = {
  cpp: `#include <iostream>
using namespace std;

int main() {
    // your code here
    return 0;
}
`,
  python: `# Write your code here
def main():
    pass

main()
`,
  java: `public class Main {
    public static void main(String[] args) {
        // your code here
    }
}
`
};

const DuelRoom = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Anonymous';

  const socket = useSocket();
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState(languageTemplates['cpp']);
  const [customInput, setCustomInput] = useState('');
  const [output, setOutput] = useState('');
  const [opponent, setOpponent] = useState('Waiting...');
  const [language, setLanguage] = useState('cpp');
  
  // Loading states
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Timer and game state
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const [gameEnded, setGameEnded] = useState(false);
  const [scores, setScores] = useState({});
  const [times, setTimes] = useState({});
  const [winner, setWinner] = useState(null);
  const [endReason, setEndReason] = useState('');
  
  // Exit confirmation state
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [attemptedNavigation, setAttemptedNavigation] = useState(null);

  useEffect(() => {
    setCode(languageTemplates[language]);
  }, [language]);

  // Timer countdown effect
  useEffect(() => {
    if (gameEnded) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameEnded(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameEnded]);

  // Prevent browser back/refresh during active duel
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!gameEnded) {
        event.preventDefault();
        event.returnValue = 'Are you sure you want to leave? This will end the duel and your opponent will win.';
        return event.returnValue;
      }
    };

    const handlePopState = (event) => {
      if (!gameEnded) {
        event.preventDefault();
        setShowExitConfirm(true);
        setAttemptedNavigation('back');
        // Push the current state back to prevent navigation
        window.history.pushState(null, '', window.location.pathname);
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    // Push initial state to handle back button
    window.history.pushState(null, '', window.location.pathname);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [gameEnded]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle confirmed exit
  const handleConfirmedExit = () => {
    if (socket && !gameEnded) {
      // Notify server that player is leaving
      socket.emit('player-forfeit', { roomCode, username });
    }
    
    setShowExitConfirm(false);
    
    // Navigate based on attempted navigation
    if (attemptedNavigation === 'back') {
      navigate(-1);
    } else if (attemptedNavigation) {
      navigate(attemptedNavigation);
    } else {
      navigate('/home');
    }
  };

  // Handle exit cancellation
  const handleCancelExit = () => {
    setShowExitConfirm(false);
    setAttemptedNavigation(null);
  };

  // Custom navigate function that shows confirmation for active duels
  const safeNavigate = (path) => {
    if (!gameEnded) {
      setShowExitConfirm(true);
      setAttemptedNavigation(path);
    } else {
      navigate(path);
    }
  };

  useEffect(() => {
    if (!socket) return; // Wait for the socket to be available

    // Emit join event as soon as the component mounts and socket is ready
    socket.emit('join-duel-room', { roomCode, username });

    const handleDuelData = ({ problem, opponent, scores, times }) => {
      console.log('📋 Received duel data:', { problem: problem?.title, opponent });
      setProblem(problem);
      setOpponent(opponent);
      setScores(scores || {});
      setTimes(times || {});
    };

    const handleScoreUpdate = ({ scores, times }) => {
      console.log('📊 Score update:', scores);
      setScores(scores);
      setTimes(times);
    };

    const handleDuelEnded = ({ winner, reason, finalScores, finalTimes, ratingChanges, isRanked }) => {
      console.log('🏁 Duel ended:', { winner, reason, isRanked });
      setGameEnded(true);
      setWinner(winner);
      setEndReason(reason);
      setScores(finalScores);
      setTimes(finalTimes);
      
      // Show different messages based on the ending reason
      let gameOverMessage = `🏁 GAME OVER!\n\n${reason}\n\nFinal Scores:\n${Object.entries(finalScores).map(([user, score]) => `${user}: ${score} test cases`).join('\n')}`;
      
      if (reason.includes('solving all test cases')) {
        gameOverMessage += '\n\n🎯 Perfect solution achieved!';
      } else if (reason.includes('time limit')) {
        gameOverMessage += '\n\n⏰ Time limit reached.';
      } else if (reason.includes('forfeit')) {
        gameOverMessage += '\n\n🏃 Player forfeited the match.';
      }

      // Add rating change info only for ranked games
      if (isRanked && ratingChanges && ratingChanges[username]) {
        const change = ratingChanges[username];
        const sign = change >= 0 ? '+' : '';
        gameOverMessage += `\n\n📊 Rating: ${sign}${change} points`;
      } else if (!isRanked) {
        gameOverMessage += '\n\n🎮 Friendly Match - No rating changes';
      }
      
      setOutput(gameOverMessage);
    };

    const handleOpponentDisconnected = ({ disconnectedPlayer }) => {
      console.log('🏃‍♂️ Opponent disconnected:', disconnectedPlayer);
      setGameEnded(true);
      setOutput(`🏃‍♂️ ${disconnectedPlayer} disconnected. You win by default!`);
    };

    const handleDuelError = (error) => {
      console.error('❌ Duel room error:', error);
      setOutput(`❌ Error: ${error}`);
      
      if (error.includes('Room not found')) {
        setTimeout(() => {
          navigate('/play-online');
        }, 3000);
      }
    };

    socket.on('duel-data', handleDuelData);
    socket.on('score-update', handleScoreUpdate);
    socket.on('duel-ended', handleDuelEnded);
    socket.on('opponent-disconnected', handleOpponentDisconnected);
    socket.on('duel-error', handleDuelError);

    return () => {
      socket.off('duel-data', handleDuelData);
      socket.off('score-update', handleScoreUpdate);
      socket.off('duel-ended', handleDuelEnded);
      socket.off('opponent-disconnected', handleOpponentDisconnected);
      socket.off('duel-error', handleDuelError);
    };
  }, [socket, roomCode, username, navigate]);

  const runCustomTest = async () => {
    if (!problem || gameEnded || isRunning) {
      if (gameEnded) setOutput('Game has ended!');
      else if (!problem) setOutput('No problem loaded yet.');
      return;
    }

    setIsRunning(true);
    setOutput('🔄 Running your code...\n\nPlease wait while we execute your solution with custom input.');

    try {
      const res = await fetch(API_ENDPOINTS.EXECUTE_CUSTOM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, input: customInput, language }),
      });

      const data = await res.json();
      
      // Format the output with execution info
      let formattedOutput = '';
      if (data.verdict === 'Success') {
        formattedOutput = `✅ Execution Successful\n⏱️ Time: ${(data.time || 0).toFixed(3)}s\n📄 Verdict: ${data.verdict}\n\n--- Output ---\n${data.output || 'No output'}`;
      } else {
        formattedOutput = `❌ Execution Failed\n📄 Verdict: ${data.verdict}\n⏱️ Time: ${(data.time || 0).toFixed(3)}s\n\n--- Error Details ---\n${data.output || 'No details available'}`;
      }
      
      setOutput(formattedOutput);
    } catch (error) {
      setOutput(`❌ Network Error\n\nFailed to execute code: ${error.message}\n\nPlease check your connection and try again.`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!problem || gameEnded || isSubmitting) {
      if (gameEnded) setOutput('Game has ended!');
      else if (!problem) setOutput('No problem loaded yet.');
      return;
    }

    setIsSubmitting(true);
    setOutput('🚀 Submitting your solution...\n\nRunning against all test cases. This may take a few moments.');

    try {
      const res = await fetch(API_ENDPOINTS.EXECUTE_SUBMIT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, problemId: problem.id, username, language }),
      });

      const data = await res.json();
      const executionTime = data.time || 0;
      
      // Format submission result with detailed info
      let formattedOutput = '';
      if (data.verdict === 'Accepted' && data.passed === data.total) {
        // Perfect score - game will end
        formattedOutput = `🎉 PERFECT SOLUTION!\n\n✅ Passed ALL ${data.passed}/${data.total} test cases\n⏱️ Execution Time: ${executionTime.toFixed(3)}s\n🏆 Score: ${data.score || 0} points\n📊 Verdict: ${data.verdict}\n\n🏁 You solved the problem! Game ending...`;
      } else if (data.verdict === 'Accepted') {
        formattedOutput = `🎉 ACCEPTED!\n\n✅ Passed ${data.passed}/${data.total} test cases\n⏱️ Execution Time: ${executionTime.toFixed(3)}s\n🏆 Score: ${data.score || 0} points\n📊 Verdict: ${data.verdict}\n\nCongratulations! Your solution is correct.`;
      } else {
        formattedOutput = `❌ ${data.verdict.toUpperCase()}\n\n📊 Passed ${data.passed}/${data.total} test cases\n⏱️ Time: ${executionTime.toFixed(3)}s\n📄 Verdict: ${data.verdict}\n\n${data.verdict === 'Wrong Answer' ? 'Your solution produces incorrect output for some test cases.' : 
          data.verdict === 'TLE' ? 'Your solution is too slow and exceeds the time limit.' :
          data.verdict === 'Runtime Error' ? 'Your solution crashes during execution.' :
          data.verdict === 'Compilation Error' ? 'There are errors in your code that prevent compilation.' :
          'Please review your solution and try again.'}`;
      }
      
      setOutput(formattedOutput);

      if (socket) {
        socket.emit('submission-result', {
          roomCode,
          username,
          passed: data.passed,
          total: data.total,
          time: executionTime
        });
      }

      // If perfect score, show additional success feedback
      if (data.verdict === 'Accepted' && data.passed === data.total) {
        setTimeout(() => {
          setOutput(prev => prev + '\n\n🎯 Waiting for game to end...');
        }, 1000);
      }

    } catch (error) {
      setOutput(`❌ Submission Failed\n\nNetwork error: ${error.message}\n\nPlease check your connection and try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex text-white">
      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4 border border-gray-600">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <h3 className="text-xl font-bold text-red-400">Leave Duel?</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to leave this duel? 
              <br />
              <span className="text-red-400 font-semibold">Your opponent will automatically win and your rating will be affected.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelExit}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition"
              >
                Stay in Duel
              </button>
              <button
                onClick={handleConfirmedExit}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
              >
                Leave & Forfeit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEFT: Problem Description */}
      <div className="w-1/2 bg-gray-900 p-6 border-r border-gray-800 max-h-screen flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-purple-400">
            {problem?.title || 'Loading Problem...'}
          </h2>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
              timeLeft <= 300 ? 'bg-red-900 text-red-300' : 
              timeLeft <= 600 ? 'bg-yellow-900 text-yellow-300' : 
              'bg-gray-800 text-gray-300'
            }`}>
              <Clock className="w-4 h-4" />
              <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </div>
            <span className="text-sm text-gray-400">Room: {roomCode}</span>
            
            {/* Exit Button */}
            <button
              onClick={() => safeNavigate('/home')}
              className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition"
              title="Leave Duel"
            >
              <LogOut className="w-4 h-4" />
              Exit
            </button>
          </div>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-400">👤 You: {username}</span>
            <span className="text-sm text-gray-400 ml-4">⚔️ Opponent: {opponent}</span>
          </div>
          
          {/* Live Scores */}
          <div className="text-xs bg-gray-800 px-3 py-2 rounded-lg">
            <div className="flex gap-4">
              <span className="text-green-400">
                {username}: {scores[username] || 0} ✓
              </span>
              <span className="text-blue-400">
                {opponent}: {scores[opponent] || 0} ✓
              </span>
            </div>
          </div>
        </div>

        {gameEnded && (
          <div className="mb-4 p-4 bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg border border-purple-500">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-bold text-yellow-400">Game Over!</h3>
            </div>
            <p className="text-gray-300">{endReason}</p>
            <button 
              onClick={() => navigate('/home')}
              className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition"
            >
              Return to Home
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          {!problem ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-lg">Loading problem...</p>
              </div>
            </div>
          ) : (
            <>
              <p className="mb-4 whitespace-pre-line text-gray-300">{problem?.description}</p>
              <div className="mb-4">
                <p className="text-yellow-300 font-semibold">Input Format</p>
                <p className="mb-2 text-sm whitespace-pre-line text-gray-300">{problem?.input_format}</p>
              </div>
              <div className="mb-4">
                <p className="text-yellow-300 font-semibold">Output Format</p>
                <p className="mb-2 text-sm whitespace-pre-line text-gray-300">{problem?.output_format}</p>
              </div>
              <div className="mb-4">
                <p className="text-green-400 font-semibold">Sample Input</p>
                <pre className="bg-gray-800 p-2 rounded text-green-300 whitespace-pre-wrap">{problem?.sample_input}</pre>
              </div>
              <div className="mb-4">
                <p className="text-green-400 font-semibold">Sample Output</p>
                <pre className="bg-gray-800 p-2 rounded text-green-300 whitespace-pre-wrap">{problem?.sample_output}</pre>
              </div>
            </>
          )}
        </div>
      </div>

      {/* RIGHT: Code Editor */}
      <div className="w-1/2 bg-black p-6 flex flex-col max-h-screen">
        <div className="flex justify-between items-center mb-4 p-2 bg-gray-800 rounded-lg flex-shrink-0">
          <div className="text-white font-semibold">
            {problem ? problem.title : 'Loading...'}
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="language" className="text-white text-sm">Language:</label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={gameEnded || isRunning || isSubmitting}
              className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:border-purple-500 focus:outline-none disabled:opacity-50"
            >
              <option value="cpp">C++</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
            </select>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 mb-4 border border-gray-700 rounded-lg overflow-hidden min-h-0">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language}
              theme="vs-dark"
              value={code}
              onChange={(value) => !gameEnded && !isRunning && !isSubmitting && setCode(value || '')}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                fontSize: 14,
                fontFamily: 'Consolas, Monaco, monospace',
                readOnly: gameEnded || isRunning || isSubmitting
              }}
            />
          </div>

          <div className="mb-4 flex-shrink-0">
            <label className="block text-white text-sm mb-2">Custom Input (optional):</label>
            <textarea
              value={customInput}
              onChange={(e) => !gameEnded && !isRunning && !isSubmitting && setCustomInput(e.target.value)}
              placeholder={gameEnded ? "Game has ended" : isRunning || isSubmitting ? "Code is running..." : "Enter your custom input here..."}
              disabled={gameEnded || isRunning || isSubmitting}
              className="w-full bg-gray-800 p-3 rounded-lg h-20 text-white resize-none border border-gray-700 focus:border-purple-500 focus:outline-none custom-scrollbar disabled:opacity-50"
            />
          </div>

          <div className="flex gap-4 mb-4 flex-shrink-0">
            <button
              onClick={runCustomTest}
              className="flex-1 bg-blue-600 px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={!problem || gameEnded || isRunning || isSubmitting}
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running...
                </>
              ) : (
                'Run Test'
              )}
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 bg-green-600 px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={!problem || gameEnded || isRunning || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </button>
          </div>

          {output && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col min-h-0 flex-shrink-0 max-h-48">
              <h4 className="font-semibold text-yellow-400 p-4 pb-2 flex-shrink-0 flex items-center gap-2">
                {(isRunning || isSubmitting) && <Loader2 className="w-4 h-4 animate-spin" />}
                Output:
              </h4>
              <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
                <pre className="whitespace-pre-wrap text-gray-300 text-sm">
                  {output}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DuelRoom;
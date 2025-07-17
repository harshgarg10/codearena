import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Editor from '@monaco-editor/react';

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

  const [socket, setSocket] = useState(null);
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState(languageTemplates['cpp']);
  const [customInput, setCustomInput] = useState('');
  const [output, setOutput] = useState('');
  const [opponent, setOpponent] = useState('Waiting...');
  const [language, setLanguage] = useState('cpp');

  useEffect(() => {
    setCode(languageTemplates[language]);
  }, [language]);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Connected to DuelRoom with ID:', newSocket.id);
      newSocket.emit('join-duel-room', { roomCode, username });
    });

    newSocket.on('duel-data', ({ problem, opponent }) => {
      console.log('Received duel data:', { problem, opponent });
      setProblem(problem);
      setOpponent(opponent);
    });

    newSocket.on('duel-error', (error) => {
      console.error('Duel room error:', error);
      setOutput('Error: ' + error);
    });

    return () => {
      newSocket.off('connect');
      newSocket.off('duel-data');
      newSocket.off('duel-error');
      newSocket.disconnect();
    };
  }, [roomCode, username]);

  const runCustomTest = async () => {
    if (!problem) {
      setOutput('No problem loaded yet.');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/execute/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, input: customInput, language }),
      });

      const data = await res.json();
      setOutput(data.output || 'Something went wrong');
    } catch (error) {
      setOutput('Error running code: ' + error.message);
    }
  };

  const handleSubmit = async () => {
    if (!problem) {
      setOutput('No problem loaded yet.');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/execute/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, problemId: problem.id, username, language }),
      });

      const data = await res.json();
      setOutput(`✅ Passed ${data.passed}/${data.total} test cases`);

      if (socket) {
        socket.emit('submission-result', {
          roomCode,
          username,
          passed: data.passed,
          total: data.total,
        });
      }
    } catch (error) {
      setOutput('Error submitting code: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen flex text-white">
      {/* LEFT: Problem Description */}
      <div className="w-1/2 bg-gray-900 p-6 border-r border-gray-800 max-h-screen flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-purple-400">
            {problem?.title || 'Loading Problem...'}
            </h2>
            <span className="text-sm text-gray-400">Room: {roomCode}</span>
        </div>

        <div className="mb-4">
            <span className="text-sm text-gray-400">👤 You: {username}</span>
            <span className="text-sm text-gray-400 ml-4">⚔️ Opponent: {opponent}</span>
        </div>

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

      {/* RIGHT: Code Editor - Always visible */}
      <div className="w-1/2 bg-black p-6 flex flex-col">
        {/* Language Selector - Always at the top */}
        <div className="flex justify-between items-center mb-4 p-2 bg-gray-800 rounded-lg">
          <div className="text-white font-semibold">
            {problem ? problem.title : 'Loading...'}
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="language" className="text-white text-sm">Language:</label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
            >
              <option value="cpp">C++</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
            </select>
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 mb-4 border border-gray-700 rounded-lg overflow-hidden">
          <Editor
            height="400px"
            language={language === 'cpp' ? 'cpp' : language}
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || '')}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              fontSize: 14,
              fontFamily: 'Consolas, Monaco, monospace',
            }}
          />
        </div>

        {/* Custom Input */}
        <div className="mb-4">
          <label className="block text-white text-sm mb-2">Custom Input (optional):</label>
          <textarea
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Enter your custom input here..."
            className="w-full bg-gray-800 p-3 rounded-lg h-20 text-white resize-none border border-gray-700 focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={runCustomTest}
            className="flex-1 bg-blue-600 px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold text-white"
            disabled={!problem}
          >
            Run Test
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-green-600 px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold text-white"
            disabled={!problem}
          >
            Submit
          </button>
        </div>

        {/* Output Section */}
        {output && (
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h4 className="font-semibold text-yellow-400 mb-2">Output:</h4>
            <pre className="whitespace-pre-wrap text-gray-300 text-sm max-h-32 overflow-y-auto">
              {output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default DuelRoom;
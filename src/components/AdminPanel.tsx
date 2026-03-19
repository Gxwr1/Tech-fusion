import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Users, Play, Clock, HelpCircle, Zap, RefreshCw, PlusCircle, ArrowRight, Pause, RotateCcw, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminPanel: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { 
    gameState, adminChangeRound, adminStartRound1, adminPauseRound1, 
    adminResetRound1, adminAddQuestion, adminNextQuestion, adminResetBuzzer, adminUpdateScore 
  } = useSocket();

  const [qInput, setQInput] = useState({ question: '', options: ['', '', '', ''], correct: '' });
  const [timerInput, setTimerInput] = useState(600);
  const [editScores, setEditScores] = useState<{ [id: string]: number }>({});

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'GooOOooPi') setIsAuthorized(true);
    else alert('Invalid Password');
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900 p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-zinc-700">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Admin Password"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors">
              Access Dashboard
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex justify-between items-center bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-xl">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">Quiz Master Dashboard</h1>
            <p className="text-zinc-400 text-sm">Status: Round {gameState.currentRound.toUpperCase()}</p>
          </div>
          <div className="flex gap-2">
            {['lobby', '1', '2', '3'].map((r) => (
              <button
                key={r}
                onClick={() => adminChangeRound(r)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  gameState.currentRound === r ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {r === 'lobby' ? 'Lobby' : `Round ${r}`}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Players List & Marking System */}
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 h-fit space-y-6">
            <div className="flex items-center gap-2">
              <Users className="text-blue-400" size={20} />
              <h2 className="text-xl font-semibold">Marking System</h2>
            </div>
            <div className="space-y-3">
              {gameState.players.map((p) => (
                <div key={p.id} className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{p.name}</span>
                    <span className="text-xs text-zinc-500 font-mono">{p.id.slice(0,4)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editScores[p.id] ?? p.score}
                      onChange={(e) => setEditScores({ ...editScores, [p.id]: Number(e.target.value) })}
                      className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-20 text-center"
                    />
                    <button 
                      onClick={() => adminUpdateScore(p.id, editScores[p.id] ?? p.score)}
                      className="bg-blue-600/20 text-blue-400 p-1.5 rounded hover:bg-blue-600/30 transition-colors"
                    >
                      <Save size={16} />
                    </button>
                    {p.r1FinishTime !== null && (
                      <span className="text-xs text-green-500 font-bold ml-auto">
                        Finished: {Math.floor(p.r1FinishTime / 60)}:{(p.r1FinishTime % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {gameState.players.length === 0 && <p className="text-zinc-500 text-center">No players joined.</p>}
            </div>
          </div>

          {/* Round Controls */}
          <div className="md:col-span-2 space-y-6">
            {gameState.currentRound === '1' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Clock className="text-green-400" size={24} />
                    <h2 className="text-2xl font-bold">Round 1: Pen & Paper</h2>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => adminPauseRound1()}
                      className="bg-zinc-800 p-2 rounded-lg hover:bg-zinc-700 transition-colors text-yellow-500"
                    >
                      {gameState.round1Paused ? <Play size={20} /> : <Pause size={20} />}
                    </button>
                    <button 
                      onClick={() => adminResetRound1(timerInput)}
                      className="bg-zinc-800 p-2 rounded-lg hover:bg-zinc-700 transition-colors text-red-500"
                    >
                      <RotateCcw size={20} />
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 bg-zinc-800 p-4 rounded-xl border border-zinc-700">
                    <label className="text-xs text-zinc-500 uppercase block mb-1">Set Duration (Seconds)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={timerInput}
                        onChange={(e) => setTimerInput(Number(e.target.value))}
                        className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 w-full outline-none"
                      />
                      <button 
                        onClick={() => adminStartRound1(timerInput)}
                        className="bg-green-600 hover:bg-green-700 px-4 rounded-lg font-bold transition-all"
                      >
                        {gameState.round1Active ? 'Update' : 'Start'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className={`text-9xl font-mono text-center py-12 bg-zinc-800/50 rounded-2xl border border-zinc-700 ${
                  gameState.round1Paused ? 'opacity-50 blur-[2px]' : ''
                }`}>
                  {Math.floor(gameState.round1Timer / 60)}:{(gameState.round1Timer % 60).toString().padStart(2, '0')}
                </div>
              </motion.div>
            )}

            {/* MCQ Manager (Round 2) */}
            {gameState.currentRound === '2' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-2 mb-6">
                  <HelpCircle className="text-purple-400" size={24} />
                  <h2 className="text-2xl font-bold">Round 2: MCQ Manager</h2>
                </div>
                <div className="space-y-4 mb-6">
                  <input
                    value={qInput.question}
                    onChange={(e) => setQInput({ ...qInput, question: e.target.value })}
                    placeholder="Question Text"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    {qInput.options.map((opt, i) => (
                      <input
                        key={i}
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...qInput.options];
                          newOpts[i] = e.target.value;
                          setQInput({ ...qInput, options: newOpts });
                        }}
                        placeholder={`Option ${i + 1}`}
                        className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    ))}
                  </div>
                  <input
                    value={qInput.correct}
                    onChange={(e) => setQInput({ ...qInput, correct: e.target.value })}
                    placeholder="Correct Answer"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 outline-none"
                  />
                  <button
                    onClick={() => {
                      adminAddQuestion(qInput);
                      setQInput({ question: '', options: ['', '', '', ''], correct: '' });
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                  >
                    <PlusCircle size={20} /> Add Question
                  </button>
                </div>
                <div className="flex justify-between items-center p-4 bg-zinc-800 rounded-xl border border-zinc-700">
                  <span className="text-zinc-400">Bank Size: {gameState.round2Questions.length}</span>
                  <div className="flex gap-4 items-center">
                    <span className="font-bold">Active: {gameState.round2CurrentIndex + 1}</span>
                    <button onClick={adminNextQuestion} className="bg-zinc-700 p-2 rounded-lg">
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Buzzer Hub (Round 3) */}
            {gameState.currentRound === '3' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <Zap className="text-yellow-400" size={24} />
                    <h2 className="text-2xl font-bold">Round 3: Buzzer Hub</h2>
                  </div>
                  <button onClick={adminResetBuzzer} className="bg-red-600/20 text-red-400 px-4 py-2 rounded-lg border border-red-900/50 flex items-center gap-2 transition-all">
                    <RefreshCw size={18} /> Reset
                  </button>
                </div>
                <div className="space-y-4">
                  {gameState.buzzerQueue.map((entry, idx) => (
                    <motion.div key={entry.id} className="flex items-center justify-between p-4 bg-zinc-800 rounded-xl border border-zinc-700">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-black">#{idx + 1}</span>
                        <span className="text-xl font-semibold">{entry.name}</span>
                      </div>
                      <span className="text-zinc-500 font-mono text-sm">+{((entry.time - (gameState.buzzerQueue[0]?.time || 0)) / 1000).toFixed(3)}s</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {gameState.currentRound === 'lobby' && (
              <div className="bg-zinc-900/50 p-20 rounded-3xl border border-zinc-800 border-dashed text-center">
                <Play className="mx-auto text-zinc-700 mb-4" size={48} />
                <h3 className="text-zinc-500 text-xl">Select a round to begin the sync</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

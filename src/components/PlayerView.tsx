import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Trophy, CheckCircle2, Users, Crown, ChevronRight } from 'lucide-react';

const fmtTime = (s: number) =>
  `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

const BackgroundEffects: React.FC<{ currentRound: string; timer: number }> = ({ currentRound, timer }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
    {currentRound === '1' && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15, backgroundColor: timer > 120 ? '#10b981' : timer > 30 ? '#f59e0b' : '#ef4444' }}
        className="absolute inset-0 blur-[150px] transition-colors duration-1000"
      />
    )}
  </div>
);

const PlayerView: React.FC = () => {
  const { gameState, joinGame, buzzerPress, playerFinishRound1, playerSubmitMCQ, socket } = useSocket();

  const [name, setName] = useState(() => localStorage.getItem('quiz_player_name') || '');
  const [isJoined, setIsJoined] = useState(() => localStorage.getItem('quiz_is_joined') === 'true');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const joinedRef = useRef(isJoined);
  const nameRef = useRef(name);

  // Keep refs in sync
  useEffect(() => { joinedRef.current = isJoined; }, [isJoined]);
  useEffect(() => { nameRef.current = name; }, [name]);

  // Re-join on socket (re)connect — preserves player data server-side
  useEffect(() => {
    if (!socket) return;
    const handleConnect = () => {
      if (joinedRef.current && nameRef.current.trim()) {
        joinGame(nameRef.current.trim());
      }
    };
    socket.on('connect', handleConnect);
    return () => { socket.off('connect', handleConnect); };
  }, [socket, joinGame]);

  const me = useMemo(() => {
    if (!name || !gameState.players) return null;
    return gameState.players.find((p) => p.name.toLowerCase() === name.trim().toLowerCase()) || null;
  }, [name, gameState.players]);

  const sortedPlayers = useMemo(
    () => [...(gameState.players || [])].sort((a, b) => b.score - a.score),
    [gameState.players]
  );

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    joinGame(cleanName);
    setIsJoined(true);
    localStorage.setItem('quiz_player_name', cleanName);
    localStorage.setItem('quiz_is_joined', 'true');
  };

  const currentQuestion = gameState.round2Questions[gameState.round2CurrentIndex];

  // Stable shuffle — only reshuffle when question index changes (not on every render)
  const shuffledOptions = useMemo(() => {
    if (!currentQuestion) return [];
    return [...currentQuestion.options].sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.round2CurrentIndex]);

  // Reset selection when question changes
  useEffect(() => {
    setSelectedOption(null);
  }, [gameState.round2CurrentIndex]);

  // Buzzer keyboard shortcut
  useEffect(() => {
    const handler = () => {
      if (gameState.currentRound === '3' && isJoined && name) buzzerPress(name);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gameState.currentRound, isJoined, name, buzzerPress]);

  const handleMCQSubmit = (opt: string) => {
    if (!selectedOption && gameState.round2Active) {
      setSelectedOption(opt);
      playerSubmitMCQ(opt);
    }
  };

  // ── Join Screen ───────────────────────────────────────────────────────────────
  if (!isJoined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 sm:p-6 relative overflow-hidden mesh-gradient">
        <BackgroundEffects currentRound={gameState.currentRound} timer={gameState.round1Timer} />
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          className="glass-panel p-8 sm:p-12 rounded-[2rem] sm:rounded-[2.5rem] w-full max-w-md text-center z-10">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-lg">
            <Trophy className="text-white" size={40} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-6 italic">QUIZ<span className="text-blue-500">PRO</span></h1>
          <form onSubmit={handleJoin} className="space-y-4">
            <input
              autoFocus value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Your Arena Name"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white text-lg focus:ring-4 focus:ring-blue-500/20 outline-none text-center font-bold"
            />
            <button type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl text-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2">
              JOIN ARENA <ChevronRight />
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ── Main View ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative overflow-hidden bg-zinc-950 text-white mesh-gradient">
      <BackgroundEffects currentRound={gameState.currentRound} timer={gameState.round1Timer} />

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 py-20">
        <AnimatePresence mode="wait">

          {/* Lobby */}
          {gameState.currentRound === 'lobby' && (
            <motion.div key="lobby" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -50 }}
              className="text-center space-y-8 w-full max-w-2xl">
              <div className="glass-panel p-12 rounded-[3rem]">
                <Users className="text-blue-500 mx-auto mb-8 animate-pulse" size={60} />
                <h2 className="text-3xl sm:text-5xl font-black mb-4 tracking-tight">Welcome, <span className="text-blue-500">{name}</span></h2>
                <p className="text-zinc-400 text-xl font-medium uppercase tracking-tight">Stand by…</p>
              </div>
              <div className="glass-panel p-6 rounded-3xl grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-40 overflow-y-auto no-scrollbar">
                {gameState.players.filter((p) => p.isOnline).map((p) => (
                  <div key={p.id} className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] shrink-0" />
                    <span className="font-bold truncate text-sm">{p.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Round 1 */}
          {gameState.currentRound === '1' && (
            <motion.div key="r1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-10">
              <h2 className="text-3xl font-black text-zinc-500 uppercase tracking-[0.4em] italic">Round 01</h2>
              <div className="relative">
                <motion.div
                  animate={{ scale: gameState.round1Timer < 30 ? [1, 1.04, 1] : 1, color: gameState.round1Timer < 30 ? '#ef4444' : '#ffffff' }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="text-[6rem] sm:text-[10rem] md:text-[14rem] font-black leading-none tracking-tighter tabular-nums glow-text-blue">
                  {fmtTime(gameState.round1Timer || 0)}
                </motion.div>
                {gameState.round1Paused && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md rounded-[4rem]">
                    <span className="text-6xl font-black text-yellow-500 uppercase italic">Paused</span>
                  </div>
                )}
              </div>
              {me?.r1FinishTime !== null && me?.r1FinishTime !== undefined ? (
                <div className="glass-panel border-green-500/30 bg-green-500/10 p-8 rounded-[2rem] flex items-center gap-6 mx-auto w-fit">
                  <CheckCircle2 className="text-green-500" size={40} />
                  <div className="text-left">
                    <p className="font-black text-3xl uppercase italic mb-1">Paper Submitted!</p>
                    <p className="text-green-500/80 font-bold">Time remaining: {fmtTime(me.r1FinishTime)}</p>
                  </div>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={playerFinishRound1}
                  className="bg-white text-black px-8 sm:px-16 py-5 sm:py-8 rounded-[2rem] sm:rounded-[2.5rem] font-black text-2xl sm:text-4xl shadow-2xl transition-all">
                  I'M DONE!
                </motion.button>
              )}
            </motion.div>
          )}

          {/* Round 2 */}
          {gameState.currentRound === '2' && (
            <motion.div key="r2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-3xl space-y-6">
              {currentQuestion ? (
                <>
                  {/* Question card */}
                  <div className="glass-panel p-10 rounded-[3rem] relative overflow-hidden border-white/10">
                    {/* Timer bar */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-zinc-800">
                      <motion.div
                        initial={{ width: '100%' }}
                        animate={{ width: `${((gameState.round2Timer || 0) / gameState.round2TimerConfig) * 100}%` }}
                        className={`h-full ${gameState.round2Timer < 5 ? 'bg-red-500' : 'bg-blue-500'} shadow-[0_0_15px_rgba(59,130,246,0.5)]`}
                      />
                    </div>
                    {/* Timer counter */}
                    <div className={`absolute top-6 right-6 w-16 h-16 rounded-2xl flex items-center justify-center font-black text-3xl border-2 ${
                      gameState.round2Timer <= 5 ? 'border-red-500 text-red-500 bg-red-500/10' :
                      gameState.round2Timer <= 10 ? 'border-amber-500 text-amber-400 bg-amber-500/10' :
                      'border-white/10 text-white bg-zinc-950'
                    }`}>
                      {gameState.round2Timer || 0}
                    </div>
                    <span className="text-blue-500 font-black mb-4 block uppercase tracking-[0.2em] italic text-sm">
                      Question {gameState.round2CurrentIndex + 1}
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold leading-[1.15] pr-20">{currentQuestion.question}</h2>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 gap-3">
                    {shuffledOptions.map((opt, i) => {
                      const isSelected = selectedOption === opt;
                      const isCorrect  = opt === currentQuestion.correct;
                      const revealed   = gameState.round2Revealed;
                      return (
                        <button key={i} onClick={() => handleMCQSubmit(opt)}
                          disabled={!gameState.round2Active || !!selectedOption}
                          className={`p-6 rounded-[2rem] border-2 text-left text-xl font-bold transition-all relative overflow-hidden
                            ${isSelected
                              ? revealed
                                ? isCorrect ? 'bg-green-600 border-green-400' : 'bg-red-600 border-red-400'
                                : 'bg-blue-600 border-blue-400 shadow-[0_0_40px_rgba(37,99,235,0.3)]'
                              : revealed && isCorrect
                                ? 'bg-green-600/20 border-green-500'
                                : 'glass-card border-white/5'
                            } ${!gameState.round2Active && !selectedOption ? 'opacity-50' : ''}`}>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-zinc-400 text-sm font-black mr-1">{['A','B','C','D'][i]}.</span>
                            <span className="flex-1">{opt}</span>
                            {isSelected && !revealed && <div className="w-3 h-3 rounded-full bg-white animate-ping shrink-0" />}
                            {revealed && isCorrect && <CheckCircle2 className="text-green-300 shrink-0" size={20} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Revealed answer */}
                  {gameState.round2Revealed && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      className="text-center p-6 glass-panel border-green-500/20 rounded-[2.5rem]">
                      <p className="text-zinc-500 uppercase font-black tracking-widest mb-2 text-xs">Correct Answer</p>
                      <p className="text-3xl font-black text-green-500 italic uppercase">{currentQuestion.correct}</p>
                    </motion.div>
                  )}
                </>
              ) : (
                /* Waiting for quiz to start */
                <div className="text-center py-32 glass-panel rounded-[4rem] border-dashed border-zinc-800">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}>
                    <HelpCircle className="mx-auto text-zinc-800 mb-8" size={80} />
                  </motion.div>
                  <h2 className="text-3xl font-black text-zinc-700 italic uppercase tracking-tighter">Quiz Starting Soon…</h2>
                </div>
              )}
            </motion.div>
          )}

          {/* Round 3 — Buzzer */}
          {gameState.currentRound === '3' && (
            <motion.div key="r3" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="text-center w-full max-w-xl">
              <h2 className="text-5xl font-black text-yellow-500 italic tracking-tighter glow-text-yellow mb-12 uppercase">
                Arena Buzzer
              </h2>
              <button
                onClick={() => buzzerPress(name)}
                className={`w-60 h-60 sm:w-80 sm:h-80 rounded-full border-[16px] sm:border-[20px] flex items-center justify-center mx-auto transition-all ${
                  gameState.buzzerQueue.find((p) => p.name.toLowerCase() === name.toLowerCase())
                    ? 'bg-zinc-900 border-zinc-800 cursor-not-allowed grayscale'
                    : 'bg-red-600 border-red-800 active:bg-red-500 shadow-[0_0_100px_rgba(239,68,68,0.4)]'
                }`}>
                <span className="text-5xl sm:text-7xl font-black text-white italic tracking-tighter animate-pulse">BUZZ</span>
              </button>
              <p className="text-zinc-600 text-xs font-black uppercase tracking-widest mt-6">Press any key to buzz</p>

              <div className="mt-10 space-y-3">
                {gameState.buzzerQueue.slice(0, 3).map((entry, i) => (
                  <div key={entry.id}
                    className={`flex items-center justify-between p-5 rounded-2xl glass-panel ${i === 0 ? 'border-yellow-500/50 bg-yellow-500/10' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                        {i === 0 ? <Crown size={18} /> : i + 1}
                      </div>
                      <span className="font-black text-xl uppercase italic">{entry.name}</span>
                    </div>
                    <span className="font-mono text-zinc-500 text-sm">
                      +{((entry.time - (gameState.buzzerQueue[0]?.time || 0)) / 1000).toFixed(3)}s
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Results */}
          {gameState.currentRound === 'results' && (
            <motion.div key="results" initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-3xl space-y-8 py-16">
              <Trophy className="mx-auto text-yellow-500 drop-shadow-2xl" size={72} />
              <h2 className="text-7xl font-black text-center italic uppercase tracking-tighter glow-text-blue">Final Scores</h2>
              <div className="space-y-4">
                {sortedPlayers.map((p, i) => (
                  <div key={p.id}
                    className={`p-8 rounded-[2.5rem] border-2 flex justify-between items-center glass-panel ${i === 0 ? 'border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.2)] scale-105 z-20' : 'border-white/5'}`}>
                    <div className="flex items-center gap-8">
                      <span className={`text-5xl font-black ${i === 0 ? 'text-yellow-500' : 'text-zinc-800'}`}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <h3 className="text-3xl font-black uppercase italic tracking-tight">{p.name}</h3>
                        <p className="text-zinc-500 text-xs font-black uppercase">Arena Competitor</p>
                      </div>
                    </div>
                    <span className={`text-5xl font-black tracking-tighter ${i === 0 ? 'text-yellow-500' : 'text-blue-500'}`}>
                      {p.score.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer HUD */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 flex justify-between items-center pointer-events-none z-50">
        <div className="glass-panel px-6 py-3 rounded-3xl font-black shadow-2xl flex items-center gap-3 border-white/10">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          <span className="italic text-sm">{name || 'ANONYMOUS'}</span>
        </div>
        <div className="glass-panel px-6 py-3 rounded-3xl font-black shadow-2xl flex items-center gap-3 border-white/10">
          <Crown className="text-yellow-500" size={18} />
          <span className="text-blue-500 text-2xl tracking-tighter">{(me?.score || 0).toFixed(1)}</span>
        </div>
      </footer>
    </div>
  );
};

export default PlayerView;

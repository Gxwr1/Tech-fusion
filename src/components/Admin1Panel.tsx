import React, { useState, useMemo, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import type { Question } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Clock, HelpCircle, Zap, RefreshCw, PlusCircle, ArrowRight,
  Pause, Play, RotateCcw, Users, UserCheck, Trash2, ChevronUp, ChevronDown,
  Eye, X, BookOpen, Radio, Trophy, CheckCircle2, Settings, AlertCircle,
} from 'lucide-react';

const PASSWORD = 'admin1';

const fmtTime = (s: number) =>
  `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

// ── Password Gate ─────────────────────────────────────────────────────────────
const PasswordGate: React.FC<{ onAuth: () => void }> = ({ onAuth }) => {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onAuth();
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] p-6 mesh-gradient">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-10 rounded-3xl w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
          <LayoutDashboard size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-black uppercase italic tracking-tighter mb-1">Controller Hub</h1>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-8">Admin 1 Access</p>
        <form onSubmit={submit} className="space-y-4">
          <input type="password" value={pw} onChange={(e) => { setPw(e.target.value); setErr(false); }}
            placeholder="Enter password" autoFocus
            className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-white text-center font-bold outline-none focus:ring-2 focus:ring-blue-500/30 ${err ? 'border-red-500/50' : 'border-white/10'}`} />
          {err && <p className="text-red-400 text-xs font-bold">Incorrect password</p>}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all active:scale-95">
            Access Dashboard
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const Admin1Panel: React.FC = () => {
  const [isAuth, setIsAuth] = useState(false);
  const {
    gameState, adminChangeRound, adminStartRound1, adminPauseRound1, adminResetRound1,
    adminForceFinishR1, adminCollectR1Paper, adminResetEntireQuiz,
    adminLoadPresetQuestions, adminAddQuestion, adminRemoveQuestion, adminReorderQuestions,
    adminSetR2TimerConfig, adminNextQuestion, adminPauseRound2, adminRevealAnswer,
    adminResetRound2, adminResetBuzzer,
  } = useSocket();

  // ── Local State ──
  const [timerInput, setTimerInput] = useState(600);
  const [r2Tab, setR2Tab] = useState<'bank' | 'control'>('bank');
  const [r2TimerInput, setR2TimerInput] = useState(20);
  const [showAddForm, setShowAddForm] = useState(false);
  const [qForm, setQForm] = useState({ question: '', options: ['', '', '', ''], correct: '' });
  const [previewQ, setPreviewQ] = useState<Question | null>(null);

  // ── Derived ──
  const allPlayers = gameState.players;
  const livePlayers = useMemo(() => allPlayers.filter((p) => p.isOnline), [allPlayers]);

  const r1Working = useMemo(() => allPlayers.filter((p) => p.r1FinishTime === null), [allPlayers]);
  const r1Finished = useMemo(() => allPlayers.filter((p) => p.r1FinishTime !== null && !p.r1PaperCollected), [allPlayers]);
  const r1Collected = useMemo(() => allPlayers.filter((p) => p.r1PaperCollected), [allPlayers]);

  const currentQ = gameState.round2CurrentIndex >= 0
    ? gameState.round2Questions[gameState.round2CurrentIndex]
    : null;

  const answerCounts = useMemo(() => {
    if (!currentQ) return {} as Record<string, number>;
    const qIdx = gameState.round2CurrentIndex;
    const counts: Record<string, number> = {};
    currentQ.options.forEach((o) => (counts[o] = 0));
    gameState.players.filter((p) => p.isOnline).forEach((p) => {
      const ans = p.r2Answers[qIdx];
      if (ans) counts[ans.answer] = (counts[ans.answer] || 0) + 1;
    });
    return counts;
  }, [gameState.players, gameState.round2CurrentIndex, currentQ]);

  const totalAnswered = Object.values(answerCounts).reduce((s, c) => s + c, 0);
  const quizStarted = gameState.round2CurrentIndex >= 0;
  const isLastQuestion =
    gameState.round2CurrentIndex === gameState.round2Questions.length - 1;

  const timerColor =
    gameState.round1Timer > 120 ? 'text-blue-400' :
    gameState.round1Timer > 30  ? 'text-amber-400' : 'text-red-500';

  // ── Handlers ──
  const moveUp = useCallback((i: number) => {
    const qs = [...gameState.round2Questions];
    [qs[i - 1], qs[i]] = [qs[i], qs[i - 1]];
    adminReorderQuestions(qs);
  }, [gameState.round2Questions, adminReorderQuestions]);

  const moveDown = useCallback((i: number) => {
    const qs = [...gameState.round2Questions];
    [qs[i], qs[i + 1]] = [qs[i + 1], qs[i]];
    adminReorderQuestions(qs);
  }, [gameState.round2Questions, adminReorderQuestions]);

  const handleAddQ = () => {
    if (!qForm.question.trim() || !qForm.correct.trim()) return;
    adminAddQuestion(qForm);
    setQForm({ question: '', options: ['', '', '', ''], correct: '' });
    setShowAddForm(false);
  };

  const nukeSession = () => {
    if (window.confirm('Reset ENTIRE session? This cannot be undone.')) adminResetEntireQuiz();
  };

  if (!isAuth) return <PasswordGate onAuth={() => setIsAuth(true)} />;

  // ── Round 1 View ─────────────────────────────────────────────────────────────
  const Round1View = (
    <div className="space-y-6">
      {/* Timer Card */}
      <div className="glass-panel p-6 rounded-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
            <Clock className="text-emerald-500" size={22} /> Round 01 — Chronos
          </h2>
          <div className="flex gap-2">
            <button onClick={adminPauseRound1}
              className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-yellow-400 transition-all">
              {gameState.round1Paused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
            </button>
            <button onClick={adminResetRound1}
              className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-red-400 transition-all">
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <input type="number" value={timerInput} onChange={(e) => setTimerInput(Number(e.target.value))}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 w-32 font-black text-lg outline-none focus:ring-2 focus:ring-blue-500/20" />
          <span className="text-zinc-500 text-sm">seconds</span>
          <button onClick={() => adminStartRound1(timerInput)}
            className="bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 rounded-xl font-black uppercase text-xs transition-all active:scale-95">
            {gameState.round1Active ? 'Restart' : 'Start'}
          </button>
          {gameState.round1Active && (
            <span className="ml-2 text-xs font-black uppercase text-emerald-500 animate-pulse">● Live</span>
          )}
          {gameState.round1Paused && (
            <span className="ml-2 text-xs font-black uppercase text-yellow-500">⏸ Paused</span>
          )}
        </div>

        <div className={`text-8xl font-black tabular-nums tracking-tighter text-center py-8 bg-black/30 rounded-2xl border border-white/5 ${timerColor}`}>
          {fmtTime(gameState.round1Timer)}
        </div>
      </div>

      {/* Participant Management */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-white/5 bg-white/5">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
            <Users size={14} /> Participant Management
          </h3>
        </div>
        <div className="p-5 space-y-5">

          {/* Working */}
          {r1Working.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">
                ⏱ Working ({r1Working.length})
              </p>
              <div className="space-y-1.5">
                {r1Working.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-2.5 bg-white/5 rounded-xl border border-white/5 group">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${p.isOnline ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                      <span className="font-bold text-sm">{p.name}</span>
                      {!p.isOnline && <span className="text-[9px] text-zinc-600 font-black uppercase">offline</span>}
                    </div>
                    <button onClick={() => adminForceFinishR1(p.id)}
                      className="opacity-0 group-hover:opacity-100 text-[9px] font-black uppercase bg-amber-500/10 text-amber-500 px-2 py-1 rounded transition-all border border-amber-500/20">
                      Force Finish
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Finished – awaiting collection */}
          {r1Finished.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">
                🏁 Finished — Awaiting Collection ({r1Finished.length})
              </p>
              <div className="space-y-1.5">
                {r1Finished.map((p) => (
                  <motion.div layout key={p.id}
                    className="flex items-center justify-between px-4 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                    <div>
                      <span className="font-bold text-sm text-amber-300">{p.name}</span>
                      <span className="ml-3 text-xs font-mono text-amber-500/70">
                        {fmtTime(p.r1FinishTime!)}
                      </span>
                    </div>
                    <button onClick={() => adminCollectR1Paper(p.id)}
                      className="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white px-3 py-1.5 rounded-lg font-black text-[10px] uppercase border border-emerald-500/30 transition-all active:scale-95">
                      <CheckCircle2 size={12} /> Collect Paper ✓
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Collected */}
          {r1Collected.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">
                ✓ Paper Collected ({r1Collected.length})
              </p>
              <div className="space-y-1.5">
                {r1Collected.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                    <span className="font-bold text-sm text-emerald-400">{p.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-zinc-500">{fmtTime(p.r1FinishTime!)}</span>
                      <UserCheck size={14} className="text-emerald-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {allPlayers.length === 0 && (
            <p className="text-center text-zinc-700 font-black text-xs uppercase italic py-8">
              No participants yet
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // ── Round 2 View ─────────────────────────────────────────────────────────────
  const Round2View = (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 w-fit gap-1">
        {([['bank', <BookOpen size={14} />, 'Question Bank'], ['control', <Radio size={14} />, 'Live Control']] as const).map(([tab, icon, label]) => (
          <button key={tab} onClick={() => setR2Tab(tab as 'bank' | 'control')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-black text-[11px] uppercase tracking-widest transition-all ${r2Tab === tab ? 'bg-purple-600 text-white' : 'text-zinc-500 hover:text-white'}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Question Bank Tab */}
      {r2Tab === 'bank' && (
        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className="p-5 border-b border-white/5 bg-white/5 flex flex-wrap gap-4 items-center justify-between">
            <h2 className="text-sm font-black italic uppercase tracking-tighter flex items-center gap-2">
              <HelpCircle className="text-purple-500" size={16} /> Question Bank ({gameState.round2Questions.length})
            </h2>
            <div className="flex gap-2 flex-wrap">
              {/* Timer config */}
              <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
                <Settings size={12} className="text-zinc-500" />
                <span className="text-[10px] font-black uppercase text-zinc-500">Timer:</span>
                <input type="number" value={r2TimerInput} onChange={(e) => setR2TimerInput(Number(e.target.value))}
                  className="bg-transparent w-12 text-center font-black text-sm outline-none" />
                <span className="text-[10px] text-zinc-600">sec</span>
                <button onClick={() => adminSetR2TimerConfig(r2TimerInput)}
                  className="text-[10px] font-black uppercase text-blue-400 hover:text-blue-300 transition-colors">Apply</button>
              </div>
              <div className="flex bg-purple-900/40 p-1 rounded-xl border border-purple-500/20 gap-1 flex-wrap">
                {[
                  { num: 1, label: 'Pre-Easy' },
                  { num: 2, label: 'Easy' },
                  { num: 3, label: 'Medium' },
                  { num: 4, label: 'Hard' }
                ].map((set) => (
                  <button key={set.num} onClick={() => adminLoadPresetQuestions(set.num)}
                    className="px-3 py-1 rounded-lg font-black text-[10px] uppercase text-purple-300 hover:bg-purple-600 hover:text-white transition-all">
                    Set {set.num}: {set.label}
                  </button>
                ))}
              </div>
              {!quizStarted && (
                <button onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase flex items-center gap-1 transition-all">
                  <PlusCircle size={12} /> Add Custom
                </button>
              )}
              {quizStarted && (
                <button onClick={adminResetRound2}
                  className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase transition-all">
                  Reset Quiz
                </button>
              )}
            </div>
          </div>

          {/* Add custom form */}
          <AnimatePresence>
            {showAddForm && !quizStarted && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                className="overflow-hidden border-b border-white/5">
                <div className="p-5 space-y-3 bg-purple-500/5">
                  <input value={qForm.question} onChange={(e) => setQForm({ ...qForm, question: e.target.value })}
                    placeholder="Question text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/30" />
                  <div className="grid grid-cols-2 gap-2">
                    {qForm.options.map((o, i) => (
                      <input key={i} value={o}
                        onChange={(e) => { const opts = [...qForm.options]; opts[i] = e.target.value; setQForm({ ...qForm, options: opts }); }}
                        placeholder={`Option ${['A','B','C','D'][i]}`}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/30" />
                    ))}
                  </div>
                  <input value={qForm.correct} onChange={(e) => setQForm({ ...qForm, correct: e.target.value })}
                    placeholder="Correct answer (must match option exactly)" className="w-full bg-white/5 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-emerald-400 font-bold outline-none focus:ring-2 focus:ring-emerald-500/30" />
                  <div className="flex gap-2">
                    <button onClick={handleAddQ} className="bg-purple-600 hover:bg-purple-500 px-5 py-2 rounded-xl font-black text-xs uppercase transition-all">Add Question</button>
                    <button onClick={() => setShowAddForm(false)} className="bg-white/5 px-4 py-2 rounded-xl font-black text-xs uppercase text-zinc-500">Cancel</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Question list */}
          <div className="divide-y divide-white/5 max-h-[50vh] overflow-y-auto no-scrollbar">
            {gameState.round2Questions.length === 0 ? (
              <div className="p-16 text-center">
                <HelpCircle className="mx-auto text-zinc-800 mb-4" size={48} />
                <p className="text-zinc-600 font-black uppercase text-xs">No questions yet — load presets or add custom</p>
              </div>
            ) : (
              gameState.round2Questions.map((q, i) => (
                <div key={i}
                  className={`flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors group ${i === gameState.round2CurrentIndex ? 'bg-purple-500/10 border-l-2 border-purple-500' : ''}`}>
                  <span className="text-zinc-600 text-xs font-black w-6 text-center">{i + 1}</span>
                  <p className="flex-1 text-sm text-zinc-300 truncate">{q.question}</p>
                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap shrink-0">
                    {q.correct.length > 12 ? q.correct.slice(0, 12) + '…' : q.correct}
                  </span>
                  {!quizStarted && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button disabled={i === 0} onClick={() => moveUp(i)} className="p-1 rounded hover:bg-white/10 disabled:opacity-20 transition-all"><ChevronUp size={14} /></button>
                      <button disabled={i === gameState.round2Questions.length - 1} onClick={() => moveDown(i)} className="p-1 rounded hover:bg-white/10 disabled:opacity-20 transition-all"><ChevronDown size={14} /></button>
                      <button onClick={() => setPreviewQ(q)} className="p-1 rounded hover:bg-white/10 text-blue-400 transition-all"><Eye size={14} /></button>
                      <button onClick={() => adminRemoveQuestion(i)} className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-all"><Trash2 size={14} /></button>
                    </div>
                  )}
                  {quizStarted && (
                    <button onClick={() => setPreviewQ(q)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-blue-400 transition-all"><Eye size={14} /></button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Live Control Tab */}
      {r2Tab === 'control' && (
        <div className="glass-panel rounded-3xl overflow-hidden">
          {!quizStarted ? (
            /* Not started yet */
            <div className="p-12 text-center space-y-6">
              <Radio className="mx-auto text-purple-500 animate-pulse" size={48} />
              <div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">
                  {gameState.round2Questions.length > 0 ? 'Ready to Start' : 'No Questions Loaded'}
                </h3>
                <p className="text-zinc-500 text-sm">{gameState.round2Questions.length} questions · {gameState.round2TimerConfig}s per question</p>
              </div>
              {gameState.round2Questions.length > 0 && (
                <button onClick={adminNextQuestion}
                  className="inline-flex items-center gap-3 bg-purple-600 hover:bg-purple-500 px-10 py-5 rounded-2xl font-black text-lg uppercase italic transition-all active:scale-95 shadow-xl">
                  <Play fill="currentColor" size={20} /> Start Quiz — Q1
                </button>
              )}
            </div>
          ) : (
            /* Active / Revealed */
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-purple-400 tracking-widest">
                    Question {gameState.round2CurrentIndex + 1} / {gameState.round2Questions.length}
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    {gameState.round2Active && !gameState.round2Revealed && (
                      <span className="text-[9px] font-black uppercase text-emerald-500 animate-pulse">● Live</span>
                    )}
                    {gameState.round2Paused && (
                      <span className="text-[9px] font-black uppercase text-yellow-500">⏸ Paused</span>
                    )}
                    {gameState.round2Revealed && (
                      <span className="text-[9px] font-black uppercase text-blue-400">✓ Revealed</span>
                    )}
                    <span className="text-[9px] text-zinc-600 font-black uppercase">
                      {totalAnswered}/{livePlayers.length} answered
                    </span>
                  </div>
                </div>
                {/* Timer */}
                <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center font-black text-3xl ${
                  gameState.round2Timer <= 5 ? 'border-red-500 text-red-500 bg-red-500/10' :
                  gameState.round2Timer <= 10 ? 'border-amber-500 text-amber-500 bg-amber-500/10' :
                  'border-blue-500 text-blue-400 bg-blue-500/10'
                }`}>
                  {gameState.round2Timer}
                </div>
              </div>

              {/* Timer bar */}
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full transition-colors duration-500 ${
                    gameState.round2Timer <= 5 ? 'bg-red-500' :
                    gameState.round2Timer <= 10 ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                  animate={{ width: `${(gameState.round2Timer / gameState.round2TimerConfig) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Question */}
              {currentQ && (
                <div className="bg-black/30 rounded-2xl p-6 border border-white/5">
                  <p className="text-xl font-bold leading-snug">{currentQ.question}</p>
                </div>
              )}

              {/* Answer options with live counts */}
              <div className="space-y-3">
                {currentQ?.options.map((opt, i) => {
                  const count = answerCounts[opt] || 0;
                  const pct = livePlayers.length > 0 ? (count / livePlayers.length) * 100 : 0;
                  const isCorrect = gameState.round2Revealed && opt === currentQ.correct;
                  return (
                    <div key={i} className={`relative h-14 rounded-2xl overflow-hidden border-2 transition-colors ${
                      isCorrect ? 'border-emerald-500' : 'border-white/10'
                    }`}>
                      <motion.div
                        className={`absolute inset-y-0 left-0 ${isCorrect ? 'bg-emerald-500/30' : 'bg-blue-500/20'}`}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.4 }}
                      />
                      <div className="absolute inset-0 flex items-center justify-between px-5">
                        <span className={`font-bold text-sm ${isCorrect ? 'text-emerald-300' : ''}`}>
                          {isCorrect && '✓ '}{['A','B','C','D'][i]}. {opt}
                        </span>
                        <span className="font-black text-base text-zinc-400">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Controls */}
              <div className="flex gap-3 pt-2 flex-wrap">
                {gameState.round2Active && (
                  <button onClick={adminPauseRound2}
                    className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-xl font-black text-xs uppercase transition-all">
                    {gameState.round2Paused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
                    {gameState.round2Paused ? 'Resume' : 'Pause'}
                  </button>
                )}
                {!gameState.round2Revealed && (
                  <button onClick={adminRevealAnswer}
                    className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-5 py-3 rounded-xl font-black text-xs uppercase transition-all">
                    <Eye size={16} /> Reveal Answer
                  </button>
                )}
                {gameState.round2Revealed && (
                  <button onClick={adminNextQuestion}
                    disabled={isLastQuestion}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 px-5 py-3 rounded-xl font-black text-xs uppercase transition-all active:scale-95">
                    Next Question <ArrowRight size={16} />
                  </button>
                )}
                {gameState.round2Revealed && isLastQuestion && (
                  <span className="flex items-center gap-2 text-xs font-black text-emerald-500 uppercase px-4 py-3">
                    <CheckCircle2 size={16} /> Quiz Complete!
                  </span>
                )}
                <button onClick={adminResetRound2}
                  className="ml-auto flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-3 rounded-xl font-black text-xs uppercase transition-all">
                  <RotateCcw size={14} /> Reset
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── Round 3 View ─────────────────────────────────────────────────────────────
  const Round3View = (
    <div className="space-y-6">
      <div className="glass-panel p-8 rounded-3xl border-yellow-500/10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
            <Zap className="text-yellow-500" size={24} fill="currentColor" /> Buzzer Arena
          </h2>
          <button onClick={adminResetBuzzer}
            className="flex items-center gap-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 px-5 py-3 rounded-xl font-black text-xs uppercase transition-all">
            <RefreshCw size={16} /> Clear Queue
          </button>
        </div>
        <div className="space-y-3">
          {gameState.buzzerQueue.length === 0 ? (
            <div className="text-center py-16 text-zinc-700 font-black uppercase text-xs italic">
              Awaiting buzzer presses…
            </div>
          ) : (
            gameState.buzzerQueue.map((entry, i) => (
              <motion.div layout key={entry.id}
                className={`flex items-center justify-between p-5 rounded-2xl border ${
                  i === 0 ? 'bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : 'bg-white/5 border-white/5'
                }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                    #{i + 1}
                  </div>
                  <span className="font-black text-xl">{entry.name}</span>
                </div>
                <span className="font-mono text-sm text-zinc-500">
                  +{((entry.time - (gameState.buzzerQueue[0]?.time || 0)) / 1000).toFixed(3)}s
                </span>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // ── Results View ──────────────────────────────────────────────────────────────
  const ResultsView = (
    <div className="glass-panel p-8 rounded-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="text-yellow-500" size={24} />
        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Final Results</h2>
      </div>
      <div className="space-y-2">
        {[...allPlayers].sort((a, b) => b.score - a.score).map((p, i) => (
          <div key={p.id} className={`flex items-center justify-between p-4 rounded-2xl border ${i === 0 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-white/5 border-white/5'}`}>
            <div className="flex items-center gap-3">
              <span className={`font-black text-sm w-6 ${i === 0 ? 'text-yellow-500' : 'text-zinc-600'}`}>{i + 1}</span>
              <span className="font-bold">{p.name}</span>
              {!p.isOnline && <span className="text-[9px] text-zinc-600 uppercase font-black">offline</span>}
            </div>
            <span className={`font-black text-lg ${i === 0 ? 'text-yellow-500' : 'text-blue-400'}`}>{p.score.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Sidebar ───────────────────────────────────────────────────────────────────
  const Sidebar = (
    <div className="glass-panel p-5 rounded-3xl h-full flex flex-col" style={{ maxHeight: 'calc(100vh - 160px)' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
          Live ({livePlayers.length})
        </h3>
      </div>
      <div className="overflow-y-auto no-scrollbar flex-1 space-y-1.5 pr-0.5">
        {allPlayers.map((p) => {
          const hasAnswered = gameState.round2CurrentIndex >= 0 && p.r2Answers[gameState.round2CurrentIndex] !== undefined;
          const hasBuzzed = gameState.buzzerQueue.some((b) => b.id === p.id);
          return (
            <motion.div layout key={p.id}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.isOnline ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                <span className="text-xs font-bold truncate">{p.name}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-1">
                {gameState.currentRound === '1' && p.r1PaperCollected && <UserCheck size={11} className="text-emerald-500" />}
                {gameState.currentRound === '1' && p.r1FinishTime !== null && !p.r1PaperCollected && <CheckCircle2 size={11} className="text-amber-500" />}
                {gameState.currentRound === '2' && hasAnswered && <CheckCircle2 size={11} className="text-purple-400" />}
                {gameState.currentRound === '3' && hasBuzzed && <Zap size={11} className="text-yellow-500" />}
              </div>
            </motion.div>
          );
        })}
        {allPlayers.length === 0 && (
          <p className="text-center text-zinc-800 font-black text-[10px] uppercase italic py-12">
            Awaiting Participants
          </p>
        )}
      </div>
    </div>
  );

  // ── Root Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 mesh-gradient overflow-y-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">

        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-center glass-panel p-5 rounded-3xl border-white/5 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black italic uppercase tracking-tighter">
                Controller <span className="text-blue-500 font-normal">Hub</span>
              </h1>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Admin 1</p>
            </div>
          </div>

          <div className="flex gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5 flex-wrap">
            {(['lobby', '1', '2', '3', 'results'] as const).map((r) => (
              <button key={r} onClick={() => adminChangeRound(r)}
                className={`px-4 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${
                  gameState.currentRound === r ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-white'
                }`}>
                {r === 'lobby' ? 'Lobby' : r === 'results' ? 'Results' : `R${r}`}
              </button>
            ))}
          </div>

          <button onClick={nukeSession}
            className="flex items-center gap-2 text-red-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-colors">
            <AlertCircle size={14} /> Reset Session
          </button>
        </header>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {gameState.currentRound === 'lobby' && (
                <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="glass-panel p-20 rounded-3xl border-dashed border-white/5 text-center">
                  <Users className="mx-auto text-zinc-800 mb-6" size={64} />
                  <h3 className="text-2xl font-black text-zinc-700 italic uppercase tracking-tighter">
                    Awaiting Arena Engagement
                  </h3>
                  <p className="text-zinc-800 text-xs font-black uppercase mt-2">{livePlayers.length} participants connected</p>
                </motion.div>
              )}
              {gameState.currentRound === '1' && (
                <motion.div key="r1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{Round1View}</motion.div>
              )}
              {gameState.currentRound === '2' && (
                <motion.div key="r2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{Round2View}</motion.div>
              )}
              {gameState.currentRound === '3' && (
                <motion.div key="r3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{Round3View}</motion.div>
              )}
              {gameState.currentRound === 'results' && (
                <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{ResultsView}</motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="lg:col-span-1">{Sidebar}</div>
        </div>
      </div>

      {/* Question Preview Modal */}
      <AnimatePresence>
        {previewQ && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setPreviewQ(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel p-8 rounded-3xl w-full max-w-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Player Preview</p>
                  <h3 className="text-lg font-black italic uppercase tracking-tighter mt-0.5">Question Preview</h3>
                </div>
                <button onClick={() => setPreviewQ(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"><X size={18} /></button>
              </div>
              <div className="bg-black/30 rounded-2xl p-6 border border-white/5 mb-6">
                <p className="text-2xl font-bold leading-snug">{previewQ.question}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {previewQ.options.map((opt, i) => (
                  <div key={i} className={`p-4 rounded-2xl border-2 font-bold ${
                    opt === previewQ.correct
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                      : 'border-white/10 bg-white/5 text-zinc-300'
                  }`}>
                    <span className="text-zinc-500 text-sm mr-2">{['A','B','C','D'][i]}.</span>
                    {opt}
                    {opt === previewQ.correct && <span className="ml-2 text-emerald-500">✓</span>}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Admin1Panel;

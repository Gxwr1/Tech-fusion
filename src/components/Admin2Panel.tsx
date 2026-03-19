import React, { useState, useMemo } from 'react';
import { useSocket } from '../context/SocketContext';
import { motion } from 'framer-motion';
import {
  TrendingUp, Trophy, FileText, BarChart3, Zap, Save, Plus, Minus,
  CheckCircle2, XCircle, Clock, AlertCircle,
} from 'lucide-react';

const PASSWORD = 'admin2';

const fmtTime = (s: number) =>
  `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

// ── Password Gate ─────────────────────────────────────────────────────────────
const PasswordGate: React.FC<{ onAuth: () => void }> = ({ onAuth }) => {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === PASSWORD) onAuth();
    else { setErr(true); setPw(''); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] p-6 mesh-gradient">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-10 rounded-3xl w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-emerald-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
          <TrendingUp size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-black uppercase italic tracking-tighter mb-1">Marker Console</h1>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-8">Admin 2 Access</p>
        <form onSubmit={submit} className="space-y-4">
          <input type="password" value={pw} onChange={(e) => { setPw(e.target.value); setErr(false); }}
            placeholder="Enter password" autoFocus
            className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-white text-center font-bold outline-none focus:ring-2 focus:ring-emerald-500/30 ${err ? 'border-red-500/50' : 'border-white/10'}`} />
          {err && <p className="text-red-400 text-xs font-bold">Incorrect password</p>}
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl transition-all active:scale-95">
            Access Dashboard
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
type AdminTab = 'r1' | 'r2' | 'r3';

const Admin2Panel: React.FC = () => {
  const [isAuth, setIsAuth] = useState(false);
  const { gameState, adminUpdateR1Mark, adminUpdateR3Score } = useSocket();

  const [activeTab, setActiveTab] = useState<AdminTab>('r1');
  const [r1Marks, setR1Marks] = useState<Record<string, string>>({});

  const allPlayers = gameState.players;
  const livePlayers = useMemo(() => allPlayers.filter((p) => p.isOnline), [allPlayers]);

  const leaderboard = useMemo(
    () => [...allPlayers].sort((a, b) => b.score - a.score),
    [allPlayers]
  );

  // R1 categories
  const r1Collected = useMemo(() => allPlayers.filter((p) => p.r1PaperCollected), [allPlayers]);
  const r1Pending   = useMemo(() => allPlayers.filter((p) => p.r1FinishTime !== null && !p.r1PaperCollected), [allPlayers]);
  const r1Working   = useMemo(() => allPlayers.filter((p) => p.r1FinishTime === null), [allPlayers]);

  const handleSaveMark = (playerId: string, currentMark: number) => {
    const valStr = r1Marks[playerId];
    const val = valStr !== undefined ? parseFloat(valStr) : currentMark;
    if (isNaN(val)) return;
    adminUpdateR1Mark(playerId, val);
  };

  if (!isAuth) return <PasswordGate onAuth={() => setIsAuth(true)} />;

  // ── R1 Scoring Tab ────────────────────────────────────────────────────────────
  const R1Tab = (
    <div className="space-y-6">
      {/* Collected – can score */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-white/5 bg-emerald-500/5 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
            <CheckCircle2 size={14} /> Ready to Score ({r1Collected.length})
          </h3>
          <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">
            Formula: Mark + (Time / 10)
          </p>
        </div>
        {r1Collected.length === 0 ? (
          <div className="p-10 text-center text-zinc-700 font-black text-xs uppercase italic">
            No papers collected yet — Admin 1 must tick "Collect Paper"
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {r1Collected.map((p) => {
              const markStr = r1Marks[p.id] ?? String(p.r1ObtainedMark);
              const markNum = parseFloat(markStr) || 0;
              const r1Pts   = markNum + (p.r1FinishTime || 0) / 10;
              return (
                <div key={p.id} className="p-5 hover:bg-white/[0.02] transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Name + time */}
                    <div className="flex-1">
                      <p className="font-black text-base text-zinc-100">{p.name}</p>
                      <p className="text-xs text-zinc-500 font-mono mt-0.5 flex items-center gap-1">
                        <Clock size={11} />
                        Finish: {p.r1FinishTime !== null ? fmtTime(p.r1FinishTime) : '—'}
                        <span className="text-zinc-600 ml-1">({p.r1FinishTime ?? 0}s remaining)</span>
                      </p>
                    </div>

                    {/* Mark input */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase">Mark</label>
                        <input
                          type="number" min={0} step={0.5}
                          value={markStr}
                          onChange={(e) => setR1Marks({ ...r1Marks, [p.id]: e.target.value })}
                          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 w-20 text-center font-black text-sm focus:ring-2 focus:ring-emerald-500/30 outline-none"
                        />
                      </div>
                      <button onClick={() => handleSaveMark(p.id, p.r1ObtainedMark)}
                        className="p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-all border border-emerald-500/20">
                        <Save size={15} />
                      </button>
                    </div>

                    {/* Score preview */}
                    <div className="text-right min-w-[110px]">
                      <p className="text-[10px] text-zinc-600 font-black uppercase">Preview</p>
                      <p className="font-mono text-sm text-zinc-400">
                        {markNum} + {((p.r1FinishTime || 0) / 10).toFixed(1)} =
                      </p>
                      <p className="font-black text-xl text-emerald-400">{r1Pts.toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending collection */}
      {r1Pending.length > 0 && (
        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-amber-500/5">
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
              <AlertCircle size={13} /> Finished — Awaiting Paper Collection ({r1Pending.length})
            </h3>
          </div>
          <div className="divide-y divide-white/5">
            {r1Pending.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                <span className="font-bold text-sm text-amber-300">{p.name}</span>
                <span className="text-xs font-mono text-zinc-500">{p.r1FinishTime !== null ? fmtTime(p.r1FinishTime) : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Still working */}
      {r1Working.length > 0 && (
        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Clock size={13} /> Still Working ({r1Working.length})
            </h3>
          </div>
          <div className="divide-y divide-white/5">
            {r1Working.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3 opacity-50">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${p.isOnline ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                  <span className="font-bold text-sm">{p.name}</span>
                </div>
                <span className="text-[10px] text-zinc-600 font-black uppercase">In Progress</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ── R2 Results Tab ────────────────────────────────────────────────────────────
  const R2Tab = (
    <div className="glass-panel rounded-3xl overflow-hidden">
      <div className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-widest text-purple-400 flex items-center gap-2">
          <BarChart3 size={14} /> MCQ Auto-Scores
        </h3>
        <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">
          Scores auto-validated · {gameState.round2TimerConfig}s per question
        </p>
      </div>
      {gameState.round2Questions.length === 0 ? (
        <div className="p-12 text-center text-zinc-700 font-black text-xs uppercase italic">
          No questions loaded yet
        </div>
      ) : (
        <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto no-scrollbar">
          {[...allPlayers].sort((a, b) => {
            const aR2 = Object.values(a.r2Answers).filter((x) => x.isCorrect).reduce((s, x) => s + x.timeRemaining, 0);
            const bR2 = Object.values(b.r2Answers).filter((x) => x.isCorrect).reduce((s, x) => s + x.timeRemaining, 0);
            return bR2 - aR2;
          }).map((p) => {
            const answered = Object.keys(p.r2Answers).length;
            const correct  = Object.values(p.r2Answers).filter((a) => a.isCorrect).length;
            const r2Score  = Object.values(p.r2Answers).filter((a) => a.isCorrect).reduce((s, a) => s + a.timeRemaining, 0);
            return (
              <div key={p.id} className="px-6 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${p.isOnline ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                    <span className="font-bold text-sm">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-[9px] text-zinc-600 font-black uppercase">Answered</p>
                      <p className="font-black text-sm">{answered}/{gameState.round2Questions.length}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-600 font-black uppercase">Correct</p>
                      <p className="font-black text-sm text-emerald-400">{correct}/{answered || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-600 font-black uppercase">R2 Score</p>
                      <p className="font-black text-lg text-purple-400">+{r2Score}</p>
                    </div>
                  </div>
                </div>
                {/* Per-question dots */}
                {answered > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {Array.from({ length: gameState.round2Questions.length }, (_, i) => {
                      const ans = p.r2Answers[i];
                      if (!ans) return <div key={i} className="w-5 h-5 rounded bg-zinc-800 border border-white/5" title={`Q${i + 1}: Not answered`} />;
                      return (
                        <div key={i} title={`Q${i + 1}: ${ans.answer} (${ans.isCorrect ? '✓' : '✗'}, +${ans.timeRemaining}s)`}
                          className={`w-5 h-5 rounded flex items-center justify-center ${ans.isCorrect ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-red-500/20 border border-red-500/30'}`}>
                          {ans.isCorrect
                            ? <CheckCircle2 size={10} className="text-emerald-400" />
                            : <XCircle size={10} className="text-red-400" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── R3 Scoring Tab ────────────────────────────────────────────────────────────
  const R3Tab = (
    <div className="space-y-5">
      {/* Buzzer queue */}
      {gameState.buzzerQueue.length > 0 && (
        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-yellow-500/5">
            <h3 className="text-xs font-black uppercase tracking-widest text-yellow-400 flex items-center gap-2">
              <Zap size={13} fill="currentColor" /> Buzzer Queue
            </h3>
          </div>
          <div className="divide-y divide-white/5">
            {gameState.buzzerQueue.map((entry, i) => (
              <div key={entry.id} className={`flex items-center justify-between px-5 py-3 ${i === 0 ? 'bg-yellow-500/5' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className={`font-black text-sm ${i === 0 ? 'text-yellow-500' : 'text-zinc-500'}`}>#{i + 1}</span>
                  <span className="font-bold text-sm">{entry.name}</span>
                </div>
                <span className="font-mono text-xs text-zinc-600">
                  +{((entry.time - (gameState.buzzerQueue[0]?.time || 0)) / 1000).toFixed(3)}s
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score adjustments */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
            <Zap size={14} className="text-yellow-500" /> Score Adjustments
          </h3>
          <div className="flex items-center gap-4 text-[9px] text-zinc-600 font-black uppercase">
            <span className="text-emerald-400">+1 = Correct</span>
            <span className="text-red-400">−0.5 = Wrong</span>
          </div>
        </div>
        <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto no-scrollbar">
          {livePlayers.length === 0 ? (
            <div className="p-10 text-center text-zinc-700 font-black text-xs uppercase italic">No live participants</div>
          ) : (
            livePlayers.map((p) => {
              const hasBuzzed = gameState.buzzerQueue.some((b) => b.id === p.id);
              return (
                <div key={p.id} className={`flex items-center justify-between px-5 py-3.5 ${hasBuzzed ? 'bg-yellow-500/5' : ''}`}>
                  <div className="flex items-center gap-2">
                    {hasBuzzed && <Zap size={12} className="text-yellow-500" />}
                    <span className={`font-bold text-sm ${hasBuzzed ? 'text-yellow-300' : ''}`}>{p.name}</span>
                    <span className="text-[10px] text-zinc-600 font-black">R3: {(p.r3Score || 0).toFixed(1)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => adminUpdateR3Score(p.id, 1)}
                      className="flex items-center gap-1 w-20 justify-center bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 px-3 py-2 rounded-xl font-black text-xs transition-all active:scale-95">
                      <Plus size={13} /> +1
                    </button>
                    <button onClick={() => adminUpdateR3Score(p.id, -0.5)}
                      className="flex items-center gap-1 w-20 justify-center bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 px-3 py-2 rounded-xl font-black text-xs transition-all active:scale-95">
                      <Minus size={13} /> −0.5
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  // ── Leaderboard Sidebar ───────────────────────────────────────────────────────
  const Leaderboard = (
    <div className="glass-panel p-5 rounded-3xl flex flex-col" style={{ maxHeight: 'calc(100vh - 160px)' }}>
      <div className="flex items-center gap-2 mb-5">
        <Trophy size={16} className="text-yellow-500" />
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Live Leaderboard</h3>
      </div>
      <div className="overflow-y-auto no-scrollbar flex-1 space-y-2">
        {leaderboard.map((p, i) => (
          <motion.div layout key={p.id}
            className={`flex items-center justify-between p-3 rounded-2xl border ${
              i === 0 ? 'bg-yellow-500/10 border-yellow-500/20 shadow-[0_0_16px_rgba(234,179,8,0.1)]' : 'bg-white/5 border-white/5'
            }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 ${
                i === 0 ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-500'
              }`}>{i + 1}</div>
              <div className="min-w-0">
                <p className="font-bold text-xs truncate text-zinc-200">{p.name}</p>
                {!p.isOnline && <p className="text-[9px] text-zinc-700 font-black uppercase">offline</p>}
              </div>
            </div>
            <span className={`font-black text-sm shrink-0 ml-2 ${i === 0 ? 'text-yellow-500' : 'text-zinc-400'}`}>
              {p.score.toFixed(1)}
            </span>
          </motion.div>
        ))}
        {leaderboard.length === 0 && (
          <p className="text-center text-zinc-800 font-black text-[10px] uppercase italic py-12">No scores yet</p>
        )}
      </div>
    </div>
  );

  // ── Root Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 mesh-gradient overflow-y-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center glass-panel p-5 rounded-3xl border-white/5 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black italic uppercase tracking-tighter">
                Marker <span className="text-emerald-500 font-normal">Console</span>
              </h1>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Admin 2</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black uppercase text-zinc-400">
                Live: {livePlayers.length}
              </span>
              <span className="text-zinc-700 mx-1">|</span>
              <span className="text-xs font-black uppercase text-blue-400">
                Round {gameState.currentRound.toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Tab Nav */}
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 w-fit gap-1">
          {([
            ['r1', <FileText size={13} />, 'R1 Scoring'],
            ['r2', <BarChart3 size={13} />, 'R2 MCQ'],
            ['r3', <Zap size={13} />, 'R3 Buzzer'],
          ] as const).map(([tab, icon, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab as AdminTab)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-black text-[11px] uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-emerald-600 text-white' : 'text-zinc-500 hover:text-white'
              }`}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
          <div className="xl:col-span-2">
            {activeTab === 'r1' && R1Tab}
            {activeTab === 'r2' && R2Tab}
            {activeTab === 'r3' && R3Tab}
          </div>
          <div className="xl:col-span-1">{Leaderboard}</div>
        </div>
      </div>
    </div>
  );
};

export default Admin2Panel;

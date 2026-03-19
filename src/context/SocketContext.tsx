import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface Player {
  id: string;
  name: string;
  score: number;
  r1FinishTime: number | null;
  r1ObtainedMark: number;
  r1PaperCollected: boolean;
  r2Answers: Record<number, { answer: string; isCorrect: boolean; timeRemaining: number }>;
  r3Score: number;
  isOnline: boolean;
}

export interface Question {
  question: string;
  options: string[];
  correct: string;
}

export interface GameState {
  currentRound: string;
  players: Player[];
  round1Timer: number;
  round1Config: number;
  round1Active: boolean;
  round1Paused: boolean;
  round2Questions: Question[];
  round2CurrentIndex: number;
  round2Timer: number;
  round2TimerConfig: number;
  round2Active: boolean;
  round2Paused: boolean;
  round2Revealed: boolean;
  buzzerQueue: { id: string; name: string; time: number }[];
}

interface SocketContextType {
  socket: Socket | null;
  gameState: GameState;
  joinGame: (name: string) => void;
  adminChangeRound: (round: string) => void;
  adminStartRound1: (duration: number) => void;
  adminPauseRound1: () => void;
  adminResetRound1: () => void;
  adminForceFinishR1: (playerId: string) => void;
  adminCollectR1Paper: (playerId: string) => void;
  adminResetEntireQuiz: () => void;
  adminLoadPresetQuestions: (setNum: number) => void;
  adminAddQuestion: (qData: Question) => void;
  adminRemoveQuestion: (index: number) => void;
  adminReorderQuestions: (questions: Question[]) => void;
  adminSetR2TimerConfig: (seconds: number) => void;
  adminNextQuestion: () => void;
  adminPauseRound2: () => void;
  adminRevealAnswer: () => void;
  adminResetRound2: () => void;
  adminResetBuzzer: () => void;
  adminUpdateR1Mark: (playerId: string, mark: number) => void;
  adminUpdateR3Score: (playerId: string, delta: number) => void;
  playerFinishRound1: () => void;
  playerSubmitMCQ: (answer: string) => void;
  buzzerPress: (name: string) => void;
}

const defaultGameState: GameState = {
  currentRound: 'lobby',
  players: [],
  round1Timer: 600,
  round1Config: 600,
  round1Active: false,
  round1Paused: false,
  round2Questions: [],
  round2CurrentIndex: -1,
  round2Timer: 20,
  round2TimerConfig: 20,
  round2Active: false,
  round2Paused: false,
  round2Revealed: false,
  buzzerQueue: [],
};

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState>(defaultGameState);

  useEffect(() => {
    const host = window.location.hostname;
    const newSocket = io(`http://${host}:3001`, { transports: ['websocket', 'polling'] });
    setSocket(newSocket);
    newSocket.on('state_update', setGameState);
    newSocket.on('timer_update', (t: number) => setGameState((p) => ({ ...p, round1Timer: t })));
    newSocket.on('r2_timer_update', (t: number) => setGameState((p) => ({ ...p, round2Timer: t })));
    return () => { newSocket.close(); };
  }, []);

  const emit = (event: string, data?: unknown) => socket?.emit(event, data);

  return (
    <SocketContext.Provider value={{
      socket,
      gameState,
      joinGame:               (name) => emit('join', name),
      adminChangeRound:       (r)    => emit('admin:change_round', r),
      adminStartRound1:       (d)    => emit('admin:start_round1', d),
      adminPauseRound1:       ()     => emit('admin:pause_round1'),
      adminResetRound1:       ()     => emit('admin:reset_round1'),
      adminForceFinishR1:     (id)   => emit('admin:force_finish_r1', id),
      adminCollectR1Paper:    (id)   => emit('admin:collect_r1_paper', id),
      adminResetEntireQuiz:   ()     => emit('admin:reset_entire_quiz'),
      adminLoadPresetQuestions: (sn) => emit('admin:load_preset_questions', sn),
      adminAddQuestion:       (q)    => emit('admin:add_question', q),
      adminRemoveQuestion:    (i)    => emit('admin:remove_question', i),
      adminReorderQuestions:  (qs)   => emit('admin:reorder_questions', qs),
      adminSetR2TimerConfig:  (s)    => emit('admin:set_r2_timer_config', s),
      adminNextQuestion:      ()     => emit('admin:next_question'),
      adminPauseRound2:       ()     => emit('admin:pause_round2'),
      adminRevealAnswer:      ()     => emit('admin:reveal_answer'),
      adminResetRound2:       ()     => emit('admin:reset_round2'),
      adminResetBuzzer:       ()     => emit('admin:reset_buzzer'),
      adminUpdateR1Mark:      (id, m) => emit('admin:update_r1_mark', { playerId: id, mark: m }),
      adminUpdateR3Score:     (id, d) => emit('admin:update_r3_score', { playerId: id, delta: d }),
      playerFinishRound1:     ()     => emit('player:finish_round1'),
      playerSubmitMCQ:        (ans)  => emit('player:submit_mcq', ans),
      buzzerPress:            (name) => emit('buzzer_press', name),
    }}>
      {children}
    </SocketContext.Provider>
  );
};

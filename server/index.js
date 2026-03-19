import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// ── Preset Questions sets ────────────────────────────────────────────────────────
const SET1_QUESTIONS = [
  { question: 'Which company developed the first microprocessor?', options: ['Intel', 'AMD', 'IBM', 'Motorola'], correct: 'Intel' },
  { question: "What is the name of Facebook's parent company?", options: ['Alphabet', 'Meta', 'ByteDance', 'Twitter'], correct: 'Meta' },
  { question: 'Which company developed the Android operating system?', options: ['Apple', 'Microsoft', 'Google', 'Nokia'], correct: 'Google' },
  { question: 'What does PDF stand for?', options: ['Portable Document Format', 'Professional Document File', 'Printable Document Format', 'Processed Data File'], correct: 'Portable Document Format' },
  { question: 'Which of the following is NOT an operating system?', options: ['Windows', 'Linux', 'Google Chrome', 'macOS'], correct: 'Google Chrome' },
  { question: 'What is the primary function of a firewall?', options: ['Prevent unauthorized access', 'Speed up internet connection', 'Detect viruses', 'Store passwords'], correct: 'Prevent unauthorized access' },
  { question: 'What does CAD stand for?', options: ['Computer-Aided Design', 'Computerized Automatic Data', 'Centralized Application Development', 'Computational Aided Database'], correct: 'Computer-Aided Design' },
  { question: 'What is the main advantage of cloud computing?', options: ['Increased data security', 'Lower cost and scalability', 'Faster internet speed', 'Better hardware performance'], correct: 'Lower cost and scalability' },
  { question: 'Which one is NOT a programming language?', options: ['Python', 'Java', 'HTML', 'Swift'], correct: 'HTML' },
  { question: "Which programming language is known as the 'mother of all languages'?", options: ['Python', 'C', 'Assembly', 'Java'], correct: 'C' },
  { question: 'In which industry is AI most commonly used for fraud detection?', options: ['Healthcare', 'Finance', 'Retail', 'Manufacturing'], correct: 'Finance' },
  { question: 'Which learning model allows AI to improve through trial and error?', options: ['Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning', 'Expert System Learning'], correct: 'Reinforcement Learning' },
  { question: 'Which architecture is also known as systolic arrays?', options: ['MISD', 'SISD', 'SIMD', 'None of the above'], correct: 'MISD' },
  { question: 'The process of making 2 logical expressions look identical is called?', options: ['Lifting', 'Unification', 'Both A and B', 'None of the above'], correct: 'Unification' },
  { question: 'What is state space in AI?', options: ['Collection of all the problem states', 'A specific problem state', 'Both A and B', 'None of the above'], correct: 'Collection of all the problem states' },
  { question: 'Which of the following are valid 3D image processing techniques?', options: ['Motion', 'Texture', 'Contour', 'All of the above'], correct: 'All of the above' },
  { question: "What was the world's first electronic computer?", options: ['ENIAC', 'PARAM', 'Pascaline', 'CRAY-1'], correct: 'CRAY-1' },
  { question: 'Who programmed the first computer game – Spacewar! – in 1962?', options: ['Steve Russell', 'Konrad Zuse', 'Tim Berners-Lee', 'Bill Gates'], correct: 'Steve Russell' },
  { question: 'Who created the C programming language?', options: ['Ken Thompson', 'Dennis Ritchie', 'Robin Milner', 'Frieder Nake'], correct: 'Dennis Ritchie' },
  { question: 'Which one is the first high-level programming language?', options: ['C', 'COBOL', 'FORTRAN', 'C++'], correct: 'FORTRAN' },
];

const SET2_QUESTIONS = [
  { question: 'What is the time complexity of Binary Search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correct: 'O(log n)' },
  { question: 'Which data structure is used in BFS traversal?', options: ['Stack', 'Queue', 'Tree', 'Array'], correct: 'Queue' },
  { question: 'Which algorithm finds Minimum Spanning Tree?', options: ['Kruskal', 'Linear Search', 'Binary Search', 'Merge Sort'], correct: 'Kruskal' },
  { question: 'Which ML algorithm uses nearest neighbors for prediction?', options: ['KNN', 'SVM', 'Decision Tree', 'Naive Bayes'], correct: 'KNN' },
  { question: 'Which neural network generates realistic images?', options: ['GAN', 'CNN', 'RNN', 'Logistic Regression'], correct: 'GAN' },
  { question: 'Which metric measures classification correctness?', options: ['Accuracy', 'Mean', 'Median', 'Mode'], correct: 'Accuracy' },
  { question: 'Which technique reduces dimensionality of dataset?', options: ['PCA', 'KNN', 'Naive Bayes', 'Decision Tree'], correct: 'PCA' },
  { question: 'Which traversal uses stack?', options: ['DFS', 'BFS', 'Dijkstra', 'Prim'], correct: 'DFS' },
  { question: 'Which ML algorithm separates data using hyperplane?', options: ['SVM', 'K-Means', 'KNN', 'Naive Bayes'], correct: 'SVM' },
  { question: 'Which algorithm works with negative edge weights?', options: ['Bellman-Ford', 'Dijkstra', 'Prim', 'Kruskal'], correct: 'Bellman-Ford' },
  { question: 'Which technique combines multiple ML models?', options: ['Ensemble Learning', 'Sorting', 'Searching', 'Clustering'], correct: 'Ensemble Learning' },
  { question: 'Which optimizer is commonly used in deep learning?', options: ['Adam', 'Bubble Sort', 'DFS', 'Binary Search'], correct: 'Adam' },
  { question: 'Which neural network works best for time series data?', options: ['LSTM', 'CNN', 'GAN', 'KNN'], correct: 'LSTM' },
  { question: 'Which algorithm finds strongly connected components?', options: ['Kosaraju', 'Prim', 'Kruskal', 'Merge Sort'], correct: 'Kosaraju' },
  { question: 'Which metric is best for imbalanced datasets?', options: ['F1 Score', 'Accuracy', 'Mean', 'Median'], correct: 'F1 Score' },
  { question: 'Which technique prevents overfitting?', options: ['Regularization', 'Sorting', 'Searching', 'Clustering'], correct: 'Regularization' },
  { question: 'Which architecture powers ChatGPT?', options: ['Transformer', 'CNN', 'RNN', 'KNN'], correct: 'Transformer' },
  { question: 'Which algorithm is used in Google PageRank?', options: ['Graph Algorithm', 'Binary Search', 'Merge Sort', 'Linear Search'], correct: 'Graph Algorithm' },
  { question: 'Which algorithm finds maximum flow in graph?', options: ['Ford-Fulkerson', 'Dijkstra', 'Prim', 'Kruskal'], correct: 'Ford-Fulkerson' },
  { question: 'Which ML model combines multiple decision trees?', options: ['Random Forest', 'KNN', 'Logistic Regression', 'Linear Regression'], correct: 'Random Forest' }
];

const SET3_QUESTIONS = [
  { question: 'What is worst-case complexity of Quick Sort?', options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'], correct: 'O(n²)' },
  { question: 'Which algorithm solves Travelling Salesman Problem using DP?', options: ['Held-Karp', 'Dijkstra', 'Prim', 'Kruskal'], correct: 'Held-Karp' },
  { question: 'Which neural network is used for image classification?', options: ['CNN', 'RNN', 'GAN', 'KNN'], correct: 'CNN' },
  { question: 'Which algorithm detects communities in networks?', options: ['Louvain', 'Binary Search', 'Bubble Sort', 'DFS'], correct: 'Louvain' },
  { question: 'Which ML algorithm is based on Bayes theorem?', options: ['Naive Bayes', 'SVM', 'Decision Tree', 'KNN'], correct: 'Naive Bayes' },
  { question: 'Which algorithm finds articulation points?', options: ['Tarjan', 'Prim', 'Dijkstra', 'Kruskal'], correct: 'Tarjan' },
  { question: 'Which metric is used in ranking systems?', options: ['NDCG', 'Accuracy', 'Mean', 'Variance'], correct: 'NDCG' },
  { question: 'Which technique normalizes layer inputs in neural networks?', options: ['Batch Normalization', 'PCA', 'Regression', 'Clustering'], correct: 'Batch Normalization' },
  { question: 'Which clustering algorithm is density based?', options: ['DBSCAN', 'K-Means', 'Linear Regression', 'Decision Tree'], correct: 'DBSCAN' },
  { question: 'Which RL algorithm uses Q-values?', options: ['Q-Learning', 'Logistic Regression', 'KNN', 'Decision Tree'], correct: 'Q-Learning' },
  { question: 'Which deep learning framework is developed by Facebook?', options: ['PyTorch', 'TensorFlow', 'NumPy', 'Pandas'], correct: 'PyTorch' },
  { question: 'Which algorithm is used for frequent itemset mining?', options: ['Apriori', 'Dijkstra', 'Prim', 'Kruskal'], correct: 'Apriori' },
  { question: 'Which loss function is used in binary classification?', options: ['Binary Cross Entropy', 'MSE', 'RMSE', 'MAE'], correct: 'Binary Cross Entropy' },
  { question: 'Which data structure is used in A* search?', options: ['Priority Queue', 'Stack', 'Array', 'Linked List'], correct: 'Priority Queue' },
  { question: 'Which algorithm finds strongly connected components efficiently?', options: ['Tarjan', 'Binary Search', 'Merge Sort', 'DFS'], correct: 'Tarjan' },
  { question: 'Which technique speeds up deep learning training?', options: ['Batch Normalization', 'Sorting', 'Searching', 'Clustering'], correct: 'Batch Normalization' },
  { question: 'Which neural network generates synthetic images?', options: ['GAN', 'CNN', 'RNN', 'SVM'], correct: 'GAN' },
  { question: 'Which ML concept balances bias and variance?', options: ['Bias-Variance Tradeoff', 'Sorting', 'Searching', 'Clustering'], correct: 'Bias-Variance Tradeoff' },
  { question: 'Which algorithm is used for bipartite matching?', options: ['Hopcroft-Karp', 'Dijkstra', 'Prim', 'Kruskal'], correct: 'Hopcroft-Karp' },
  { question: 'Which optimizer adapts learning rate automatically?', options: ['Adam', 'SGD', 'RMSProp', 'Adagrad'], correct: 'Adam' }
];

const SET4_QUESTIONS = [
  { question: 'Which algorithm detects cycles in directed graphs?', options: ['DFS Cycle Detection', 'Binary Search', 'Merge Sort', 'K-Means'], correct: 'DFS Cycle Detection' },
  { question: 'Which algorithm solves maximum bipartite matching efficiently?', options: ['Hopcroft–Karp', 'Kruskal', 'Prim', 'Dijkstra'], correct: 'Hopcroft–Karp' },
  { question: 'Which neural architecture is used in BERT?', options: ['Transformer Encoder', 'CNN', 'RNN', 'GAN'], correct: 'Transformer Encoder' },
  { question: 'Which optimizer combines momentum and adaptive learning rate?', options: ['Adam', 'SGD', 'RMSProp', 'Adagrad'], correct: 'Adam' },
  { question: 'Which algorithm finds bridges in graphs?', options: ['Tarjan Algorithm', 'BFS', 'Binary Search', 'Quick Sort'], correct: 'Tarjan Algorithm' },
  { question: 'Which deep learning technique randomly disables neurons?', options: ['Dropout', 'PCA', 'Clustering', 'Regression'], correct: 'Dropout' },
  { question: 'Which metric evaluates ranking quality?', options: ['NDCG', 'Mean', 'Variance', 'Median'], correct: 'NDCG' },
  { question: 'Which algorithm solves shortest path with heuristic?', options: ['A* Algorithm', 'Dijkstra', 'Prim', 'Kruskal'], correct: 'A* Algorithm' },
  { question: 'Which RL method learns optimal policy without model?', options: ['Q-Learning', 'Regression', 'Clustering', 'Sorting'], correct: 'Q-Learning' },
  { question: 'Which clustering algorithm handles arbitrary shaped clusters?', options: ['DBSCAN', 'K-Means', 'Logistic Regression', 'SVM'], correct: 'DBSCAN' },
  { question: 'Which deep learning model powers GPT systems?', options: ['Transformer Decoder', 'CNN', 'RNN', 'KNN'], correct: 'Transformer Decoder' },
  { question: 'Which algorithm finds maximum flow efficiently?', options: ['Edmonds-Karp', 'Prim', 'Kruskal', 'DFS'], correct: 'Edmonds-Karp' },
  { question: 'Which algorithm detects strongly connected components in one DFS pass?', options: ['Tarjan', 'Kosaraju', 'Prim', 'Kruskal'], correct: 'Tarjan' },
  { question: 'Which ML technique reduces variance using multiple datasets?', options: ['Bagging', 'Sorting', 'Searching', 'Regression'], correct: 'Bagging' },
  { question: 'Which neural network handles long-term dependencies?', options: ['LSTM', 'CNN', 'GAN', 'KNN'], correct: 'LSTM' },
  { question: 'Which algorithm detects communities in large graphs?', options: ['Louvain', 'Binary Search', 'Bubble Sort', 'Merge Sort'], correct: 'Louvain' },
  { question: 'Which metric measures classification precision and recall together?', options: ['F1 Score', 'Accuracy', 'Mean', 'Variance'], correct: 'F1 Score' },
  { question: 'Which algorithm solves frequent pattern mining efficiently?', options: ['FP-Growth', 'Dijkstra', 'Kruskal', 'Prim'], correct: 'FP-Growth' },
  { question: 'Which optimizer is commonly used in large transformer models?', options: ['AdamW', 'SGD', 'RMSProp', 'Adagrad'], correct: 'AdamW' },
  { question: 'Which neural network is mainly used for generative text models?', options: ['Transformer', 'CNN', 'RNN', 'GAN'], correct: 'Transformer' }
];

// ── Game State ───────────────────────────────────────────────────────────────
const createInitialState = () => ({
  currentRound: 'lobby',
  players: [],          // { id, name, score, r1FinishTime, r1ObtainedMark, r1PaperCollected, r2Answers, r3Score, isOnline }
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
});

let gameState = createInitialState();
const broadcastState = () => io.emit('state_update', gameState);

// ── Score Calculation ────────────────────────────────────────────────────────
// R1: mark + (finishTime / 10)
// R2: timeRemaining per correct answer
// R3: manual adjustments
function recalculateTotalScore(p) {
  let total = 0;
  if (p.r1PaperCollected && p.r1FinishTime !== null) {
    total += (p.r1ObtainedMark || 0) + (p.r1FinishTime || 0) / 10;
  }
  Object.values(p.r2Answers || {}).forEach((ans) => {
    if (ans.isCorrect) total += ans.timeRemaining || 0;
  });
  total += p.r3Score || 0;
  p.score = parseFloat(total.toFixed(2));
}

let r1Interval = null;
let r2Interval = null;

// ── Socket Handlers ──────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('⚡ Connected:', socket.id);
  socket.emit('state_update', gameState);

  // ── Player Events ──
  socket.on('join', (name) => {
    const cleanName = name?.trim();
    if (!cleanName) return;

    // On reconnect: update socket ID, preserve all data
    const existing = gameState.players.find(
      (p) => p.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (existing) {
      existing.id = socket.id;
      existing.isOnline = true;
      console.log(`🔄 Reconnected: ${cleanName}`);
    } else {
      gameState.players.push({
        id: socket.id,
        name: cleanName,
        score: 0,
        r1FinishTime: null,
        r1ObtainedMark: 0,
        r1PaperCollected: false,
        r2Answers: {},
        r3Score: 0,
        isOnline: true,
      });
      console.log(`👤 Joined: ${cleanName}`);
    }
    broadcastState();
  });

  socket.on('player:finish_round1', () => {
    const p = gameState.players.find((pl) => pl.id === socket.id);
    if (p && p.r1FinishTime === null && gameState.round1Active) {
      p.r1FinishTime = gameState.round1Timer;
      broadcastState();
    }
  });

  socket.on('player:submit_mcq', (answer) => {
    const p = gameState.players.find((pl) => pl.id === socket.id);
    const qIdx = gameState.round2CurrentIndex;
    const question = gameState.round2Questions[qIdx];
    if (!p || p.r2Answers[qIdx] !== undefined || !gameState.round2Active || !question) return;

    const isCorrect = answer === question.correct;
    p.r2Answers[qIdx] = { answer, isCorrect, timeRemaining: gameState.round2Timer };
    recalculateTotalScore(p);

    // Auto-reveal when all online players answered
    const online = gameState.players.filter((pl) => pl.isOnline);
    if (online.length > 0 && online.every((pl) => pl.r2Answers[qIdx] !== undefined)) {
      clearInterval(r2Interval);
      gameState.round2Active = false;
      gameState.round2Revealed = true;
      gameState.players.forEach(recalculateTotalScore);
    }
    broadcastState();
  });

  socket.on('buzzer_press', (playerName) => {
    if (gameState.currentRound !== '3') return;
    if (gameState.buzzerQueue.find((p) => p.id === socket.id)) return;
    const player = gameState.players.find((p) => p.id === socket.id);
    const name = player?.name || playerName || 'Unknown';
    gameState.buzzerQueue.push({ id: socket.id, name, time: Date.now() });
    broadcastState();
  });

  socket.on('disconnect', () => {
    const player = gameState.players.find((p) => p.id === socket.id);
    if (player) {
      player.isOnline = false;
      if (gameState.currentRound === 'lobby') {
        gameState.players = gameState.players.filter((p) => p.id !== socket.id);
      }
    }
    broadcastState();
  });

  // ── Admin: Session ──
  socket.on('admin:reset_entire_quiz', () => {
    clearInterval(r1Interval);
    clearInterval(r2Interval);
    gameState = createInitialState();
    broadcastState();
  });

  socket.on('admin:change_round', (round) => {
    gameState.currentRound = round;
    clearInterval(r1Interval);
    clearInterval(r2Interval);
    gameState.round1Active = false;
    gameState.round2Active = false;
    gameState.round2Paused = false;
    gameState.buzzerQueue = [];
    broadcastState();
  });

  // ── Admin: Round 1 ──
  socket.on('admin:start_round1', (duration) => {
    clearInterval(r1Interval);
    gameState.round1Config = duration;
    gameState.round1Timer = duration;
    gameState.round1Active = true;
    gameState.round1Paused = false;
    broadcastState();

    r1Interval = setInterval(() => {
      if (gameState.round1Paused || !gameState.round1Active) return;
      if (gameState.round1Timer > 0) {
        gameState.round1Timer -= 1;
        io.emit('timer_update', gameState.round1Timer);
      } else {
        clearInterval(r1Interval);
        gameState.round1Active = false;
        broadcastState();
      }
    }, 1000);
  });

  socket.on('admin:pause_round1', () => {
    gameState.round1Paused = !gameState.round1Paused;
    broadcastState();
  });

  socket.on('admin:reset_round1', () => {
    clearInterval(r1Interval);
    gameState.round1Timer = gameState.round1Config;
    gameState.round1Active = false;
    gameState.round1Paused = false;
    gameState.players.forEach((p) => {
      p.r1FinishTime = null;
      p.r1PaperCollected = false;
    });
    broadcastState();
  });

  socket.on('admin:force_finish_r1', (playerId) => {
    const p = gameState.players.find((pl) => pl.id === playerId);
    if (p && p.r1FinishTime === null) {
      p.r1FinishTime = gameState.round1Timer;
      broadcastState();
    }
  });

  socket.on('admin:collect_r1_paper', (playerId) => {
    const p = gameState.players.find((pl) => pl.id === playerId);
    if (p) {
      p.r1PaperCollected = true;
      broadcastState();
    }
  });

  // ── Admin: Round 2 ──
  socket.on('admin:load_preset_questions', (setNum) => {
    let questions;
    switch (setNum) {
      case 2: questions = SET2_QUESTIONS; break;
      case 3: questions = SET3_QUESTIONS; break;
      case 4: questions = SET4_QUESTIONS; break;
      default: questions = SET1_QUESTIONS; break;
    }
    gameState.round2Questions = JSON.parse(JSON.stringify(questions));
    broadcastState();
  });

  socket.on('admin:add_question', (qData) => {
    gameState.round2Questions.push(qData);
    broadcastState();
  });

  socket.on('admin:remove_question', (index) => {
    gameState.round2Questions.splice(index, 1);
    broadcastState();
  });

  socket.on('admin:reorder_questions', (questions) => {
    gameState.round2Questions = questions;
    broadcastState();
  });

  socket.on('admin:set_r2_timer_config', (seconds) => {
    gameState.round2TimerConfig = Math.max(5, seconds);
    broadcastState();
  });

  socket.on('admin:next_question', () => {
    const nextIdx = gameState.round2CurrentIndex + 1;
    if (nextIdx >= gameState.round2Questions.length) {
      // No more questions – end quiz
      clearInterval(r2Interval);
      gameState.round2Active = false;
      gameState.round2Revealed = false;
      broadcastState();
      return;
    }

    clearInterval(r2Interval);
    gameState.round2CurrentIndex = nextIdx;
    gameState.round2Timer = gameState.round2TimerConfig;
    gameState.round2Active = true;
    gameState.round2Paused = false;
    gameState.round2Revealed = false;
    broadcastState();

    r2Interval = setInterval(() => {
      if (gameState.round2Paused || !gameState.round2Active) return;
      if (gameState.round2Timer > 0) {
        gameState.round2Timer -= 1;
        io.emit('r2_timer_update', gameState.round2Timer);
      } else {
        clearInterval(r2Interval);
        gameState.round2Active = false;
        gameState.round2Revealed = true;
        gameState.players.forEach(recalculateTotalScore);
        broadcastState();
      }
    }, 1000);
  });

  socket.on('admin:pause_round2', () => {
    gameState.round2Paused = !gameState.round2Paused;
    broadcastState();
  });

  socket.on('admin:reveal_answer', () => {
    clearInterval(r2Interval);
    gameState.round2Active = false;
    gameState.round2Revealed = true;
    gameState.players.forEach(recalculateTotalScore);
    broadcastState();
  });

  socket.on('admin:reset_round2', () => {
    clearInterval(r2Interval);
    gameState.round2CurrentIndex = -1;
    gameState.round2Active = false;
    gameState.round2Paused = false;
    gameState.round2Revealed = false;
    gameState.round2Timer = gameState.round2TimerConfig;
    gameState.players.forEach((p) => { p.r2Answers = {}; recalculateTotalScore(p); });
    broadcastState();
  });

  // ── Admin: Scoring ──
  socket.on('admin:update_r1_mark', ({ playerId, mark }) => {
    const p = gameState.players.find((pl) => pl.id === playerId);
    if (p && p.r1PaperCollected) {
      p.r1ObtainedMark = mark;
      recalculateTotalScore(p);
      broadcastState();
    }
  });

  socket.on('admin:update_r3_score', ({ playerId, delta }) => {
    const p = gameState.players.find((pl) => pl.id === playerId);
    if (p) {
      p.r3Score = parseFloat(((p.r3Score || 0) + delta).toFixed(2));
      recalculateTotalScore(p);
      broadcastState();
    }
  });

  // ── Admin: Round 3 ──
  socket.on('admin:reset_buzzer', () => {
    gameState.buzzerQueue = [];
    broadcastState();
  });
});

const PORT = 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Quiz Server running on port ${PORT}`);
});
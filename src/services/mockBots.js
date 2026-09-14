// Bot Simulator for load testing up to 200 concurrent participants
import { joinRoom, submitAnswer } from './firebase.js';

const NICKNAMES = [
  'PixelRanger', 'CyberNinja', 'NeonViper', 'CodeWizard', 'QuantumLeap',
  'ByteMe', 'CloudSurfer', 'HyperDrive', 'TurboPenguin', 'DataNomad',
  'AlgoRhythm', 'BinaryBoss', 'EchoChamber', 'GlitchQueen', 'ZeroCool',
  'StackOverlord', 'BugHunter', 'AsyncHero', 'DevDynamo', 'BitFlipper',
  'LogicMaster', 'CacheKing', 'KernelPanic', 'ShadowCoder', 'PromptPro',
  'FirewallFox', 'NeuralNet', 'SyntaxSamurai', 'VoxelVoyager', 'GitGud'
];

const EMOJIS = ['🚀', '⚡', '🔥', '🦊', '🐱', '🤖', '👾', '🌟', '🦄', '🎯', '🎸', '🕹️', '💎', '🍕', '🏆'];

class BotSimulator {
  constructor() {
    this.activeBots = []; // { id, nickname, avatar, roomCode }
    this.timerIds = [];
  }

  getBotCount() {
    return this.activeBots.length;
  }

  clearBots() {
    this.timerIds.forEach(id => clearTimeout(id));
    this.timerIds = [];
    this.activeBots = [];
  }

  async spawnBots(roomCode, count = 20) {
    const newBots = [];
    const startIndex = this.activeBots.length + 1;

    for (let i = 0; i < count; i++) {
      const idx = startIndex + i;
      const baseName = NICKNAMES[idx % NICKNAMES.length];
      const nickname = `${baseName}_${Math.floor(100 + Math.random() * 900)}`;
      const avatar = EMOJIS[idx % EMOJIS.length];
      const botId = `bot_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`;

      const bot = { id: botId, nickname, avatar, roomCode };
      newBots.push(bot);
      this.activeBots.push(bot);
    }

    // Join all bots in batches to avoid overwhelming callstack
    const batchSize = 10;
    for (let i = 0; i < newBots.length; i += batchSize) {
      const batch = newBots.slice(i, i + batchSize);
      await Promise.all(
        batch.map(bot => joinRoom(roomCode, bot))
      );
      // Brief jitter between batches
      await new Promise(r => setTimeout(r, 40));
    }

    return this.activeBots.length;
  }

  /**
   * Called when host triggers a question: bots will simulate human answering
   */
  handleQuestionActive(room) {
    if (this.activeBots.length === 0 || !room) return;

    this.timerIds.forEach(id => clearTimeout(id));
    this.timerIds = [];

    const question = room.questions?.[room.currentQuestionIndex];
    if (!question) return;

    const timeLimitMs = (question.timeLimit || 20) * 1000;
    const correctIdx = question.correctOptionIndex ?? 0;

    this.activeBots.forEach((bot) => {
      // Realistic human latency: between 800ms and 80% of time limit
      const minDelay = 600;
      const maxDelay = Math.min(timeLimitMs - 1200, 14000);
      const delay = Math.floor(minDelay + Math.random() * (maxDelay - minDelay));

      const timerId = setTimeout(async () => {
        // 75% probability of picking the correct answer, 25% random distractor
        const isCorrect = Math.random() < 0.75;
        let selectedOption = correctIdx;
        if (!isCorrect) {
          const wrongOptions = [0, 1, 2, 3].filter(idx => idx !== correctIdx);
          selectedOption = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
        }

        // Speed bonus formula
        const pointsAwarded = isCorrect
          ? Math.round(1000 * (1 - (delay / timeLimitMs) / 2))
          : 0;

        await submitAnswer(room.roomCode, question.id, bot.id, {
          selectedOption,
          timeSpentMs: delay,
          pointsAwarded,
          submittedAt: Date.now(),
        });
      }, delay);

      this.timerIds.push(timerId);
    });
  }
}

export const botSimulator = new BotSimulator();

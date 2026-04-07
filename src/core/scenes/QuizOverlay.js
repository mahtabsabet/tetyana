// QuizOverlay.js — Shared multiple-choice vocabulary quiz overlay
//
// Usage in any level's _gagner():
//   import { showQuiz } from '../../core/scenes/QuizOverlay.js';
//
//   showQuiz(this, QUIZ_QUESTIONS, (bonusPoints) => {
//     this._score += bonusPoints;
//     this._ctx?.onComplete({ ... pointsEarned: this._score ... });
//     this._terminer();
//   });
//
// Question format:
//   {
//     imageEmoji: '♻️',           // emoji shown as image placeholder
//     imageKey:   null,            // Phaser texture key — overrides emoji when loaded
//     question:   "...",           // optional prompt (default: "Qu'est-ce que c'est ?")
//     correct:    'Le recyclage',  // correct answer
//     wrong:      ['a', 'b', 'c'], // exactly 3 wrong answers
//   }

const BONUS_PER_CORRECT = 10;
const DEPTH = 50;

export function showQuiz(scene, questions, onComplete) {
  const W = scene.scale.width;   // 960
  const H = scene.scale.height;  // 540

  // Persistent semi-transparent backdrop (stays for entire quiz)
  scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.80)
    .setScrollFactor(0).setDepth(DEPTH);

  let bonusEarned = 0;
  let currentElements = [];

  function track(obj) { currentElements.push(obj); return obj; }
  function clearCurrent() {
    currentElements.forEach(e => { if (e?.destroy) e.destroy(); });
    currentElements = [];
  }

  function showQuestion(idx) {
    clearCurrent();
    const q = questions[idx];

    // Progress indicator
    track(scene.add.text(W / 2, 28, `Question ${idx + 1} / ${questions.length}`, {
      fontFamily: 'Arial', fontSize: '16px', color: '#aaaaaa',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH + 1));

    // Card background  (520 × 400, slightly below centre to leave room for progress text)
    const cX = W / 2;
    const cY = H / 2 + 20;
    track(scene.add.rectangle(cX, cY, 520, 400, 0x0d1b3e)
      .setStrokeStyle(3, 0x3366cc).setScrollFactor(0).setDepth(DEPTH + 1));

    // Image area
    const imgY = cY - 155;
    if (q.imageKey && scene.textures.exists(q.imageKey)) {
      track(scene.add.image(cX, imgY, q.imageKey)
        .setDisplaySize(90, 90).setScrollFactor(0).setDepth(DEPTH + 2));
    } else {
      track(scene.add.text(cX, imgY, q.imageEmoji, { fontSize: '72px' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 2));
    }

    // Question prompt
    const prompt = q.question ?? "Qu'est-ce que c'est ?";
    track(scene.add.text(cX, cY - 58, prompt, {
      fontFamily: 'Arial', fontSize: '18px', color: '#ddeeff',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 2));

    // Answer buttons — 2 × 2 grid
    const options = Phaser.Utils.Array.Shuffle([q.correct, ...q.wrong]);
    const btnW = 226;
    const btnH = 50;
    let answered = false;
    const btnMap = {};   // option text → rectangle (for highlighting correct)

    options.forEach((opt, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = cX + (col === 0 ? -120 : 120);
      const by = cY + 20 + row * 62;

      const br = track(scene.add.rectangle(bx, by, btnW, btnH, 0x1e3a6e)
        .setStrokeStyle(2, 0x4477bb)
        .setInteractive({ useHandCursor: true })
        .setScrollFactor(0).setDepth(DEPTH + 2));
      track(scene.add.text(bx, by, opt, {
        fontFamily: 'Arial', fontSize: '14px', color: '#ffffff',
        wordWrap: { width: btnW - 18 }, align: 'center',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 3));

      btnMap[opt] = br;

      br.on('pointerover', () => { if (!answered) br.setFillStyle(0x2a4e8a); });
      br.on('pointerout',  () => { if (!answered) br.setFillStyle(0x1e3a6e); });
      br.on('pointerdown', () => {
        if (answered) return;
        answered = true;

        const isCorrect = opt === q.correct;
        if (isCorrect) {
          bonusEarned += BONUS_PER_CORRECT;
          br.setFillStyle(0x1a5c2a).setStrokeStyle(3, 0x44ee77);
          track(scene.add.text(cX, cY + 160, `✅ Correct ! +${BONUS_PER_CORRECT} points`, {
            fontFamily: 'Arial', fontSize: '20px', fontStyle: 'bold',
            color: '#44ee77', stroke: '#000', strokeThickness: 4,
          }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 4));
        } else {
          br.setFillStyle(0x6e1a1a).setStrokeStyle(3, 0xee4444);
          if (btnMap[q.correct]) {
            btnMap[q.correct].setFillStyle(0x1a5c2a).setStrokeStyle(3, 0x44ee77);
          }
          track(scene.add.text(cX, cY + 160, `❌ Bonne réponse : ${q.correct}`, {
            fontFamily: 'Arial', fontSize: '17px', fontStyle: 'bold',
            color: '#ff8888', stroke: '#000', strokeThickness: 4,
          }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 4));
        }

        scene.time.delayedCall(1800, () => {
          const next = idx + 1;
          if (next < questions.length) {
            showQuestion(next);
          } else {
            // All questions done — show bonus summary then hand back control
            clearCurrent();
            const msg = bonusEarned > 0
              ? `🌟 +${bonusEarned} points bonus !`
              : 'Continue à apprendre !';
            scene.add.text(W / 2, H / 2, msg, {
              fontFamily: 'Arial', fontSize: '28px', fontStyle: 'bold',
              color: bonusEarned > 0 ? '#ffdd44' : '#aaaaff',
              stroke: '#000', strokeThickness: 5,
            }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 2);
            scene.time.delayedCall(1500, () => onComplete(bonusEarned));
          }
        });
      });
    });
  }

  showQuestion(0);
}

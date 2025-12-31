import gsap from "gsap";
import { k } from "../../core/kaplay";
import { WORDLIST } from "../../core/wordlist";
import { bgGenerator } from "../../utils/bgGenerator";
import { fromEvent, Subscription } from "rxjs";
import * as Tone from "tone";
import { particleTouch } from "../../utils/particleTouch";
import { bonusClicker } from "../../ui/bonusClicker";
import { bombTyper } from "../../ui/bombTyper";
import { theme } from "../../core/kaplay/theme";

/**
HELPERS
 */

const LENGTH_KEY_MAP = {
    4: "fourLetters",
    5: "fiveLetters",
    6: "sixLetters",
    7: "sevenLetters",
    8: "eightLetters"
};

const SCALE = [
    "C4", // Do
    "D4", // Re
    "E4", // Mi
    "F4", // Fa
    "G4", // So
    "A4", // La
    "B4", // Ti
    "C5", // High Do
];

let scaleIndex = 0;
let scaleDir = 1;

function resolvedWord({ word, type }) {
    if (!type || !word) return null;

    const lengthKey = LENGTH_KEY_MAP[word];
    if (!lengthKey) return null;

    const wordList = WORDLIST[type]?.[lengthKey];
    if (!wordList || wordList.length === 0) return null;

    return {
        type,
        length: word, // int between 4 - 8
        wordList, // ARRAY OF WORDS
    };
};

function shuffleArray(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
}

function pickRandomWord(wordList) {
    const idx = Math.floor(Math.random() * wordList.length);
    return wordList[idx]; // { word, score }
}

function mirrorIndexes(indexes, length) {
    return indexes.map(i => length - 1 - i);
}

function preFilledIndexes(length) {
    const count = Math.ceil(length / 2) + 1;
    const indexes = new Set();

    while (indexes.size < count) {
        indexes.add(Math.floor(Math.random() * length));
    }

    return [...indexes];
}

function getPhaseDuration(length) {
    if (length <= 5) return 85;
    return 110;
}

function getWordTimer(length) {
    if (length === 4) return 5;
    if (length === 5 || length === 6) return 6;
    if (length > 6) return 12;
}

let bgm = null

export function regsiterTyping() {
    k.scene("typing", ({ machineResult } = {}) => {
        // DEBUG MODE
        // k.debug.inspect = true

        // BGM
        // if(!bgm){
        //     bgm = k.play("Glitch", {
        //         volume: 0.7,
        //         loop: true
        //     });
        // };
        const stopBgm = () => {
            if (bgm) {
                gsap.to(bgm, {
                    duration: 1.5,
                    volume: 0,
                    onComplete: () => bgm.stop(),
                    ease: "power2.out",
                });
                bgm = null;
            }
        }
        // ====== DEBUG VARIABLE =====
        let isSceneActive = true;
        const DEBUG_MACHINE_RESULT = {
            normal: {
                word: 5,
                type: "noun",
                completed: true,
                attempts: 1,
                locked: false,
            },
            reverse: {
                word: 4,
                type: "verb",
                completed: true,
                attempts: 1,
                locked: false
            }
        };
        const safeMachineResult = machineResult ?? DEBUG_MACHINE_RESULT;

        // ==== READ INPUT ====
        const subs = new Subscription();
        let inputLocked = false;
        let inputCursor = 0;

        // ==== TONE SET UP ====
        const synth = new Tone.PolySynth(Tone.Synth, {
            maxPolyphony: 6,
            oscillator: {
                type: "amsawtooth1"
            },
            envelope: {
                attack: 0.02,
                decay: 0.15,
                sustain: 0.25,
                release: 0.35
            },
            volume: 2
        })
            .connect(new Tone.Compressor({
                threshold: -18,
                ratio: 2.5,
                attack: 0.01,
                release: 0.2
            }))
            .connect(new Tone.Limiter(-3))  // protects against clipping
            .toDestination();

        // ===== GAME STATE =====
        // const GAME_STATE = {
        //     INTRO: "intro",
        //     PART1: "part1",
        //     PART2: "part2",
        //     FINISHED: "finished"
        // }
        // let gameState = GAME_STATE.INTRO;

        let correctStreak = 0;
        // let bonusCooldown = false;
        let activeBonuses = 0;

        let activeBombs = [];
        let bombSchedulerActive = false;

        let typoWords = [];
        let bannedWords = [];

        // Countdown
        const PHASE_TIME_WARNING = 10;
        let phaseWarningActive = false;

        // ===== SPRITE LAYERS =====
        const spriteLayer = {
            bg: 9,
            cotton: 100,
            uiLayer: 11
        };

        // ===== CHALLENGE =====
        console.log(safeMachineResult);
        const result = {
            normal: resolvedWord(safeMachineResult.normal),
            reverse: resolvedWord(safeMachineResult.reverse),
        }
        console.log(result);

        // Challenge context
        let currentPart = "normal"; // or "reverse"
        let currentEntry = null;   // { word, score }
        let currentWord = "";

        let revealedIndexes = [];
        let score = 0;

        // HELPERS
        currentEntry = pickRandomWord(result.normal.wordList);
        currentWord = currentEntry.word.toUpperCase();
        console.log(currentEntry)

        revealedIndexes = preFilledIndexes(currentWord.length);
        if (currentPart === "reverse") {
            revealedIndexes = mirrorIndexes(revealedIndexes, currentWord.length);
        }

        // console.log(revealedIndexes)
        // playerInput = "";
        let expectedWord = "";

        const randomizedLetters = shuffleArray(currentWord.split("")).join("");

        // ===== BACKGROUND =====
        const floor = bgGenerator({
            z: spriteLayer.bg,
            sprite: "buns",
            scale: 3.5,
            floorHeight: 64 * 3.5,
            floorWidth: 64 * 3.5,
            add: 220
        });
        k.setBackground("#03021e");
        // Dark Overlay
        const overlay = k.add([
            k.rect(k.width(), k.height()),
            k.pos(0, 0),
            k.opacity(0.92),
            k.color("#100738"),
            k.anchor("topleft"),
            k.fixed(),
            k.z(99)
        ]);

        // ===== COTTON SPRITE =====
        const cotton = k.add([
            k.pos(k.width() / 2, -130),
            k.anchor("center"),
            k.z(spriteLayer.cotton),
            "player"
        ]);
        const cottonSprite = cotton.add([
            k.sprite("fear"),
            k.scale(0.12),
            k.anchor("center"),
            k.rotate(40)
        ]);
        const cottonTl = gsap.timeline();

        // ==== COTTON REACT SPRITE ====
        const cottonReactFinalY = k.height() - 280;
        let isSweat = false;
        const cottonReact = k.add([
            k.anchor("center"),
            k.z(spriteLayer.uiLayer),
            k.pos(k.width() / 2 + 100, k.height() + 160),
            k.rotate(0)
        ])
        const cottonReactSprite = cottonReact.add([
            k.sprite("smile"),
            k.scale(0.12)
        ]);

        // ==== COTTON SPRITE ANIM FALL ====
        // Entrance fall
        cottonTl.to(cotton.pos, {
            y: k.height() + 55,
            duration: 2,
            ease: "expo.in"
        });
        cottonTl.to(cottonSprite, {
            angle: "+=" + 55,
            duration: 2.2,
            ease: "power2.out"
        }, "-=1.2");
        cottonTl.eventCallback("onComplete", () => {
            if (!bgm) {
                bgm = k.play("Glitch", {
                    volume: 0.6,
                    loop: true
                });
            };
            k.shake(20);
            overlay.z = spriteLayer.bg + 1;
            overlay.opacity = 0.85
            // startPhaseTimer();
            // nextWord();
            gsap.to(cottonReact.pos, {
                y: cottonReactFinalY,
                duration: 0.6,
                ease: "power2.out",
                delay: 0.1
            });
            gsap.fromTo(cottonReact,
                { angle: -40 },
                {
                    angle: 0,
                    duration: 0.8,
                    ease: "power3.out"
                },
                "<"
            )
            startPhase();
        });
        // ===== MAIN INTERFACE =====

        // ==== TITLE ====
        const partText = k.add([
            k.text("PHASE ONE", {
                font: "Kaph",
                letterSpacing: 1.2,
                size: 35,
            }),
            k.pos(k.width() / 2, 90),
            k.anchor("center"),
            k.z(spriteLayer.uiLayer),
            k.scale(1, 1.1)
        ]);

        const randomText = k.add([
            k.text(randomizedLetters, {
                font: "Kaph",
                letterSpacing: 85,
                size: 95,
            }),
            k.pos(k.width() / 2, 280),
            k.anchor("center"),
            k.z(spriteLayer.uiLayer),
            k.scale(1)
        ]);

        // BOX
        let boxes = [];
        function renderBoxes(word, revealedIndexes) {
            boxes.forEach(b => b.entity.destroy());
            boxes = [];

            const boxSize = 65;
            const gap = 12;
            const totalWidth = word.length * boxSize + (word.length - 1) * gap;
            const startX = k.width() / 2 - totalWidth / 2 + 25;

            word.split("").forEach((char, i) => {
                const revealed = revealedIndexes.includes(i);

                const box = k.add([
                    k.rect(boxSize, boxSize, {
                        radius: 12
                    }),
                    k.pos(startX + i * (boxSize + gap), k.height() / 2 + 70),
                    k.anchor("center"),
                    k.color(k.rgb(113, 114, 194)),
                    k.z(spriteLayer.uiLayer),
                    k.opacity(0.6)
                ]);

                if (revealed) {
                    box.add([
                        k.text(char, {
                            size: 36,
                            font: "Ajelins"
                        }),
                        k.color("#FFFFFF"),
                        k.anchor("center"),
                        k.opacity(0.4)
                    ]);
                }

                boxes.push({
                    entity: box,
                    index: i,
                    char,
                    revealed,
                    filled: false,
                });
            });
        }

        // Find empty boxes
        function getNextEmptyBox() {
            const orderedBoxes = currentPart === "reverse"
                ? [...boxes].reverse()
                : boxes;

            return orderedBoxes.find(b => !b.filled) ?? null;
        }

        // Word Timer
        let wordTime = getWordTimer(currentWord.length);
        console.log(wordTime)
        let wordTimerActive = false;

        function startWordTimer() {
            wordTime = getWordTimer(currentWord.length);
            wordTimerActive = true;
            timerText.text = `TIME ${wordTime}`;
        }

        function stopWordTimer() {
            wordTimerActive = false;
        };

        // Phase Timer
        let phaseTime = 0;
        let phaseTimerActive = false;

        function startPhaseTimer() {
            const length = currentPart === "normal"
                ? result.normal.length
                : result.reverse.length;

            phaseTime = getPhaseDuration(length);

            phaseTimerActive = true;
            phaseTimerText.text = formatTime(phaseTime)
        }
        function stopPhaseTimer() {
            phaseTimerActive = false;
        }
        function formatTime(sec) {
            const m = Math.floor(sec / 60);
            const s = Math.ceil(sec % 60);
            return `${m}:${s.toString().padStart(2, "0")}`;
        };

        // Phase manager
        function startPhase() {
            stopWordTimer();
            stopPhaseTimer();

            inputLocked = false;

            startPhaseTimer();
            nextWord();

            // scheduleBombs();
            if (!bombSchedulerActive) {
                bombSchedulerActive = true;
                scheduleBombs();
            }
        }

        function onPhaseTimeout() {
            if (currentPart === "normal") {

                currentPart = "reverse";
                partText.text = "PHASE TWO";

                stopWordTimer();
                stopPhaseTimer();

                inputLocked = true;
                overlay.z = spriteLayer.uiLayer + 7;
                overlay.opacity = 1;

                // === LETTER FALL TRANSITION ===
                phaseLetters.forEach((letter, i) => {
                    letter.opacity = 1;
                    letter.pos.y = -120;

                    gsap.to(letter.pos, {
                        y: k.height() / 2,
                        delay: i * 0.06,
                        duration: 0.6,
                        ease: "power2.out",
                    });

                    gsap.fromTo(letter, {
                        opacity: 0
                    }, {
                        opacity: 1,
                        delay: i * 0.06,
                        duration: 0.3,
                    });
                });

                // === EXIT BLIP ===
                k.wait(1.2, () => {
                    phaseLetters.forEach((letter, i) => {
                        gsap.to(letter.pos, {
                            y: k.height() + 120,
                            delay: i * 0.04,
                            duration: 0.45,
                            ease: "power2.in",
                        });

                        gsap.to(letter, {
                            opacity: 0,
                            delay: i * 0.04 + 0.2,
                            duration: 0.2,
                        });
                    });
                });

                // === RESUME GAME ===
                k.wait(2, () => {
                    overlay.z = spriteLayer.bg + 1;
                    overlay.opacity = 0.85;
                    startPhase();
                });

            } else {
                endGame();
            }
        };
        function activatePhaseWarning() {
            if (phaseWarningActive) return;
            phaseWarningActive = true;

            phaseTimerText.color = k.rgb(255, 102, 102); // warm yellow

            gsap.to(phaseTimerText, {
                scale: 1.7,
                duration: 0.25,
                ease: "power2.out"
            });

            gsap.to(phaseTimerText, {
                opacity: 0.7,
                duration: 0.4,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        }
        function resetPhaseWarning() {
            if (!phaseWarningActive) return;
            phaseWarningActive = false;

            gsap.killTweensOf(phaseTimerText);

            phaseTimerText.color = k.rgb(255, 255, 255);
            phaseTimerText.opacity = 1;

            gsap.to(phaseTimerText, {
                scale: 1,
                duration: 0.2,
                ease: "power2.out"
            });
        }

        // ==== BONUS CLICKER ====
        function triggerBonus() {
            const count = k.rand(1, 4); // 1–3 clickers
            activeBonuses = count;
            cottonReactSprite.use(k.sprite("hope"));

            for (let i = 0; i < count; i++) {
                k.wait(i * 0.15, () => {
                    bonusClicker(
                        (bonus) => {
                            synth.triggerAttackRelease(["C6", "E6", "G6"], "16n", Tone.now());
                            if (bonus.value === "MULTIPLY") {
                                score *= 2;
                            } else {
                                score += bonus.value;
                            }

                            scoreText.text = `Your current score : ${score}`;
                            activeBonuses--;

                            if (activeBonuses <= 0) {
                                correctStreak = 0;
                            }
                        },
                        () => {
                            // expired
                            activeBonuses--;

                            if (activeBonuses <= 0) {
                                correctStreak = 0;
                            }
                        }
                    );
                });
            }
        };

        // ==== BOMB CHALLENGE ====
        const MAX_BOMBS = 3;
        function spawnBomb() {
            if (activeBombs.length >= MAX_BOMBS) return;

            const bomb = bombTyper(
                (value) => {
                    score += value;
                    scoreText.text = `Your current score : ${score}`;
                    activeBombs = activeBombs.filter(b => b !== bomb);

                    synth.triggerAttackRelease(["C6", "E6", "G6"], "16n", Tone.now());
                },
                (value) => {
                    score -= value;
                    score = Math.max(0, score)
                    scoreText.text = `Your current score : ${score}`;
                    activeBombs = activeBombs.filter(b => b !== bomb);

                    // spritechange
                    isSweat = true;
                    if (isSweat) {
                        cottonReactSprite.use(k.sprite("sweat"));
                        k.wait(1, () => {
                            cottonReactSprite.use(k.sprite("annoyed"));
                            isSweat = false;
                        });
                    }
                }
            );

            activeBombs.push(bomb);
        };
        function scheduleBombs() {
            if (!isSceneActive || !bombSchedulerActive) return;

            const delay = k.rand(3, 6);

            k.wait(delay, () => {
                if (!isSceneActive || !bombSchedulerActive) return;

                spawnBomb();

                if (Math.random() < 0.35) {
                    k.wait(0.4, () => {
                        if (!isSceneActive) return;
                        spawnBomb();
                    });
                }

                scheduleBombs();
            });
        }


        // Check Word Complete
        function checkWordComplete() {
            const done = boxes.every(b => b.filled);
            if (!done) return;

            bannedWords.push(currentWord);
            stopWordTimer();

            score += currentEntry.score;
            cottonReactSprite.use(k.sprite("gasp"));
            scoreText.text = `Your current score : ${score}`;

            correctStreak++;

            if (correctStreak === 2) {
                triggerBonus();
                correctStreak = 0;
            }

            k.wait(0.5, () => {
                nextWord();
            });
        }

        function setupWord(entry) {
            currentEntry = entry;
            currentWord = entry.word.toUpperCase();

            expectedWord = currentPart === "reverse"
                ? currentWord.split("").reverse().join("")
                : currentWord;

            revealedIndexes = preFilledIndexes(currentWord.length);
            renderBoxes(currentWord, revealedIndexes);

            inputCursor = 0;

            const scrambled = shuffleArray(currentWord.split(""));
            randomText.text = currentPart === "reverse"
                ? scrambled.reverse().join("")
                : scrambled.join("");

            startWordTimer();
        }

        // Typo Check
        function registerTypo() {
            typoWords.push(currentWord);
            bannedWords.push(currentWord);
            k.shake(3);

            const chord = ["C3", "D3", "E3", "G3", "A3"];
            synth.triggerAttackRelease(chord, "8n", Tone.now());

            typoWords.push()
            correctStreak = 0;
            // bonusCooldown = false;

            inputLocked = true;
            stopWordTimer();

            randomText.text = currentWord
            randomText.opacity = 0.5;

            k.wait(0.7, () => {
                randomText.opacity = 1;
                inputLocked = false;
                nextWord();
                cottonReactSprite.use(k.sprite("serious"));
            });

            score -= currentEntry.reduce;
            score = Math.max(0, score);
            scoreText.text = `Your current score : ${score}`;
        }

        // Handle next word
        // Bug fix
        function pickNonRepeatingWord(wordList, bannedWords = []) {
            const pool = wordList.filter(
                w => !bannedWords.includes(w.word.toUpperCase())
            );

            // Fallback: if everything is banned, allow reuse
            const safePool = pool.length > 0 ? pool : wordList;

            return pickRandomWord(safePool);
        }

        function nextWord() {
            stopWordTimer();

            const pool = currentPart === "normal"
                ? result.normal.wordList
                : result.reverse.wordList;

            const banned = [
                currentWord,
                ...bannedWords
            ];

            setupWord(pickNonRepeatingWord(pool, banned));
        }

        // Handle letter
        function handleLetter(letter) {
            if (inputLocked) return;

            const target = getNextEmptyBox();
            if (!target) return;

            const expectedChar = expectedWord[inputCursor];

            if (letter === expectedChar) {
                fillBox(target, letter);
                inputCursor++;
                checkWordComplete();

            } else {
                registerTypo();
            }
        }

        function fillBox(box, letter) {
            box.entity.opacity = 1;

            box.entity.add([
                k.text(letter, {
                    size: 36,
                    font: "Ajelins"
                }),
                k.color(theme.cyan),
                k.anchor("center"),
            ]);

            box.filled = true;

            // animate
            particleTouch(box.entity.pos.x, box.entity.pos.y);
            const initY = box.entity.pos.y;

            const tl = gsap.timeline();
            tl.to(box.entity.pos, {
                y: initY - 25,
                ease: "power2.out"
            });
            tl.to(box.entity.pos, {
                y: initY - 10,
                ease: "power1.out"
            })

            // Sound
            const note = SCALE[scaleIndex];
            const velocity = 0.5 + Math.random() * 0.2;
            synth.triggerAttackRelease(note, "16n", Tone.now(), velocity);
            scaleIndex += scaleDir;

            if (scaleIndex === SCALE.length - 1 || scaleIndex === 0) {
                scaleDir *= -1;
            }
        }
        // subs.add(
        //     fromEvent(window, "keydown").subscribe(e => {
        //         if (e.key.length !== 1) return;

        //         const letter = e.key.toUpperCase();
        //         handleLetter(letter);
        //     })
        // );
        let audioReady = false;

        subs.add(
            fromEvent(window, "keydown").subscribe(async e => {

                if (!audioReady) {
                    await Tone.start();
                    audioReady = true;
                }

                // if (e.key.length !== 1) return;


                // Only allow alphabets
                // === NUMBER BOMB CHECK ===
                if (/^[1-9]$/.test(e.key)) {
                    const value = Number(e.key);

                    const bomb = activeBombs.find(b => b.value === value);
                    if (bomb) {
                        bomb.resolve();
                        return;
                    }
                    return;
                }

                // === NORMAL LETTER FLOW ===
                if (!/^[a-zA-Z]$/.test(e.key)) return;

                const letter = e.key.toUpperCase();
                handleLetter(letter);
            })
        );

        // end game
        function endGame() {
            stopWordTimer();
            stopPhaseTimer();
            isSceneActive = false;
            bombSchedulerActive = false;
            inputLocked = true;
            overlay.z = 999;
            // k.wait(0.5, () => {
            //     overlay.opacity = 1;
            // })
            // k.wait(0.5, () => {
            //     k.go("clicker", { typoWords: typoWords, bannedWords: bannedWords, score: score });
            // });
            cottonReact.z = 999;
            const tl = gsap.timeline({
                onComplete: () => {
                    k.go("clicker", { typoWords, bannedWords, score });
                }
            });
            tl.to(overlay, {
                opacity: 1,
                duration: 0.5,
                ease: "power2.out",
                onStart: () => k.play("blink", {
                    volume: 1.6
                })
            });
            tl.to(cottonReact.pos, {
                y: k.height() + 100,
                duration: 0.7,
                ease: "power4.in"
            });
        }

        // TIMER
        const timerText = k.add([
            k.text("Type to start", {
                font: "Ajelins"
            }),
            k.pos(450, k.height() - 200),
            k.anchor("center"),
            k.z(spriteLayer.uiLayer)
        ]);

        const phaseTimerText = k.add([
            k.text("1:20", { font: "Ajelins", size: 32 }),
            k.pos(k.width() / 2 + 320, 90),
            k.anchor("center"),
            k.color(k.rgb(255, 255, 255)),
            k.z(spriteLayer.uiLayer)
        ]);

        // SCORE TEXT
        const scoreText = k.add([
            k.text(`Your current score : ${score}`, {
                font: "Ajelins",
                size: 25
            }),
            k.pos(k.width() / 2, 135),
            k.anchor("center"),
            k.z(spriteLayer.uiLayer)
        ]);

        const phaseLetters = [];
        const PHASE_TEXT = "PHASE TWO";

        const letterGap = 60;
        const startX = k.width() / 2 - ((PHASE_TEXT.length - 1) * letterGap) / 2;

        PHASE_TEXT.split("").forEach((char, i) => {
            const letter = k.add([
                k.text(char, {
                    font: "Kaph",
                    size: 72
                }),
                k.pos(startX + i * letterGap, -100),
                k.anchor("center"),
                k.opacity(1),
                k.z(999),
            ]);

            phaseLetters.push(letter);
        });

        // ===== UPDATE LOOP =====
        const STEP = 90;       // rotation step
        const INTERVAL = 0.8;  // seconds per step
        let timer = 0;

        k.onUpdate(() => {

            // === WORD TIMER ===
            if (wordTimerActive) {
                wordTime -= k.dt();
                timerText.text = `TIME ${Math.ceil(wordTime)}`;

                if (wordTime <= 0) {
                    wordTimerActive = false;
                    registerTypo();
                }
            };

            // === PHASE TIMER ===
            if (phaseTimerActive) {
                phaseTime -= k.dt();
                phaseTimerText.text = formatTime(phaseTime);

                if (phaseTime <= PHASE_TIME_WARNING) {
                    activatePhaseWarning();
                } else {
                    resetPhaseWarning();
                }

                if (phaseTime <= 0) {
                    phaseTimerActive = false;
                    resetPhaseWarning();
                    onPhaseTimeout();
                }
            }

            // === BACKGROUND ROTATION ===
            timer += k.dt();
            if (timer >= INTERVAL) {
                timer = 0;
                floor.element.forEach(el => {
                    el.angle = (el.angle + STEP) % 360;
                });
            }
        });

        k.onSceneLeave(() => {
            // Clean it up!

            subs.unsubscribe();
            isSceneActive = false;

            synth.dispose();
            Tone.Transport.stop();
            Tone.Transport.cancel();

            gsap.killTweensOf("*");
            gsap.globalTimeline.clear();

            activeBombs.forEach(b => b.destroy?.());
            activeBombs = [];

            stopBgm();
        })
    });
}

/**

*/


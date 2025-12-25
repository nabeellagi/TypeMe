import gsap from "gsap";
import { k } from "../../core/kaplay";
import { WORDLIST } from "../../core/wordlist";
import { bgGenerator } from "../../utils/bgGenerator";
import { fromEvent, Subscription } from "rxjs";

/**
Typo words will be collected
Hearts will be reduced when time out per words. 
*/

const LENGTH_KEY_MAP = {
    4: "fourLetters",
    5: "fiveLetters",
    6: "sixLetters",
    7: "sevenLetters",
    8: "eightLetters"
};

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

function preFilledIndexes(length) {
    const count = Math.ceil(length / 2) - 1;
    const indexes = new Set();

    while (indexes.size < count) {
        indexes.add(Math.floor(Math.random() * length));
    }

    return [...indexes];
}

export function regsiterTyping() {
    k.scene("typing", ({ machineResult } = {}) => {
        // DEBUG MODE
        // k.debug.inspect = true

        // ====== DEBUG VARIABLE =====
        const DEBUG_MACHINE_RESULT = {
            normal: {
                word: 5,
                type: "noun",
                completed: true,
                attempts: 1,
                locked: false,
            },
            reverse: {
                word: 8,
                type: "verb",
                completed: true,
                attempts: 1,
                locked: false
            }
        };
        const safeMachineResult = machineResult ?? DEBUG_MACHINE_RESULT;

        // ==== READ INPUT ====
        const subs = new Subscription();
        const key$ = fromEvent("keydown", window)

        // ===== GAME STATE =====
        const GAME_STATE = {
            INTRO: "intro",
            PART1: "part1",
            PART2: "part2",
            FINISHED: "finished"
        }
        let gameState = GAME_STATE.INTRO;

        let typoWords = [];

        // Countdown
        let countdown = 3;

        // ===== SPRITE LAYERS =====
        const spriteLayer = {
            bg: 9,
            cotton: 10,
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
        let playerInput = "";
        let score = 0;

        // HELPERS
        currentEntry = pickRandomWord(result.normal.wordList);
        currentWord = currentEntry.word.toUpperCase();
        console.log(currentEntry)

        revealedIndexes = preFilledIndexes(currentWord.length);
        // console.log(revealedIndexes)
        playerInput = "";

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
            k.opacity(0.6),
            k.color("#100738"),
            k.anchor("topleft"),
            k.fixed(),
            k.z(spriteLayer.bg + 1)
        ]);

        // ===== COTTON SPRITE FALL=====
        const cotton = k.add([
            k.pos(k.width() / 2, -100),
            k.anchor("center"),
            k.z(spriteLayer.cotton),
            "player"
        ]);
        const cottonSprite = cotton.add([
            k.sprite("fear"),
            k.scale(0.085),
            k.anchor("center"),
            k.rotate(40)
        ]);
        const cottonTl = gsap.timeline();

        // Entrance fall
        cottonTl.to(cotton.pos, {
            y: k.height() + 55,
            duration: 3,
            ease: "power2.out"
        });
        cottonTl.to(cottonSprite, {
            angle: "+=" + 45,
            duration: 1.8,
            ease: "power2.out"
        }, "<");
        cottonTl.eventCallback("onComplete", () => {
            overlay.opacity = 0.85
        })

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
                    filled: revealed,
                });
            });
        }
        renderBoxes(currentWord, revealedIndexes);

        // Find empty boxes
        function getNextEmptyBox() {
            return boxes.find(b => !b.filled);
        }
        // Handle Typo
        function checkWordComplete() {
            const done = boxes.every(b => b.filled);
            if (done) {
                score += currentEntry.score;
                nextWord();
            }
        }

        function registerTypo() {
            typoWords.push(currentWord);
            k.shake(3);
            nextWord();
        }

        // Handle next word
        function nextWord() {
            currentEntry = pickRandomWord(result.normal.wordList);
            currentWord = currentEntry.word.toUpperCase();

            revealedIndexes = preFilledIndexes(currentWord.length);

            renderBoxes(currentWord, revealedIndexes);

            randomText.text = shuffleArray(currentWord.split("")).join("");
        }

        // Handle letter
        function handleLetter(letter) {
            const target = getNextEmptyBox();
            if (!target) return;

            if (letter === target.char) {
                fillBox(target, letter);
                checkWordComplete();
            } else {
                registerTypo();
            }
        }
        function fillBox(box, letter) {
            box.entity.add([
                k.text(letter, {
                    size: 36,
                    font: "Ajelins"
                }),
                k.color("#dcff14"),
                k.anchor("center"),
            ]);
            box.filled = true;
        };
        subs.add(
            fromEvent(window, "keydown").subscribe(e => {
                if (e.key.length !== 1) return;

                const letter = e.key.toUpperCase();
                handleLetter(letter);
            })
        );

        // TIMER
        const timerType = k.add([
            k.text("")
        ])

        // ===== UPDATE LOOP =====
        const STEP = 90;       // rotation step
        const INTERVAL = 0.8;  // seconds per step
        let timer = 0;

        k.onUpdate(() => {

            timer += k.dt();

            if (timer >= INTERVAL) {
                timer = 0;

                floor.element.forEach(el => {
                    el.angle = (el.angle + STEP) % 360;
                });
            }
        });
    });
}
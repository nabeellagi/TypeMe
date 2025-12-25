import gsap from "gsap";
import { k } from "../../core/kaplay";
import { WORDLIST } from "../../core/wordlist";
import { bgGenerator } from "../../utils/bgGenerator";

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

        // ===== GAME STATE =====
        let gameState = "countdown";

        // Countdown
        let countdown = 3;

        // ===== SPRITE LAYERS =====
        const spriteLayer = {
            bg: 9,
            cotton: 10
        };

        // ===== CHALLENGE =====
        console.log(safeMachineResult);
        const result = {
            normal: resolvedWord(safeMachineResult.normal),
            reverse: resolvedWord(safeMachineResult.reverse),
        }
        console.log(result);

        // ===== BACKGROUND =====
        const floor = bgGenerator({
            z: spriteLayer.bg,
            sprite: "floor1"
        });
        k.setBackground("#03021e");

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
            duration: 2,
            ease: "power2.out"
        });
        cottonTl.to(cottonSprite, {
            angle: "+=" + 35,
            duration: 1.5,
            ease: "power2.out"
        }, "<");

        // ===== UPDATE LOOP =====
        k.onUpdate(() => {

        });
    });
}
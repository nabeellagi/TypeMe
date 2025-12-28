import gsap from "gsap";
import { k } from "../../core/kaplay";
import { bgGenerator } from "../../utils/bgGenerator";

/**
HELPERS
 */

function flickerLetter(letter, duration = 0.6){
    const flickerTl = gsap.timeline();
    const flickerCounnt = Math.floor(6 + Math.random() * 6);

    for(let i = 0; i < flickerCounnt; i++){
        flickerTl.to(letter, {
            opacity: Math.random() > 0.5 ? 1 : 0.1,
            duration: 0.04 + Math.random() * 0.06
        });
    };

    flickerTl.to(letter, {
        opacity: 1,
        duration: 0.15
    });
    return flickerTl;
} 

export function registerClicker() {
    k.scene("clicker", ({ typoWords, bannedWords, score } = {}) => {
        // DEBUG MODE
        // k.debug.inspect = true;

        // ==== VARIABLE SET UP ====
        let gameState = "opening";

        typoWords = Array.isArray(typoWords) ? typoWords : ["FAIL", "TEAR", "ABSOLUTE", "FATAL", "JAMES", "JEANS", "EMPOWER", "ELBOW", "WEATHER"];
        bannedWords = Array.isArray(bannedWords) ? bannedWords : ["FAIL", "TEAR", "ABSOLUTE", "FATAL", "JAMES", "JEANS", "EMPOWER", "ELBOW", "WEATHER"];
        score = typeof score === "number" ? score : 0;

        // debug
        console.log(typoWords[1]);
        console.log(bannedWords[0]);
        console.log(score);

        const damage = typoWords.length;

        const spriteLayer = {
            bg: 9,
            cotton: 100,
            uiLayer: 11
        };

        // ===== BACKGROUND ====
        const overlay = k.add([
            k.rect(k.width(), k.height()),
            k.pos(0, 0),
            k.opacity(0.92),
            k.color("#100738"),
            k.anchor("topleft"),
            k.fixed(),
            k.z(99)
        ]);

        const floor = bgGenerator({
            z: spriteLayer.bg,
            sprite: "buns",
            scale: 3.5,
            floorHeight: 64 * 3.5,
            floorWidth: 64 * 3.5,
            add: 220
        });

        // ==== TITLE ====
        // smaller text
        const phaseSmall = k.add([
            k.text("PHASE 3", {
                font: "Kaph",
                size: 32
            }),
            k.pos(k.width() / 2, -50),
            k.anchor("center"),
            k.fixed(),
            k.opacity(0),
            k.rotate(0),
            k.z(overlay.z)
        ]);

        // Bigger text
        const TITLE = "TYPO CLICKER";
        const letters = []
        const letterGap = 68;
        const startX = k.width() / 2 - ((TITLE.length - 1) * letterGap) / 2;

        TITLE.split("").forEach((char, i) => {
            if (char === " ") return;

            const letter = k.add([
                k.text(char, {
                    font: "Kaph",
                    size: 82
                }),
                k.pos(startX + (i * letterGap), 240),
                k.anchor("center"),
                k.fixed(),
                k.opacity(0),
                k.rotate(0),
                k.z(999)
            ]);
            letters.push(letter);
        });

        // animate title
        const introTl = gsap.timeline(
            { defaults : { ease: "power3.out" }, }
        );
        // Smol text slide
        introTl.to(phaseSmall.pos, {
            y: 120,
            duration: 0.8
        });
        introTl.to(phaseSmall, {
            opacity: 1,
            duration: 0.4
        }, "<");
        introTl.to({}, { duration: 0.2 });
        // Big text
        introTl.to(letters, {
            opacity: 0.4,
            duration: 0.2,
            stagger: 0.05
        });
        introTl.add(() => {
            letters.forEach((letter, i) => {
                gsap.delayedCall(i * 0.06, () => {
                    flickerLetter(letter);
                })
            })
        });
        introTl.to({}, { duration: 2 });
        // Fall
        introTl.to([phaseSmall.pos, ...letters.map(l => l.pos)], {
            y: k.height() + 200,
            duration: 1.2,
            ease: "power2.in",
            delay: () => k.rand(0.2, 0.6),
            onComplete: () => k.shake(10)
        });
        introTl.to(letters, {
            angle : () => k.rand(-45, 45),
            duration: 1.2
        }, "<");
        introTl.to(phaseSmall, {
            angle : -25,
            duration: 1.2
        }, "<");
        // ===== UPDATE ===== 
        k.onUpdate(() => {

        });

        k.onSceneLeave(() => {

        });
    });
}
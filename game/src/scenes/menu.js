import { k } from "../core/kaplay";
import { gsap } from 'gsap';
import { Btn } from "../utils/btn";

import { fromEvent } from "rxjs";
import { debounceTime } from "rxjs/operators";

export function registerMenu() {
    k.scene("menu", () => {

        // ==== BACKGROUND =====
        const bg = k.add([
            k.sprite("bg1"),
            k.scale(0.65)
        ]);

        // ==== TITLE ====
        const title = k.add([
            k.sprite("logo"),
            k.scale(0.25),
            k.pos(k.width() / 2, 40),
            k.anchor("top"),
        ]);
        gsap.to(title.scale, {
            x: 0.27,
            y: 0.27,
            duration: 2.2,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
        });

        // ===== OC =====
        const cotton = k.add([
            k.sprite("yes"),
            k.scale(0.13),
            k.pos(400, k.height() / 2),
            k.anchor("left")
        ]);
        // Instruction!
        k.add([
            k.text("Type 'Start' to begin!", {
                font: "Ajelins",
                size: 25,
                letterSpacing: 2
            }),
            k.pos(k.width() / 2, k.height() / 2 + 180),
            k.anchor("center")
        ]);

        // ==== START GAME MECHANICS =====
        const WORD = "START";
        const LETTER_GAP = 36;

        const letters = WORD.split("").map((char, i) =>
            k.add([
                k.text(char, {
                    font: "Kimbab",
                    size: 42
                }),
                k.pos(
                    k.width() / 2 + (i - (WORD.length - 1) / 2) * LETTER_GAP,
                    k.height() / 2 + 250,
                ),
                k.anchor("center"),
                k.opacity(0.4)
            ])
        );

        // Input Start
        let currentIndex = 0;
        let timeoutSub = null;

        const key$ = fromEvent(window, "keydown");
        const idle$ = fromEvent(window, "keydown").pipe(
            debounceTime(1500)
        );

        idle$.subscribe(() => {
            currentIndex = 0;
            letters.forEach(l => {
                gsap.to(l, {
                    opacity: 0.4,
                    duration: 0.15,
                    ease: "power2.out",
                });
            });
        });

        key$.subscribe((e) => {
            const key = e.key.toUpperCase();

            // wrong? reset
            if (key != WORD[currentIndex]) {
                currentIndex = 0;
                letters.forEach(l => {
                    gsap.to(l, {
                        opacity: 0.4,
                        duration: 0.15,
                        ease: "power2.out"
                    })
                })
                return;
            };

            // correct 
            gsap.to(letters[currentIndex], {
                opacity: 1,
                duration: 0.15,
                ease: "power2.out",
                onComplete: () => {
                    currentIndex++
                    // sfx
                }
            });

            // finished word
            if (currentIndex === WORD.length) {
                if (timeoutSub) timeoutSub.unsubscribe();
                // startGame();
            }
        });

        // ===== UI BUTTON =====
        const tutorialBtn = Btn({
            text: "Tutorial",
            pos: k.vec2(k.width() - 460, k.height() / 2 - 90)
        });

        const creditBtn = Btn({
            text: "Credit",
            pos: k.vec2(k.width() - 460, k.height() / 2 + 30)
        });

    });
};
import { k } from "../core/kaplay";
import { gsap } from 'gsap';
import { Btn } from "../ui/btn";

import { fromEvent, Subscription } from "rxjs";
import { debounceTime, filter, map } from "rxjs/operators";
import { particleTouch } from "../utils/particleTouch";
import { theme } from "../core/kaplay/theme";

let menubgm = null;

export function registerMenu() {
    k.scene("menu", () => {

        // ==== BGM ====
        if (!menubgm) {
            menubgm = k.play("Midnight", {
                volume: 0.6,
                loop: true
            });
        }
        const stopBgm = () => {
            if (menubgm) {
                gsap.to(menubgm, {
                    duration: 1.5,
                    volume: 0,
                    onComplete: () => menubgm.stop(),
                    ease: "power2.out",
                });
                menubgm = null;
            }
        };
        // ==== BACKGROUND =====
        const bg = k.add([
            k.sprite("bg1"),
            k.scale(0.65),
            k.fixed()
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
        let cottonState = "excited";
        const cotton = k.add([
            k.sprite(cottonState),
            k.scale(0.13),
            k.pos(540, k.height() / 2 - 50),
            k.anchor("center")
        ]);
        // Instruction!
        k.add([
            k.text("Type 'Start' to begin!", {
                font: "Ajelins",
                size: 25,
                letterSpacing: 2
            }),
            k.pos(k.width() / 2, k.height() / 2 + 180),
            k.anchor("center"),
            k.color(theme.lightPink)
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
                k.opacity(0.4),
                k.color(theme.lightPink)
            ])
        );

        // Input Start
        let currentIndex = 0;
        let timeoutSub = null;

        const subs = new Subscription();

        const key$ = fromEvent(window, "keydown").pipe(
            map(e => e.key.toUpperCase()),
            filter(key => /^[A-Z]$/.test(key))
        );
        const idle$ = fromEvent(window, "keydown").pipe(
            debounceTime(1500)
        );

        // START GAME
        function startGame() {
            const jumpHeight = 60;
            const startY = cotton.pos.y;

            const tl = gsap.timeline({
                defaults: { ease: "power2.out" }
            });

            // Jump
            tl.to(cotton.pos, {
                y: startY - jumpHeight,
                duration: 0.35
            });
            // Flip n change
            tl.to(cotton.scale, {
                x: -0.13,
                duration: 0.2,
                ease: "power2.out",
                onStart: () => {
                    cotton.use(k.sprite("yes"));
                }
            }, "<");
            tl.to(cotton.scale, {
                x: 0.13,
                duration: 0.15,
                ease: "power2.out",
            }, ">-0.05");
            // Bounce back
            tl.to(cotton.pos, {
                y: startY,
                duration: 0.45,
                ease: "bounce.out"
            }, "<");

            tl.fromTo(
                cotton.scale,
                { y: 0.12 },
                {
                    y: 0.13,
                    duration: 0.25,
                    ease: "elastic.out(1, 0.4)",
                    onComplete: () => {
                        k.wait(1.2, () => {
                            k.go("choose");
                            stopBgm();
                        })
                    }
                },
                "-=0.15",
            );
        };

        subs.add(
            idle$.subscribe(() => {
                k.shake(12);
                currentIndex = 0;
                letters.forEach(l => {
                    gsap.to(l, {
                        opacity: 0.4,
                        duration: 0.15,
                        ease: "power2.out",
                    });
                });
                cotton.use(k.sprite("excited"));
            })
        )

        subs.add(
            key$.subscribe((key) => {
                if (key !== WORD[currentIndex]) {
                    currentIndex = 0;
                    letters.forEach(l => {
                        gsap.to(l, { opacity: 0.4, duration: 0.15, ease: "power2.out" });
                    });
                    k.shake(12);
                    return;
                }

                gsap.to(letters[currentIndex], {
                    opacity: 1,
                    duration: 0.15,
                    ease: "power2.out"
                });

                currentIndex++;

                if (currentIndex === WORD.length) startGame();
            })
        );

        // ===== UI BUTTON =====
        const tutorialBtn = Btn({
            text: "Tutorial",
            pos: k.vec2(k.width() - 460, k.height() / 2 - 90),
            color: theme.lightPink,
            onClick: () => {
                k.go("tutorial")
            }
        });

        const creditBtn = Btn({
            text: "Credit",
            pos: k.vec2(k.width() - 460, k.height() / 2 + 30),
            color: theme.lightPink,
            onClick: () => {
                k.go("credit")
            }
        });

        // ===== SET PARTICLE TOUCH =====
        k.onMousePress((pos) => {
            const mousePos = k.mousePos();
            particleTouch(mousePos.x, mousePos.y);
        });

        // ====== UN SUB =====
        k.onSceneLeave(() => {
            subs.unsubscribe();
        })
    });
};
import gsap from "gsap";
import { k } from "../../core/kaplay";
import { bgGenerator } from "../../utils/bgGenerator";
import { particleTouch } from "../../utils/particleTouch";

/**
HELPERS
 */

function flickerLetter(letter, duration = 0.6) {
    const flickerTl = gsap.timeline();
    const flickerCounnt = Math.floor(6 + Math.random() * 6);

    for (let i = 0; i < flickerCounnt; i++) {
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

function getWordHP(word) {
    if (word.length <= 5) return 2;
    return 3;
};

function explosionEffect(pos) {
    const boom = k.add([
        k.circle(15),
        k.color("#FFFFFF"),
        k.opacity(0.6),
        k.pos(pos),
        k.z(999)
    ]);

    gsap.to(boom, {
        duration: 0.35,
        scale: 6,
        opacity: 0,
        ease: "power2.out",
        onComplete: () => boom.destroy()
    });
};


export function registerClicker() {
    k.scene("clicker", ({ typoWords, bannedWords, score } = {}) => {
        // DEBUG MODE
        // k.debug.inspect = true;

        // ==== VARIABLE SET UP ====
        let gameState = "opening";
        let control = false;
        let timer = 45;

        typoWords = Array.isArray(typoWords) ? typoWords : ["FAIL", "TEAR", "ABSOLUTE", "FATAL", "JAMES", "JEANS", "EMPOWER", "ELBOW", "WEATHER"];
        bannedWords = Array.isArray(bannedWords) ? bannedWords : ["FAIL", "TEAR", "ABSOLUTE", "FATAL", "JAMES", "JEANS", "EMPOWER", "ELBOW", "WEATHER"];
        score = typeof score === "number" ? score : 0;

        // debug
        console.log(typoWords[1]);
        console.log(bannedWords[0]);
        console.log(score);

        const damage = typoWords.length;
        let addScore = Math.ceil(damage); 

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
            k.z(spriteLayer.bg + 1)
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
        const introTl = gsap.timeline({
            defaults: {
                ease: "power3.out",
            }
        });
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
            angle: () => k.rand(-45, 45),
            duration: 1.2
        }, "<");
        introTl.to(phaseSmall, {
            angle: -25,
            duration: 1.2,
        }, "<");
        // Overlay opacity change
        introTl.to(overlay, {
            opacity: 0.6,
            duration: 0.5,
            ease: "power2.out"
        }, "<");
        introTl.eventCallback("onComplete", () => {
            startAttackLoop(typoWords);
        });


        // ==== SPRITE ====

        // ==== CLICKER ENEMY ====
        // Animated Helpers
        function clickFeedback(obj) {

            gsap.killTweensOf(obj.scale);
            gsap.killTweensOf(obj);

            const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

            tl.to(obj.scale, {
                x: 0.9,
                y: 0.9,
                duration: 0.07,
                ease: "power2.in"
            })
                .to(obj, {
                    angle: obj.angle + gsap.utils.random(-6, 6),
                    duration: 0.07,
                }, "<")
                .to(obj.scale, {
                    x: 1.12,
                    y: 1.12,
                    duration: 0.12
                })
                .to(obj.scale, {
                    x: 1,
                    y: 1,
                    duration: 0.08
                })
                .to(obj, {
                    duration: 0.08
                }, "<");
        }
        function destroyPop(obj) {
            const tl = gsap.timeline({
                defaults: { ease: "back.in" },
                onComplete: () => obj.destroy()
            });

            tl.to(obj.scale, {
                x: 1.4,
                y: 1.4,
                duration: 0.12
            })
                .to(obj, {
                    opacity: 0,
                    duration: 0.15
                })
                .to(obj.scale, {
                    x: 0,
                    y: 0,
                    duration: 0.15
                }, "<");
        };
        function spawnRipple(pos) {

            const ripple = k.add([
                k.circle(8),
                k.pos(pos),
                k.opacity(0.8),
                k.color(255, 255, 255),
            ]);

            gsap.to(ripple.scale, {
                x: 3,
                y: 3,
                duration: 0.35
            });

            gsap.to(ripple, {
                opacity: 0,
                duration: 0.35,
                ease: "power1.out",
                onComplete: () => ripple.destroy()
            });
        }
        // Attack Pattern Helpers
        function spawnWordEntity(word, startPos) {
            const hp = getWordHP(word);

            const obj = k.add([
                k.text(word, { font: "Ajelins", size: 48, letterSpacing: 1.4 }),
                k.pos(startPos),
                k.anchor("center"),
                k.area(),
                k.rotate(0),
                k.opacity(1),
                k.scale(1),
                {
                    hp,
                    word,
                    clicked: false,
                    exploded: false
                },
                k.z(spriteLayer.uiLayer)
            ]);

            obj.onClick(() => {
                const mousePos = k.mousePos().clone();
                particleTouch(mousePos.x, mousePos.y);

                clickFeedback(obj);
                spawnRipple(obj.pos);

                obj.hp--;
                score += addScore;
                addScore++;

                if (obj.hp <= 0 && !obj.exploded) {
                    obj.exploded = true;
                    destroyPop(obj);
                }
            });
            return obj;
        }
        function spawnSlidingAttack(word) {
            const side = Math.random() > 0.5 ? "left" : "right";
            const y = k.rand(200, k.height() - 140);
            // for each side
            const startX = side === "left" ? -220 : k.width() + 220;
            const endX = side === "left" ? k.width() - 10 : -10;

            const obj = spawnWordEntity(word, k.vec2(startX, y));

            const tween = gsap.to(obj.pos, {
                x: endX,
                duration: k.rand(5, 6),
                ease: "linear",
                onComplete: () => {
                    if (!obj.exploded && obj.exists()) {
                        obj.exploded = true;
                        explosionEffect(obj.pos);
                        score -= damage;
                        obj.destroy();
                    }
                }
            });
            obj.onDestroy(() => tween.kill());
        };
        function spawnFallingAttack(word) {
            const x = k.rand(120, k.width() - 120);

            const obj = spawnWordEntity(word, k.vec2(x, -140));


            let speed = 35;
            const gravity = 350;
            const groundY = k.height() - 50;

            gsap.fromTo(obj, { opacity: 0, angle: 0 }, { opacity: 1, angle: 90, duration: 0.4 });

            obj.onUpdate(() => {
                if (obj.exploded) return;
                speed += gravity * k.dt();
                obj.pos.y += speed * k.dt();

                // Ground hit
                if (obj.pos.y >= groundY) {
                    obj.pos.y = groundY;

                    if (obj.hp > 0 && !obj.exploded) {
                        obj.exploded = true;

                        gsap.delayedCall(0.2, () => {
                            if (!obj.exists()) return;

                            explosionEffect(obj.pos);
                            score -= damage;
                            obj.destroy();
                        });
                    }
                }
            })
        }

        // Attack Loop
        function startAttackLoop(wordsArray) {

            function spawn() {
                if (timer <= 0) return;

                const word = k.choose(wordsArray);

                if (Math.random() < 0.5) {
                    spawnSlidingAttack(word);
                } else {
                    spawnFallingAttack(word);
                }

                gsap.delayedCall(k.rand(1, 2), spawn);
            }

            spawn();
        }

        // ===== UPDATE ===== 
        k.onUpdate(() => {

        });

        k.onSceneLeave(() => {

        });
    });
}
import gsap from "gsap";
import { k } from "../../core/kaplay";
import { bgGenerator } from "../../utils/bgGenerator";
import { particleTouch } from "../../utils/particleTouch";
import * as Tone from "tone";
import { theme } from "../../core/kaplay/theme";
import { Btn } from "../../ui/btn";

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
    if (word.length <= 6) return 2;
    return 3;
};

function explosionEffect(pos) {
    const boom = k.add([
        k.circle(25),
        k.color("#FFFFFF"),
        k.opacity(0.4),
        k.scale(1),
        k.pos(pos),
        k.z(999)
    ]);

    gsap.to(boom.scale, {
        duration: 0.35,
        x: 50,
        y: 50,
        ease: "power2.out",
    });
    gsap.to(boom, {
        opacity: 0,
        duration: 0.35
    });
};

let bgm = null;

export function registerClicker() {
    k.scene("clicker", ({ typoWords, bannedWords, score } = {}) => {
        // DEBUG MODE
        // k.debug.inspect = true;

        // BGM
        // if(!bgm){
        //     bgm = k.play("Space", {
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
        // ==== VARIABLE SET UP ====
        let gameState = "opening";
        let timer = 55;

        typoWords = Array.isArray(typoWords) ? typoWords : ["FAIL", "TEAR", "ABSOLUTE", "FATAL", "JAMES", "JEANS", "EMPOWER", "ELBOW", "WEATHER"];
        bannedWords = Array.isArray(bannedWords) ? bannedWords : ["FAIL", "TEAR", "ABSOLUTE", "FATAL", "JAMES", "JEANS", "EMPOWER", "ELBOW", "WEATHER"];
        score = typeof score === "number" ? score : 500;

        // SFX
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

        // debug
        console.log(bannedWords);
        console.log(typoWords);
        console.log(score);

        const damage = Math.ceil(typoWords.length * 1.5);
        // let addScore = Math.ceil(damage / 2);

        const typoCount = typoWords.length || 0;
        const bannedCount = bannedWords.length;
        const noTypoMode = typoCount === 0;

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
            k.z(spriteLayer.uiLayer + 1)
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

            overlay.z = spriteLayer.bg + 1;

            if (noTypoMode) {

                gameState = "ended";

                const congrats = showNoTypoCongrats();

                if (!bgm) {
                    bgm = k.play("Space", {
                        volume: 0.4,
                        loop: false
                    });
                }

                gsap.delayedCall(1.8, () => {
                    congrats.destroy();

                    showScoreScreen({
                        score,
                        typoCount,
                        bannedCount
                    });
                });

                return;
            }
            gameState = "play";
            startAttackLoop(typoWords);

            if (!bgm) {
                bgm = k.play("Space", {
                    volume: 0.6,
                    loop: true
                });
            }
        });

        // ==== UI ====
        const uis = [];
        const timerText = k.add([
            k.text(`${timer}`, {
                font: "Ajelins",
            }),
            k.pos(k.width() / 2 - 200, k.height() - 150),
            k.anchor("center"),
            k.opacity(0.8),
            k.color(theme.yellow),
            k.z(spriteLayer.uiLayer)
        ]);
        uis.push(timerText);

        const max_score = score;
        const scoreBarSize = {
            width: 200,
            height: 30
        }
        const getScoreBarWidth = (currentScore) => {
            return Math.min(Math.max(0, (currentScore / max_score) * scoreBarSize.width), scoreBarSize.width);
        }
        let scoreBar_width = getScoreBarWidth(score);
        const scoreBar_bg = k.add([
            k.rect(scoreBarSize.width, scoreBarSize.height),
            k.pos(k.width() / 2 - 120, k.height() - 152),
            k.color(theme.red),
            k.anchor("left"),
            k.z(spriteLayer.uiLayer)
        ]);
        const scoreBar = k.add([
            k.rect(scoreBar_width, scoreBarSize.height),
            k.pos(k.width() / 2 - 120, k.height() - 152),
            k.color(theme.yellow),
            k.anchor("left"),
            k.z(scoreBar_bg.z)
        ]);
        const scoreText = k.add([
            k.text(`${score}/${max_score}`, {
                font: "Ajelins",
            }),
            k.pos(k.width() / 2 - 20, k.height() - 110),
            k.anchor("center"),
            k.opacity(0.8),
            k.color(theme.yellow),
            k.z(spriteLayer.uiLayer)
        ]);
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
        };
        function startDangerBlink(obj) {
            obj.color = k.rgb(255, 80, 80);

            const tl = gsap.timeline({ repeat: -1, yoyo: true });

            tl.to(obj, {
                opacity: 0.4,
                duration: 0.15,
                ease: "power1.inOut"
            });

            tl.to(obj.scale, {
                x: 1.08,
                y: 1.08,
                duration: 0.15,
                ease: "power1.inOut"
            }, "<");

            obj.warningTween = tl;
        }
        function stopDangerBlink(obj) {
            if (obj.warningTween) {
                obj.warningTween.kill();
                obj.warningTween = null;
            }
            obj.opacity = 1;
            obj.scale = k.vec2(1);
            obj.color = k.rgb(255, 255, 255);
        }
        // Attack Pattern Helpers
        function spawnWordEntity(word, startPos) {
            const hp = getWordHP(word);

            const obj = k.add([
                k.text(word, { font: "Ajelins", size: 56, letterSpacing: 1.4 }),
                k.pos(startPos),
                k.anchor("center"),
                k.area(),
                k.rotate(0),
                k.opacity(1),
                k.scale(1),
                k.color(k.rgb(255, 255, 255)),
                {
                    hp,
                    word,
                    clicked: false,
                    exploded: false,
                    landing: false,
                    warningTween: false,
                    explodeTimer: false
                },
                k.z(spriteLayer.uiLayer)
            ]);
            const chords = [
                ["C5", "E5", "G5"],   // C major
                ["F5", "A5", "C6"],   // F major
                ["G4", "B4", "D5"],   // G major
                ["A4", "C5", "E5"],   // A minor
                ["D5", "F#5", "A5"],  // D major
            ];

            const chord = k.choose(chords);
            obj.onClick(() => {
                if (obj.exploded) return;

                const mousePos = k.mousePos().clone();
                particleTouch(mousePos.x, mousePos.y);

                const now = Tone.now();
                synth.triggerAttackRelease(chord[0], "16n", now);
                synth.triggerAttackRelease(chord[0], "16n", now + 0.03);
                synth.triggerAttackRelease(chord[0], "16n", now + 0.06);

                clickFeedback(obj);
                spawnRipple(obj.pos);

                obj.hp--;

                if (obj.hp <= 0) {
                    obj.exploded = true;

                    if (obj.explodeTimer) {
                        obj.explodeTimer.kill();
                        obj.explodeTimer = null;
                    }

                    stopDangerBlink(obj);
                    destroyPop(obj);

                    // score = Math.min(score+addScore, max_score);
                    // addScore++;
                    scoreBar_width = getScoreBarWidth(score);
                    scoreBar.width = scoreBar_width;
                    scoreText.text = `${score}/${max_score}`;
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
                duration: k.rand(7, 9),
                ease: "linear",
                onComplete: () => {
                    if (!obj.exploded && obj.exists()) {
                        obj.exploded = true;
                        explosionEffect(obj.pos);

                        const chord = ["C4", "D4", "E4", "G4", "A4"];
                        synth.triggerAttackRelease(chord, "8n", Tone.now());

                        score -= damage;
                        score = Math.max(0, score);
                        scoreBar_width = getScoreBarWidth(score);
                        scoreBar.width = scoreBar_width;
                        scoreText.text = `${score}/${max_score}`;

                        obj.destroy();
                    }
                }
            });
            obj.onDestroy(() => tween.kill());
        };
        function spawnFallingAttack(word) {
            const x = k.rand(120, k.width() - 120);

            const obj = spawnWordEntity(word, k.vec2(x, -140));

            let speed = 25;
            const gravity = 250;
            const groundY = k.height() - 70;

            gsap.fromTo(obj, { opacity: 0, angle: 0 }, { opacity: 1, angle: 90, duration: 0.4 });

            obj.onUpdate(() => {
                if (obj.exploded) return;

                if (!obj.landing) {
                    speed += gravity * k.dt();
                    obj.pos.y += speed * k.dt();
                }
                // Ground hit
                if (obj.pos.y >= groundY && !obj.landing) {
                    obj.pos.y = groundY;
                    obj.landing = true;
                    speed = 0;
                    startDangerBlink(obj);

                    obj.explodeTimer = gsap.delayedCall(0.9, () => {
                        if (!obj.exists()) return;
                        if (obj.hp <= 0) return;

                        obj.exploded = true;
                        stopDangerBlink(obj);
                        explosionEffect(obj.pos);

                        const chord = ["C4", "D4", "E4", "G4", "A4"];
                        synth.triggerAttackRelease(chord, "8n", Tone.now());

                        score -= damage;
                        score = Math.max(0, score);
                        scoreBar_width = getScoreBarWidth(score);
                        scoreBar.width = scoreBar_width;
                        scoreText.text = `${score}/${max_score}`;

                        obj.destroy();
                    });
                }
            });

        }

        // Attack Loop
        function startAttackLoop(wordsArray) {

            function spawn() {
                if (timer <= 8) return;

                const word = k.choose(wordsArray);

                if (Math.random() < 0.5) {
                    spawnSlidingAttack(word);
                } else {
                    spawnFallingAttack(word);
                }

                gsap.delayedCall(k.rand(0.65, 1.3), spawn);
            }

            spawn();
        }

        // ===== END SCREEN ====
        function showScoreScreen({ score, typoCount, bannedCount }) {

            function tweenNumber({ from, to, duration, onUpdate, onComplete }) {
                const obj = { value: from };
                gsap.to(obj, {
                    value: to,
                    duration,
                    ease: "power2.out",
                    onUpdate: () => onUpdate(Math.floor(obj.value)),
                    onComplete
                });
            }

            const accuracy = bannedCount === 0
                ? 1
                : Math.max(0, 1 - (typoCount / bannedCount));

            const percent = Math.round(accuracy * 100);

            // Dim background
            const panelBg = k.add([
                k.rect(k.width(), k.height()),
                k.color(0, 0, 0),
                k.opacity(0),
                k.fixed(),
                k.z(999)
            ]);

            gsap.to(panelBg, {
                opacity: 0.65,
                duration: 0.6,
                ease: "power2.out"
            });

            // Center panel
            const panel = k.add([
                k.rect(800, 600, { radius: 16 }),
                k.color("#4a5be6"),
                k.opacity(0),
                k.anchor("center"),
                k.pos(k.width() / 2, k.height() / 2),
                k.scale(0.8),
                k.fixed(),
                k.z(panelBg.z + 1)
            ]);

            gsap.to(panel, {
                opacity: 1,
                duration: 0.7,
                ease: "back.out(1.6)"
            });

            gsap.to(panel.scale, {
                x: 1,
                y: 1,
                duration: 0.7,
                ease: "back.out(1.6)"
            });

            // Title
            const title = k.add([
                k.text("RESULTS", { font: "Kaph", size: 56 }),
                k.pos(panel.pos.x, panel.pos.y - 120),
                k.anchor("center"),
                k.opacity(0),
                k.fixed(),
                k.z(panel.z + 1)
            ]);

            gsap.to(title, {
                opacity: 1,
                duration: 0.5
            });

            // Score text
            const scoreText = k.add([
                k.text("Score: 0", { font: "Ajelins", size: 38 }),
                k.pos(panel.pos.x, panel.pos.y - 30),
                k.anchor("center"),
                k.opacity(0),
                k.scale(0.7),
                k.fixed(),
                k.z(panel.z + 1)
            ]);

            gsap.to(scoreText.scale, {
                x: 1,
                y: 1,
                duration: 0.5,
                ease: "back.out(1.8)"
            });
            gsap.to(scoreText, {
                opacity: 1,
                duration: 0.5
            });

            tweenNumber({
                from: 0,
                to: score,
                duration: 1.1,
                onUpdate: v => scoreText.text = `Score: ${v}`,
            });

            // Bar
            const accBarBg = k.add([
                k.rect(360, 14, { radius: 7 }),
                k.pos(panel.pos.x - 180, panel.pos.y + 40),
                k.color(60, 60, 80),
                k.fixed(),
                k.z(panel.z + 1)
            ]);

            const accBar = k.add([
                k.rect(0, 14, { radius: 7 }),
                k.pos(panel.pos.x - 180, panel.pos.y + 40),
                k.color(theme.yellow),
                k.fixed(),
                k.z(accBarBg.z + 1)
            ]);

            gsap.to(accBar, {
                width: 360 * accuracy,
                duration: 1,
                ease: "power3.out"
            });

            // Accuracy text
            const accuracyText = k.add([
                k.text("Accuracy: 0%", { font: "Ajelins", size: 30 }),
                k.pos(panel.pos.x, panel.pos.y + 70),
                k.anchor("center"),
                k.opacity(0),
                k.fixed(),
                k.z(panel.z + 1)
            ]);

            gsap.to(accuracyText, { opacity: 1, delay: 0.9 });

            tweenNumber({
                from: 0,
                to: percent,
                duration: 0.9,
                onUpdate: v => accuracyText.text = `Accuracy: ${v}%`
            });

            // RANK
            function getRank(ratio) {
                if (ratio >= 0.90) return "S";
                if (ratio >= 0.80) return "A";
                if (ratio >= 0.75) return "B";
                if (ratio >= 0.70) return "C";
                return "D";
            }

            const rankRatio = bannedCount === 0
                ? 1
                : Math.max(0, (bannedCount - typoCount) / bannedCount);

            const rank = getRank(rankRatio);
            const rankText = k.add([
                k.text(rank, { font: "Kaph", size: 60 }),
                k.pos(panel.pos.x, panel.pos.y + 170),
                k.anchor("center"),
                k.opacity(0),
                k.scale(0),
                k.fixed(),
                k.rotate(1),
                k.z(panel.z + 2)
            ]);
            const rankTl = gsap.timeline({ delay: 1.6 });

            rankTl
                .to(rankText.scale, {
                    x: 1.4,
                    y: 1.4,
                    duration: 0.25,
                    ease: "power4.out",
                    onStart: () => k.shake(14)
                })
                .to(rankText, {
                    opacity: 1,
                    duration: 0.25
                }, "<")
                .to(rankText, {
                    angle: 10,
                    duration: 0.25,
                    ease: "power4.out",
                })
            rankTl.eventCallback("onComplete", () => {
                const returnBtn = Btn({
                    text: "Back",
                    pos: k.vec2(120, k.height() - 90),
                    color: theme.lightPink,
                    onClick: () => {
                        k.go("menu")
                    },
                    z: panel.z + 1
                });
            })
            if (typoCount === 0) {
                const cheer = k.add([
                    k.text("PERFECT!", { font: "Kaph", size: 48 }),
                    k.pos(panel.pos.x, panel.pos.y + 110),
                    k.anchor("center"),
                    k.opacity(0),
                    k.fixed(),
                    k.z(panel.z + 2)
                ]);

                gsap.to(cheer, {
                    opacity: 1,
                    yoyo: true,
                    repeat: -1,
                    duration: 1.2,
                    ease: "sine.inOut"
                });
                gsap.to(cheer.scale, {
                    x: 1,
                    y: 1,
                    duration: 0.7,
                    ease: "back.out(1.6)"
                });

            }
        };
        function showNoTypoCongrats() {
            const text = k.add([
                k.text("CONGRATS!\nNO TYPO!", {
                    font: "Kaph",
                    size: 64,
                    align: "center"
                }),
                k.pos(k.width() / 2, k.height() / 2),
                k.anchor("center"),
                k.opacity(0),
                k.scale(0.8),
                k.fixed(),
                k.z(999)
            ]);

            gsap.to(text, {
                opacity: 1,
                duration: 0.7,
                ease: "back.out(1.6)"
            });

            gsap.to(text.scale, {
                x: 1,
                y: 1,
                duration: 0.7,
                ease: "back.out(1.6)"
            });

            gsap.to(text, {
                y: text.pos.y - 20,
                yoyo: true,
                repeat: -1,
                duration: 1.2,
                ease: "sine.inOut"
            });

            return text;
        }
        function endPhase() {
            stopBgm?.();

            gsap.to(overlay, {
                opacity: 0.85,
                duration: 0.6,
                ease: "power2.inOut"
            });

            // const typoCount = typoWords.length;
            // const bannedCount = bannedWords.length;

            showScoreScreen({
                score,
                typoCount,
                bannedCount
            });
        }

        // ===== UPDATE ===== 
        k.onUpdate(() => {
            const dt = k.dt();
            if (gameState === "play") {
                if (timer > 0) {
                    timer -= dt;
                    timerText.text = Math.ceil(timer);
                };
                if (timer <= 0 && gameState === "play") {
                    gameState = "ended";

                    endPhase();
                }
            }
        });

        k.onSceneLeave(() => {
            synth.dispose();
            Tone.Transport.stop();
            Tone.Transport.cancel();

            gsap.killTweensOf("*");
            gsap.globalTimeline.clear();

            stopBgm();
        });
    });
}
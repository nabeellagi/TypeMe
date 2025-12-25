import gsap from "gsap";
import { k } from "../core/kaplay";
import { fromEvent, Subscription } from "rxjs";
import { debounceTime } from "rxjs/operators";

// This thing appeared in my dreams, the bugs are haunting me
export function randomGen({ machine, attempts }) {
    return new Promise((resolve) => {

        // QUIT VARS
        let finished = false;
        let spinning = false;

        // ===== ROOT =====
        const root = k.add([
            k.fixed(),
            k.z(200),
            k.pos(0, 0),
            k.anchor("center")
        ]);

        // Overlay
        root.add([
            k.rect(k.width(), k.height()),
            k.pos(0, 0),
            k.color(0, 0, 0),
            k.opacity(0.5),
        ]);

        // Border 
        // const border

        // Main box
        const box = root.add([
            k.rect(800, 600, { radius: 16 }),
            k.pos(k.width() / 2, k.height() / 2),
            k.anchor("center"),
            k.color(machine.bg),
            k.z(999)
        ]);

        // ===== TEXTS =====
        box.add([
            k.text("Challenge Generator", {
                size: 42,
                lineSpacing: 1.2,
                font: "Kaph"
            }),
            k.pos(0, -250),
            k.anchor("center"),
        ]);

        let currentLength = machine.lengthRange[0];
        let currentType = machine.types[0];

        box.add([
            k.text("Word Length:", {
                size: 32,
                letterSpacing: 1.2,
                font: "Ajelins"
            }),
            k.pos(0, -160),
            k.anchor("center"),
        ]);
        const lengthText = box.add([
            k.text(currentLength, {
                size: 50,
                font: "Kimbab"
            }),
            k.pos(0, -90),
            k.anchor("center"),
            k.scale(1)
        ]);
        lengthText.text = "0";

        box.add([
            k.text("Type:", {
                size: 40,
                letterSpacing: 1.2,
                font: "Ajelins"
            }),
            k.pos(-200, 30),
            k.anchor("center"),
        ]);
        const typeText = box.add([
            k.text(currentType, {
                size: 55,
                font: "Kaph"
            }),
            k.pos(100, 40),
            k.anchor("center"),
            k.scale(1)
        ]);
        typeText.text = "XXX";

        const attemptText = box.add([
            k.text(`Attempts Left: ${3 - (attempts)}`, {
                size: 28,
                letterSpacing: 1.2,
                font: "Ajelins"
            }),
            k.pos(-260, 240),
            k.anchor("center"),
        ]);

        // ===== SPIN =====
        box.add([
            k.text("Type Spin to Proceed", {
                size: 32,
                letterSpacing: 1.2,
                font: "Ajelins"
            }),
            k.pos(0, 150),
            k.anchor("center"),
        ]);
        const WORD = "SPIN";
        const LETTER_GAP = 55;

        const letters = WORD.split("").map((char, i) =>
            box.add([
                k.text(char, {
                    font: "Kimbab",
                    size: 60
                }),
                k.pos(
                    (i - (WORD.length - 1) / 2) * LETTER_GAP,
                    200,
                ),
                k.anchor("center"),
                k.opacity(0.4),
            ])
        );

        // Spin Input
        let currentIndex = 0;
        let timeoutSub = null;

        const subs = new Subscription();

        const key$ = fromEvent(window, "keydown");
        const idle$ = fromEvent(window, "keydown").pipe(
            debounceTime(1500)
        );

        function spin() {
            const lenMin = machine.lengthRange[0];
            const lenMax = machine.lengthRange[1];

            const spinTl = gsap.timeline({
                defaults: { ease: "power2.out" }
            });

            // Zoom n spin
            spinTl.to([typeText.scale, lengthText.scale], {
                x: 1.4,
                y: 1.4,
                duration: 0.25,
            });

            spinTl.to({}, {
                duration: 0.9,
                onUpdate: () => {
                    currentLength = k.randi(lenMin, lenMax + 1);
                    currentType =
                        machine.types[k.randi(0, machine.types.length)];

                    lengthText.text = currentLength.toString();
                    typeText.text = currentType;
                }
            }, "<");

            spinTl.to([typeText.scale, lengthText.scale], {
                x: 1.15,
                y: 1.15,
                duration: 0.15,
            });

            spinTl.to([typeText.scale, lengthText.scale], {
                x: 1,
                y: 1,
                duration: 0.35,
            });

            spinTl.call(() => {
                close({
                    wordLength: currentLength,
                    type: currentType,
                });
            });
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
            })
        )
        subs.add(
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
                    });
                    return;
                };
                // correct 
                gsap.to(letters[currentIndex], {
                    opacity: 1,
                    duration: 0.15,
                    ease: "power2.out"
                });
                currentIndex++;
                // finished word
                if (currentIndex === WORD.length) {
                    spin();
                    if (timeoutSub) timeoutSub.unsubscribe();
                }
            })
        );
        root.onDestroy(() => {
            subs.unsubscribe();
        });

        // SAFELY QUITS
        function close(result = null) {
            if (finished) return;
            finished = true;

            k.wait(1, () => {
                root.destroy();
                resolve(result);
            });
        }

        k.onKeyPress("escape", () => {
            if (spinning) return;
            close(null);
        });

    })
}
import gsap from "gsap";
import { k } from "../core/kaplay";
import { particleTouch } from "../utils/particleTouch";
import { MonoSynth } from "tone";
import { theme } from "../core/kaplay/theme";

const BONUS_POOL = [
    { label: "+4", value: 4, weight: 2 },
    { label: "+3", value: 3, weight: 3 },
    { label: "+2", value: 2, weight: 5 },
    { label: "-3", value: -3, weight: 3 },
    { label: "-4", value: -4, weight: 3 },
    { label: "-5", value: -5, weight: 2 },
    { label: "x2", value: "MULTIPLY", weight: 0.6 },
];

function weightedPick(pool) {
    const total = pool.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * total;

    for (const p of pool) {
        r -= p.weight;
        if (r <= 0) return p;
    }
}

export function bonusClicker(onResolve) {
    const bonus = weightedPick(BONUS_POOL);

    const x = k.rand(120, k.width() - 120);
    const y = k.rand(140, k.height() - 180);

    const label = k.add([
        k.text(bonus.label, {
            font: "Ajelins",
            size: 55,
        }),
        k.pos(x, y),
        k.anchor("center"),
        k.color(bonus.value === "MULTIPLY" ? theme.yellow : theme.cyan),
        k.z(1000),
        k.opacity(0),
        k.fixed(),
        k.area(),
    ]);

    // Entrance
    gsap.to(label, {
        opacity: 1,
        duration: 0.2,
    });

    gsap.from(label.pos, {
        y: y + 20,
        duration: 0.4,
        ease: "power2.out",
    });

    // Hover float
    gsap.to(label.pos, {
        y: y - 12,
        duration: 1.2,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
    });

    // Click logic
    label.onClick(() => {
        onResolve(bonus);
        destroy();
        // particle
        const mousePos = k.mousePos().clone();
        particleTouch(mousePos.x, mousePos.y);
    });

    // Timeout auto-remove
    const timeout = k.wait(3, destroy);

    function destroy() {
        timeout?.cancel?.();

        gsap.to(label, {
            opacity: 0,
            duration: 0.25,
            onComplete: () =>{
                label.destroy()
                // onExpire?.();
            }
        });
    }
}
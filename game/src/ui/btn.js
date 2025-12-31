import gsap from "gsap";
import { k } from "../core/kaplay";
import * as Tone from "tone";

export function Btn({
    text = "Button",
    pos = k.vec2(0, 0),
    font = "Ajelins",
    textSize = 36,
    padding = k.vec2(24, 12),
    color = "#FFFFFF",
    z,
    onClick = () => { }
}) {

    // ==== SFX ====
    const btnSynth = new Tone.Synth(({
        oscillator: { type: "triangle" },
        envelope: {
            attack: 0.01,
            decay: 0.1,
            sustain: 0.2,
            release: 0.2
        }
    })).toDestination();
    let toneStarted = false;

    async function ensureToneStart() {
        if (!toneStarted) {
            await Tone.start();
            toneStarted = true;
        }
    }

    // ==== ROOT ====
    const root = k.add([
        k.pos(pos),
        k.anchor("center"),
        k.scale(1),
        z ? k.z(z) : k.z(10),
        "btn"
    ]);

    // ===== TEXT =====
    const label = root.add([
        k.text(text, {
            font,
            size: textSize
        }),
        k.anchor("center"),
        k.color(color)
    ]);

    // ==== BG ====
    const bg = root.add([
        k.sprite("btn"),
        k.anchor("center"),
        k.scale(2),
        k.area(),
        k.z(-1),
    ])


    // ==== AUTO SIZE =====
    const textWidth = label.width;
    const textHeight = label.height;

    const finalWidth = textWidth + padding.x * 2;
    const finalHeight = textHeight + padding.y * 2;

    // BUTTON ANIMATIONS
    // Hover
    bg.onHover(() => {
        gsap.to(root.scale, {
            x: 1.08,
            y: 1.08,
            duration: 0.2,
            ease: "power2.out"
        })
    });

    bg.onHoverEnd(() => {
        gsap.to(root.scale, {
            x: 1,
            y: 1,
            duration: 0.2,
            ease: "power2.out",
        });
    });

    // Click
    bg.onClick(async () => {
        await ensureToneStart();

        btnSynth.triggerAttackRelease("C5", "16n");
        gsap.fromTo(
            root.scale,
            { x: 0.95, y: 0.95 },
            {
                x: 1,
                y: 1,
                duration: 0.25,
                ease: "back.out(2)",
            }
        );
        onClick();
    });

    return {
        root,
        bg,
        label,
        setText(newText) {
            label.text = newText;

            // recompute size
            const w = label.width + padding.x * 2;
            const h = label.height + padding.y * 2;

            bg.scale.x = w / 96;
            bg.scale.y = h / 32;
        },
    };
}
import gsap from "gsap";
import { k } from "../core/kaplay";
import { theme } from "../core/kaplay/theme";

export function particleTouch(x, y) {
    const particleCount = 12;

    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 40;

        const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));

        const p = k.add([
            k.pos(x, y),
            k.text(randomLetter, {
                font: "Kimbab",
                size: 16
            }),
            k.opacity(1),
            k.color(theme.lightPink),
            k.z(999),
            k.anchor("center")
        ]);

        const tl = gsap.timeline();

        // Radial burst
        tl.to(p.pos, {
            x: x + Math.cos(angle) * distance,
            y: y + Math.sin(angle) * distance,
            duration: 0.25,
            ease: "power2.out",
        });

        // Gravity fall
        tl.to(p.pos, {
            x: "+=" + (Math.random() * 60 - 30),
            y: "+=" + (40 + Math.random() * 40),
            duration: 0.5,
            ease: "power1.in",
        });

        // Fade out & cleanup
        tl.to(p, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => p.destroy(),
        }, "-=0.15");
    }
}

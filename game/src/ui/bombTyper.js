import gsap from "gsap";
import { k } from "../core/kaplay";
import { particleTouch } from "../utils/particleTouch";
import { theme } from "../core/kaplay/theme";

function spawnCrossExplosion(pos) {
    const thickness = 14;
    const color = "#ffd1d1";

    const horiz = k.add([
        k.rect(k.width(), thickness),
        k.pos(pos.x, pos.y),
        k.anchor("center"),
        k.color(color),
        k.opacity(0.9),
        k.fixed(),
        k.z(999),
        k.scale(0, 1),
    ]);

    const vert = k.add([
        k.rect(thickness, k.height()),
        k.pos(pos.x, pos.y),
        k.anchor("center"),
        k.color(color),
        k.opacity(0.9),
        k.fixed(),
        k.z(999),
        k.scale(1, 0),
    ]);

    // Horizontal blast
    gsap.to(horiz.scale, {
        x: 1,
        duration: 0.18,
        ease: "power4.out",
    });

    gsap.to(horiz, {
        opacity: 0,
        duration: 0.22,
        delay: 0.05,
        onComplete: () => horiz.destroy(),
    });

    // Vertical blast
    gsap.to(vert.scale, {
        y: 1,
        duration: 0.18,
        delay: 0.04,
        ease: "power4.out",
    });

    gsap.to(vert, {
        opacity: 0,
        duration: 0.22,
        delay: 0.09,
        onComplete: () => vert.destroy(),
    });
}


export function bombTyper(onResolve, onExplode) {
    const value = Math.ceil(k.rand(1, 9)); // 1–9

    const x = k.rand(120, k.width() - 120);
    const y = k.rand(160, k.height() - 220);

    const bomb = k.add([
        k.text(String(value), {
            font: "Ajelins",
            size: 64,
        }),
        k.pos(x, y),
        k.anchor("center"),
        k.color(theme.red),
        k.z(1000),
        k.opacity(0),
        k.fixed(),
    ]);

    // Entrance
    gsap.to(bomb, { opacity: 1, duration: 0.25 });
    gsap.from(bomb.pos, {
        y: y + 25,
        duration: 0.45,
        ease: "power2.out",
    });

    // Hover
    gsap.to(bomb.pos, {
        y: y - 14,
        duration: 1.1,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
    });

    // Register globally
    bomb.__bombValue = value;

    // Timeout
    const time = k.choose([2, 3]);
    const timeout = k.wait(time, explode);

    function resolve() {
        timeout.cancel();
        gsap.to(bomb, {
            opacity: 0,
            scale: 0.5,
            duration: 0.2,
            onComplete: () => bomb.destroy(),
        });
        onResolve(value);


        particleTouch(x, y)
    }

    function explode() {
        spawnCrossExplosion(bomb.pos);

        gsap.to(bomb, {
            scale: 1.6,
            opacity: 0,
            duration: 0.25,
            ease: "power3.out",
            onComplete: () => bomb.destroy(),
        });
        onExplode(value);
        k.shake(value);
        k.play("explode", {
            seek: 0.2,
            volume: 1.5
        });
    }

    return {
        value,
        resolve,
        destroy: explode,
    };
};
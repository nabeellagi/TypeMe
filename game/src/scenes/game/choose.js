import gsap from "gsap";
import { k } from "../../core/kaplay";

export function registerChoose() {
    k.scene("choose", () => {
        // Set background
        k.setBackground(k.rgb(0, 0, 0));

        // ==== SPRITE ====
        // Sprite state
        let spriteProp = {
            facing: "front",
            moving: false,
            speed: 75,
            front: ["front0", "front1"],
            back: ["back0", "back1"],
        };
        // Animation prop
        let anim = {
            timer: 0,
            frame: 0,       // 0 or 1
            speed: 0.18     // seconds per frame
        };

        // Sprite
        const cotton = k.add([
            k.sprite("front0"),
            k.scale(0.085),
            k.pos(k.width() / 2, k.height() / 2),
            k.anchor("center")
        ]);

        // ===== UPDATE =====
        k.onUpdate(() => {

            // ===== SPRITE MOVE =====
            let dir = k.vec2(0, 0);
            if (k.isKeyDown("left")) dir.x -= 1;
            if (k.isKeyDown("right")) dir.x += 1;
            if (k.isKeyDown("up")) dir.y -= 1;
            if (k.isKeyDown("down")) dir.y += 1;
            // NORMALIZE MOVE
            if (dir.len() > 0) {
                dir = dir.unit();
                spriteProp.moving = true;
            } else {
                spriteProp.moving = false;
            };
            // Apply movement
            cotton.pos = cotton.pos.add(
                dir.scale(spriteProp.speed * k.dt())
            );

            if (dir.y < 0) spriteProp.facing = "back";
            if (dir.y > 0) spriteProp.facing = "front";
            if (dir.x !== 0) {
                cotton.flipX = dir.x < 0;
            }
            // Animate sprite
            if (spriteProp.moving) {
                anim.timer += k.dt();

                if (anim.timer >= anim.speed) {
                    anim.timer = 0;
                    anim.frame = (anim.frame + 1) % spriteProp[spriteProp.facing].length;
                }
            } else {
                anim.timer = 0;
                anim.frame = 0;
            }

            // Sprite change
            const spriteName = spriteProp[spriteProp.facing][anim.frame];

            if (cotton.sprite !== spriteName) {
                cotton.use(k.sprite(spriteName));

                // re-apply presentation state
                if (dir.x !== 0) {
                    cotton.flipX = dir.x < 0;
                }
            }
        })
    });
}

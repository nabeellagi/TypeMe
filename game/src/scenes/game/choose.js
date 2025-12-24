import gsap from "gsap";
import { k } from "../../core/kaplay";
import { particleTouch } from "../../utils/particleTouch";
import { randomGen } from "../../ui/randomGen";
// import { machineIdle } from "../../utils/machineBounce";

export function registerChoose() {
    k.scene("choose", () => {
        // DEBUG MODE
        // k.debug.inspect = true

        // ==== RESULT =====
        let machineResult = {
            normal: {
                word: null,
                type: null,
                completed: false,
                attempts: 0,
                locked: false,
            },
            reverse: {
                word: null,
                type: null,
                completed: false,
                attempts: 0,
                locked: false,
            }
        };
        let isSpinning = false;

        // ==== SPRITE LAYERS ====
        const layers = {
            cotton: 10,
            boxes: 9
        }
        // Set tiled floor background
        const floorWidth = 64;
        const floorHeight = 64;

        const cols = Math.ceil(k.width() / floorWidth);
        const rows = Math.ceil((k.height()+5) / floorHeight);
        const totalTiles = cols * rows;

        for (let index = 0; index < totalTiles; index++) {
            const i = index % cols;
            const j = Math.floor(index / cols) - 1;
            k.add([
                k.sprite("floor1"),
                k.pos(i * floorWidth, j * floorHeight),
                k.anchor("topleft"),
                k.scale(1),
                k.z(-10),
            ]);
        };
        k.setBackground("#03021e");

        // Dark overlay
        const overlay = k.add([
            k.rect(k.width(), k.height()),
            k.pos(0, 0),
            k.opacity(0.6),
            k.color("#100738"),
            k.anchor("topleft"),
            k.fixed(),
        ]);

        // ==== SPRITE ====
        // Sprite state
        let spriteProp = {
            facing: "front",
            moving: false,
            speed: 100,
            front: ["front0", "front1", "front2"],
            back: ["back0", "back1", "back2"],
        };
        // Animation prop
        let anim = {
            timer: 0,
            frame: 0,       // 0 or 1
            speed: 0.08    // seconds per frame
        };

        const higlight = k.add([
            k.circle(58),
            k.anchor("center"),
            k.pos(k.width() / 2, k.height() / 2),
            k.scale(1),
            k.opacity(0.6),
            k.color("#93f5ec"),
        ]);

        // Sprite
        const cotton = k.add([
            k.pos(k.width() / 2, k.height() / 2),
            k.anchor("bot"),
            k.area({
                shape: new k.Rect(k.vec2(0, 0), 32, 100),
            }),
            k.body({ gravityScale: 0 }),
            k.z(layers.cotton),
            "player",
        ]);
        const cottonSprite = cotton.add([
            k.sprite("front0"),
            k.scale(0.085),
            k.anchor("bot"),
        ]);


        // ==== BOX MACHINE ====
        let nearbyMachine = null;
        // Box machines parents
        const boxMachine = {
            normal: k.add([
                k.pos(k.width() / 2 - 200, 150),
                k.anchor("center"),
                k.area({
                    shape: new k.Rect(k.vec2(0, -20), 200, 170),
                }),
                k.body({ isStatic: true }),
                k.z(layers.boxes),
                "normalMachine",
            ]),
            reverse: k.add([
                k.pos(k.width() / 2 + 200, 150),
                k.anchor("center"),
                k.area({
                    shape: new k.Rect(k.vec2(0, -20), 200, 170),
                }),
                k.body({ isStatic: true }),
                k.z(layers.boxes),
                "reverseMachine",
            ])
        }
        // Box machine sprites
        const boxMachineSprite = {
            normal: boxMachine.normal.add([
                k.sprite("box1"),
                k.anchor("center"),
                k.scale(2.8),
            ]),
            reverse: boxMachine.reverse.add([
                k.sprite("box2"),
                k.anchor("center"),
                k.scale(2.8),
            ])
        };
        // Box Highlight
        const boxHighlight = {
            normal: boxMachine.normal.add([
                k.circle(100),
                k.anchor("center"),
                k.pos(0, -25),
                k.scale(1),
                k.opacity(0.4),
                k.z(-1),
            ]),
            reverse: boxMachine.reverse.add([
                k.circle(100),
                k.anchor("center"),
                k.pos(0, -25),
                k.scale(1),
                k.opacity(0.4),
                k.z(-1),
            ]),
        };
        // Box Machines Config
        boxMachine.normal.machineData = {
            id: "normal",
            bg: "#4a5be6",
            lengthRange: [4, 8],
            types: ["adjective", "noun", "verb"],
        };
        boxMachine.reverse.machineData = {
            id: "reverse",
            bg: "#df2e05",
            lengthRange: [4, 8],
            types: ["adjective", "noun", "verb"],
        };

        // ===== UPDATE =====
        k.onUpdate(() => {
            const dt = k.dt();

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
            cotton.move(dir.scale(spriteProp.speed));

            if (dir.y < 0) spriteProp.facing = "back";
            if (dir.y > 0) spriteProp.facing = "front";

            // Animate sprite
            if (spriteProp.moving) {
                anim.timer += dt;

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
                cottonSprite.use(k.sprite(spriteName));

                // re-apply presentation state
                if (dir.x !== 0) {
                    cottonSprite.flipX = dir.x >= 0;
                }
            }

            // Highlight follow
            const highlightTargetPos = cotton.pos.add(0, -10);
            const highlightSpeed = 2;
            higlight.pos = higlight.pos.add(
                highlightTargetPos.sub(higlight.pos).scale(highlightSpeed * dt)
            );

            // Set world bounds
            cotton.pos.x = k.clamp(cotton.pos.x, 0, k.width());
            cotton.pos.y = k.clamp(cotton.pos.y, 130, k.height());

        })

        // ===== INTERACTION =====
        k.onMousePress(() => {
            const mousePos = k.mousePos();
            particleTouch(mousePos.x, mousePos.y);
        });

        // Detect player machine proximity
        cotton.onCollide("normalMachine", (m) => {
            nearbyMachine = m;
            console.log(m)
        });
        cotton.onCollideEnd("normalMachine", (m) => {
            if (nearbyMachine?.is("normalMachine")) {
                nearbyMachine = null;
            }
        });

        cotton.onCollide("reverseMachine", (m) => {
            nearbyMachine = m;
        });
        cotton.onCollideEnd("reverseMachine", (m) => {
            if (nearbyMachine?.is("reverseMachine")) {
                nearbyMachine = null;
            }
        });

        // Interact Z
        k.onKeyPress("z", async () => {
            if (!nearbyMachine) return;
            if (isSpinning) return;

            const id = nearbyMachine.machineData.id;
            const state = machineResult[id];

            if (state.locked) {
                k.shake(5);
                return;
            }

            if (state.attempts >= 3) {
                state.locked = true;
                k.shake(5);
                return;
            }

            isSpinning = true;

            const result = await randomGen({
                machine: nearbyMachine.machineData,
                attempts: state.attempts,
            });

            isSpinning = false;

            if (!result) return;

            state.word = result.wordLength;
            state.type = result.type;
            state.completed = true;
            state.attempts++;

            if (state.attempts >= 3) {
                state.locked = true;
            }
        });

    });
}
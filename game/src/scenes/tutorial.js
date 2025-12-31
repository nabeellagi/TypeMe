import gsap from "gsap";
import { k } from "../core/kaplay";
import { Btn } from "../ui/btn";
import { theme } from "../core/kaplay/theme";

function moveSlide(direction, length, currentIndex) {
    if (direction === "right") {
        return (currentIndex + 1) % length;
    }

    if (direction === "left") {
        return (currentIndex - 1 + length) % length;
    }

    return currentIndex;
}

const tutoriel = [
    {
        title: "How to start?",
        content: `
You will be met by Cotton, which she also appeared in the menu screen.
1. You will see two machines: Blue and Red. Walk near a machine and press the 'Z' key to interact.
2. Type SPIN when prompted. Each machine randomly generates a challenge based on word length and word type (noun, verb, or adjective).
3. You have 3 attempts per machine. When you are satisfied with the outcome, press the Start button below.
`
    },
    {
        title: "What are the phases? (1st & 2nd)",
        content: `
1. The game begins with two typing phases. In both phases, you will receive scattered letters as hint and input boxes. Some letters are already filled.
2. Watch both your word timer and phase timer carefully.
In Phase 1, type normally from left to right.
In Phase 2, type the word in reverse order, from right to left (example: HOW becomes W O H).

No need to click the input box! ITS AUTOMATIC :)`
    },
    {
        title: "Bombs and Bonus Clickers",
        content: `
During typing, red floating numbers may appear. These are Bomb Typers.
Press the matching number key quickly to defuse them — they do not count as typos!
If number 7 appear, type 7 as quickly as possible. If number 6 and 7 appear, type 6 and 7 in any order.

Successfully defusing bombs increases your score! While failing will reduce it.

Getting two correct words in a row may spawn Bonus Clickers: cyan numbers you can click for extra points. Bonus clickers are optional, prioritize typing if needed.
Clicking +2, will add 2 more score. Beware of minus clickers, they will decrease your score!
`
    },
    {
        title: "Clicker Phase (3rd phase)",
        content:
            `All typo words you made earlier are collected and used in Phase 3.
This phase lasts only 55 seconds and turns into a fast-paced clicker game.
Bomb words will spawn on screen, click them repeatedly before they explode!
Explosions reduce your score. The more typos you made earlier, the more damage each explosion deals.

The goal is to defend your score.
Clicking on Cotton will give you +2 score, optional.`

    }
];


export function registerTutorial() {
    k.scene("tutorial", () => {
        let index = 0;

        // === BACKGROUND ===
        const bg = k.add([
            k.sprite("bg1"),
            k.scale(0.65),
            k.fixed(),
        ]);
        // ==== BOX ====
        const box = k.add([
            k.rect(900, 600, {
                radius: 22
            }),
            k.pos(k.width() / 2, k.height() / 2),
            k.anchor("center"),
            k.color("#4a5be6"),
            k.scale(0.8),
            k.opacity(0)
        ]);
        gsap.timeline()
            .to(box.scale, {
                x: 1,
                y: 1,
                duration: 0.35,
                ease: "back.out"
            })
            .to(box, {
                opacity: 1,
                duration: 0.5
            }, "<")

        const title = box.add([
            k.text(tutoriel[index].title, {
                font: "Kimbab",
                size: 40,
                letterSpacing: 1.2
            }),
            k.pos(0, -box.height / 2 + 50),
            k.anchor("center")
        ]);
        const content = box.add([
            k.text(tutoriel[index].content, {
                font: "Ajelins",
                size: 20,
                width: box.width - 80,
                lineSpacing: 10,
                letterSpacing: 1.5
            }),
            k.pos(-box.width / 2 + 40, -box.height / 2 + 120),
            k.anchor("topleft")
        ]);
        k.add([
            k.text("Press right and left key to read the next part", {
                font: "Kaph",
                size: 22
            }),
            k.pos(k.width() / 2, 32),
            k.anchor("top")
        ]);
        const returnBtn = Btn({
            text: "Back",
            pos: k.vec2(120, k.height() - 90),
            color: theme.lightPink,
            onClick: () => {
                k.go("menu")
            }
        });

        // Move with keys
        k.onKeyPress("right", () => {
            index = moveSlide("right", tutoriel.length, index);

            title.text = tutoriel[index].title;
            content.text = tutoriel[index].content ?? "";
        });

        k.onKeyPress("left", () => {
            index = moveSlide("left", tutoriel.length, index);

            title.text = tutoriel[index].title;
            content.text = tutoriel[index].content ?? "";
        });
    });
}
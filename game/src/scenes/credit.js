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
        title: "Tools Used",
        content: `
Made with :
Kaplay JS (also GSAP)
Resprite and Ibis Paint
Some Python scripts for word set
`
    },
    {
        title: "Musics and SFX",
        content: `
1. JDSherbert on itch.io
2. Towball on itch.io
3. Additional SFX from Pixabay
`
    },
];


export function registerCredit() {
    k.scene("credit", () => {
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
                size: 28,
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
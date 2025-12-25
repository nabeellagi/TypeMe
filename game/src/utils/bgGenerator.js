import { k } from "../core/kaplay";

export function bgGenerator({
    floorWidth = 64,
    floorHeight = 64,
    add = 5,
    z = -10,
    sprite,
    scale=1
}) {
    const cols = Math.ceil((k.width() + add) / floorWidth);
    const rows = Math.ceil((k.height() + add) / floorHeight);

    const totalTiles = cols * rows;

    let floors = [];

    const root = k.add([
        k.z(z),
        k.pos(0, 0),
        k.anchor("topleft"),
    ]);

    for (let index = 0; index < totalTiles; index++) {
        const i = index % cols;
        const j = Math.floor(index / cols);

        const floorSprite = root.add([
            k.sprite(sprite),
            k.pos(i * floorWidth, j * floorHeight),
            k.anchor("topleft"),
            k.scale(scale),
            k.rotate(0)
        ]);

        floors.push(floorSprite);
    }

    return { element: floors, root };
}

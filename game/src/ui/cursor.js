import { k } from "../core/kaplay";

export function cursor({
    sprite = "cursor",
    scale = 1,
    speed = 450,
    z = 9999,
    followMouse = true,
    anchor = "center"
}){

    const cursor = k.add([
        k.sprite(sprite),
        k.scale(scale),
        k.anchor(anchor),
        k.fixed(),
        k.z(z),
        k.fakeMouse({
            followMouse:true
        })
    ]);
}
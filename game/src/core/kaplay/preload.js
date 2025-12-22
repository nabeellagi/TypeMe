import { k } from ".";

export function preloadAll() {
    // FONT
    k.loadFont("Kimbab", "fonts/Kimbab.ttf");
    k.loadFont("Ajelins", "fonts/Ajelins.ttf");

    // SPRITE

    // ==== Cotton Sprites ====
    k.loadSprite("excited", "sprites/excited.png");
    k.loadSprite("yes", "sprites/yes.png");

    k.loadSprite("front0", "sprites/front0.png");
    k.loadSprite("front1", "sprites/front1.png");
    k.loadSprite("back0", "sprites/back0.png");
    k.loadSprite("back1", "sprites/back1.png");

    k.loadSprite("bg1", "bg/menu.png");

    k.loadSprite("btn", "ui/btn.png");

    k.loadSprite("logo", "logo.png");


    // SFX

    // MUSIC

}
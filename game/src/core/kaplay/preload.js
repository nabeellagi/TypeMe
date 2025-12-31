import { k } from ".";

export function preloadAll() {
    // FONT
    k.loadFont("Kimbab", "fonts/Kimbab.ttf");
    k.loadFont("Ajelins", "fonts/Ajelins.ttf");
    k.loadFont("Kaph", "fonts/Kaph.ttf");
    k.loadFont("Sporty", "fonts/Sporty.otf");


    // SPRITE

    // ==== Cotton Sprites ====
    k.loadSprite("excited", "sprites/excited.png");
    k.loadSprite("yes", "sprites/yes.png");

    k.loadSprite("front0", "sprites/front0.png");
    k.loadSprite("front1", "sprites/front1.png");
    k.loadSprite("front2", "sprites/front2.png");

    k.loadSprite("back0", "sprites/back0.png");
    k.loadSprite("back1", "sprites/back1.png");
    k.loadSprite("back2", "sprites/back2.png");

    k.loadSprite("fear", "sprites/fear.png");

    k.loadSprite("smile", "sprites/smile.png");
    k.loadSprite("gasp", "sprites/gasp.png");
    k.loadSprite("annoyed", "sprites/annoyed.png");
    k.loadSprite("serious", "sprites/serious.png");
    k.loadSprite("sweat", "sprites/sweat.png");
    k.loadSprite("hope", "sprites/hope.png");

    k.loadSprite("sitwait", "sprites/sitwait.png");
    k.loadSprite("sitshock", "sprites/sitshock.png");
    k.loadSprite("sitye", "sprites/sitye.png");

    k.loadSprite("bg1", "bg/menu.png");

    k.loadSprite("btn", "ui/btn.png");

    k.loadSprite("logo", "logo.png");

    k.loadSprite("floor1", "sprites/floor1.png");
    k.loadSprite("buns", "sprites/buns.png");

    k.loadSprite("box1", "sprites/box1.png");
    k.loadSprite("box2", "sprites/box2.png");


    // SFX
    k.loadSound("explode", "sfx/explode.mp3");
    k.loadSound("spin", "sfx/spin.mp3");
    k.loadSound("blink", "sfx/blink.mp3");
    k.loadSound("whistledown", "sfx/whistledown.mp3");
    k.loadSound("damage", "sfx/damage.mp3");
    k.loadSound("afterspin", "sfx/afterspin.mp3");

    // MUSIC
    k.loadSound("3am", "song/3am.ogg");
    k.loadSound("Midnight", "song/Midnight.ogg");
    k.loadSound("Glitch", "song/glitch.ogg");
    k.loadSound("Space", "song/16_bit_space.ogg");

}
import kaplay from "kaplay";
import { preloadAll } from "./preload";

// ===== INIT KAPLAY =====

export const k = kaplay({
    global: false,
    debug: true,
    crisp:true,
    pixelDensity:1,
    width:1366,
    height:768
});

// LOAD ALL ASSETS HERE
preloadAll();
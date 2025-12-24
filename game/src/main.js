import { k } from "./core/kaplay";
import { registerCredit } from "./scenes/credit";
import { registerChoose } from "./scenes/game/choose";
import { registerMenu } from "./scenes/menu";
import { registerTutorial } from "./scenes/tutorial";

registerMenu();
registerTutorial();
registerCredit();

// Game phase
registerChoose();

// k.go("menu");
k.go("choose")
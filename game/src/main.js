import { k } from "./core/kaplay";
import { registerCredit } from "./scenes/credit";
import { registerChoose } from "./scenes/game/choose";
import { registerClicker } from "./scenes/game/clicker";
import { regsiterTyping } from "./scenes/game/typing";
import { registerMenu } from "./scenes/menu";
import { registerTutorial } from "./scenes/tutorial";

registerMenu();
registerTutorial();
registerCredit();

// Game phase
registerChoose();
regsiterTyping();
registerClicker();

k.go("menu");
// k.go("choose")
k.go("typing");
// k.go("clicker");
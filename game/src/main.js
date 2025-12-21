import { k } from "./core/kaplay";
import { registerCredit } from "./scenes/credit";
import { registerGame } from "./scenes/game";
import { registerMenu } from "./scenes/menu";
import { registerTutorial } from "./scenes/tutorial";

registerMenu();
registerGame();
registerTutorial();
registerCredit();

k.go("menu");
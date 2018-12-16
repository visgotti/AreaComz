"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AREA_CONST = 'AREA';
/**
 * @param areaIndex - index of area in a game
 * @param gameId - unique identifier of the game id using the areas
 * @returns {string}
 */
function getAreaId(areaIndex, gameId) {
    return AREA_CONST + areaIndex + '_' + gameId;
}
exports.getAreaId = getAreaId;
;

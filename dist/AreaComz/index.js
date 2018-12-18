"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MESSAGE_CODE_LOOKUP = {
    CONNECT: 0,
    DISCONNECT: 1,
    DATA: 2,
};
exports.MESSAGE_CODES = {
    0: exports.MESSAGE_CODE_LOOKUP.CONNECT,
    1: exports.MESSAGE_CODE_LOOKUP.DISCONNECT,
    2: exports.MESSAGE_CODE_LOOKUP.DATA,
};
exports.LEAVE_AREA_CODE_LOOKUP = {
    CONNECTION_LOST: 0,
    ENTERED_NEW_AREA: 1,
};
exports.LEAVE_AREA_CODES = {
    0: exports.LEAVE_AREA_CODE_LOOKUP.CONNECTION_LOST,
    1: exports.LEAVE_AREA_CODE_LOOKUP.ENTERED_NEW_AREA,
};

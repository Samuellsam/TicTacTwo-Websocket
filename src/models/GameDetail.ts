import { Coordinate } from "./Coordinate";

export interface GameDetail {
    currentTurnUsername: string;
    currentTurnSymbol: string;
    isFinished: boolean;
    winner: string | undefined;
    data: UserGameData[]
    board: Coordinate[]
}

export interface UserGameData {
    username: string;
    symbol: string;
}
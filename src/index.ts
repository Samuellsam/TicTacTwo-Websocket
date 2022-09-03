import "dotenv/config";
import express, { Application } from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { RoomDetail } from "./models/RoomDetail";
import { RoomUserDetail } from "./models/RoomUserDetail";
import { JoinLeaveRequest } from "./entities/requests/JoinLeaveRequest";
import { GameDetail, UserGameData } from "./models/GameDetail";
import { Coordinate } from "./models/Coordinate";
import { TurnRequest } from "./entities/requests/TurnRequest";

const port = process.env.PORT; // Get port

const app: Application = express(); // Create express application

const server: http.Server = http.createServer(app);
const io: Server = new Server(server, {
  cors: {
    origin: 'https://tic-tac-toe-ws-client.herokuapp.com'
  }
});

const symbols = ['X', 'O']

const roomMembers: Map<string, RoomUserDetail> = new Map();
const roomGames: Map<string, GameDetail> = new Map();

const getRoomsDetail = (): RoomDetail[] => {
  const rooms: RoomDetail[] = [];

  io.sockets.adapter.rooms.forEach((values, key) => {
    rooms.push({
      roomId: key,
      users: {
        master: roomMembers.get(key)?.master ?? '',
        members: roomMembers.get(key)?.members ?? []
      }
    } as RoomDetail)
  })

  return rooms
}

const broadcastRoom = () => {
  io.emit('broadcast-rooms', getRoomsDetail())
}

const addRoomMembers = (payload: JoinLeaveRequest) => {
  const existingMaster: string | undefined = roomMembers.get(payload.roomCode)?.master;
  const existingMembers: string[] | undefined = roomMembers.get(payload.roomCode)?.members;
  const newMemberDetail: string = payload.username;

  if(existingMembers) {
    existingMembers.push(newMemberDetail)

    roomMembers.set(payload.roomCode, {
      master: existingMaster ?? '',
      members: existingMembers ?? []
    } as RoomUserDetail);
  }
  else {
    roomMembers.set(payload.roomCode, {
      master: existingMaster ?? '',
      members: [newMemberDetail]
    } as RoomUserDetail);
  }
}

const addRoomMaster = (payload: JoinLeaveRequest) => {
  const existingMembers: string[] | undefined = roomMembers.get(payload.roomCode)?.members;
  const newMasterDetail: string = payload.username;

  roomMembers.set(payload.roomCode, {
    master: newMasterDetail,
    members: existingMembers ?? []
  } as RoomUserDetail);
}

const removeRoomMembers = (payload: JoinLeaveRequest) => {
  const existingMaster: string | undefined = roomMembers.get(payload.roomCode)?.master;
  let existingMembers: string[] | undefined = roomMembers.get(payload.roomCode)?.members

  if(existingMembers) {
    existingMembers = existingMembers.filter(username => username != payload.username)
    roomMembers.set(payload.roomCode, {
      master: existingMaster ?? '',
      members: existingMembers
    });
  }
}

const removeRoomMaster = (payload: JoinLeaveRequest) => {
  let existingMembers: string[] | undefined = roomMembers.get(payload.roomCode)?.members

  roomMembers.set(payload.roomCode, {
    master: '',
    members: existingMembers ?? []
  })
}

const randomSymbols = () => {
  return symbols[Math.floor(Math.random() * 2)]
}

const getRoomMembers = (roomCode: string) => {
  let existingMembers: string[] | undefined = roomMembers.get(roomCode)?.members
  existingMembers?.push(roomMembers.get(roomCode)?.master ?? '')
  
  return existingMembers;
}

const randomUsername = (roomCode: string) => {
  const existingMembers = getRoomMembers(roomCode)

  if(existingMembers) {
    return existingMembers[Math.floor(Math.random() * 2)]
  }

  return ''
}

const getBoardDefaultValue = () => {
  const coordinates: Coordinate[] = [];
  for(let i = 0; i<3; i++) {
    for(let j = 0; j<3; j++) {
      coordinates.push({
        type: '_',
        x: i,
        y: j
      })
    }
  }

  return coordinates
}

const addGameRoom = (roomCode: string) => {
  const roomMembers = getRoomMembers(roomCode)

  const firstUserGameData: UserGameData = {
    username: randomUsername(roomCode),
    symbol: randomSymbols()
  }

  const secondUserGameData: UserGameData = {
    username: roomMembers?.find(member => member != firstUserGameData.username) ?? '',
    symbol: symbols.find(symbol => symbol != firstUserGameData.symbol) ?? ''
  }

  let detailGame: GameDetail = {
    currentTurnUsername: firstUserGameData.username,
    currentTurnSymbol: firstUserGameData.symbol,
    isFinished: false,
    winner: undefined,
    data: [
      firstUserGameData,
      secondUserGameData
    ],
    board: getBoardDefaultValue()
  }

  roomGames.set(roomCode, detailGame)

  return detailGame;
}

const getDetailGameByRoomCode = (roomCode: string) => {
  const detailGame: GameDetail | undefined = roomGames.get(roomCode)

  return detailGame
}

const getCoordinateFromCellBoard = (board: Coordinate[], x: number, y: number) => {
  board.forEach(b => {
    if((b.x == x) && (b.y == y)) console.log(b.type)
  })

  return ''
}

const checkWinner = (board: Coordinate[]): String => {
  const tbl: String[][] = [
    ['_', '_', '_'],
    ['_', '_', '_'],
    ['_', '_', '_']
  ]
  board.forEach(b => {
    tbl[b.x][b.y] = b.type
  })
  
  if(tbl[0][0] != '_' && (tbl[0][0] == tbl[0][1]) && (tbl[0][1] == tbl[0][2])) return tbl[0][2];
  if(tbl[1][0] != '_' && (tbl[1][0] == tbl[1][1]) && (tbl[1][1] == tbl[1][2])) return tbl[1][2];
  if(tbl[2][0] != '_' && (tbl[2][0] == tbl[2][1]) && (tbl[2][1] == tbl[2][2])) return tbl[2][2];
  
  if(tbl[0][0] != '_' && tbl[0][0] == tbl[1][0] && tbl[1][0] == tbl[2][0]) return tbl[2][0];
  if(tbl[0][1] != '_' && tbl[0][1] == tbl[1][1] && tbl[1][1] == tbl[2][1]) return tbl[2][1];
  if(tbl[0][2] != '_' && tbl[0][2] == tbl[1][2] && tbl[1][2] == tbl[2][2]) return tbl[2][2];

  if(tbl[0][0] != '_' && tbl[1][1] == tbl[0][1] && tbl[1][1] == tbl[2][2]) return tbl[2][2];
  if(tbl[0][2] != '_' && tbl[0][2] == tbl[1][1] && tbl[1][1] == tbl[2][0]) return tbl[2][0];

  return '_'
}

io.on("connection", async (socket) => {
  console.log("Connected " + socket.id);

  socket.on('join-member', async (payload: JoinLeaveRequest) => {
    await socket.join(payload.roomCode)

    addRoomMembers(payload)

    broadcastRoom()

    console.log('join')
    console.log(io.sockets.adapter.rooms)
  })

  socket.on('join-master', async (payload: JoinLeaveRequest) => {
    await socket.join(payload.roomCode)

    addRoomMaster(payload)

    broadcastRoom()

    console.log('join')
    console.log(io.sockets.adapter.rooms)
  })

  socket.on('leave-member', async (payload: JoinLeaveRequest) => {
    await socket.leave(payload.roomCode)

    removeRoomMembers(payload)

    broadcastRoom()

    console.log('leave')
    console.log(io.sockets.adapter.rooms)
  })

  socket.on('leave-master', async (payload: JoinLeaveRequest) => {
    await socket.leave(payload.roomCode)

    removeRoomMaster(payload)

    broadcastRoom()

    console.log('leave')
    console.log(io.sockets.adapter.rooms)
  })

  socket.on('refresh-room', () => {
    broadcastRoom()
  })

  socket.on('start-game', (roomCode: string) => {
    let detailGame: GameDetail = addGameRoom(roomCode)

    io.sockets.in(roomCode).emit('broadcast-game', detailGame)

    console.log(roomGames)
  })

  socket.on('leave-game', (roomCode: string) => {
    roomGames.delete(roomCode)

    io.sockets.in(roomCode).emit('broadcast-game', undefined)
  })

  socket.on('turn', (payload: TurnRequest) => {
    let detailGame: GameDetail | undefined = getDetailGameByRoomCode(payload.roomCode)

    if(detailGame) {
      const newBoard: Coordinate[] = detailGame.board.map(coordinate => {
        if(coordinate.x == payload.x && coordinate.y == payload.y) {
          return {
            type: detailGame?.currentTurnSymbol,
            x: payload.x,
            y: payload.y,
          } as Coordinate
        }

        return coordinate
      })

      const winnerSymbol = checkWinner(newBoard)

      let winner = ''
      if(winnerSymbol != '_') {
        winner = detailGame.data.find(gameData => gameData.symbol == winnerSymbol)?.username ?? '';
      }

      const newDetailGame: GameDetail = {
        board: newBoard,
        currentTurnSymbol: detailGame.currentTurnSymbol == symbols[0] ? symbols[1] : symbols[0],
        currentTurnUsername: detailGame.currentTurnUsername == detailGame.data[0].username ? detailGame.data[1].username : detailGame.data[0].username,
        isFinished: winner != '',
        winner: winner,
        data: detailGame.data
      }

      roomGames.set(payload.roomCode, newDetailGame)

      io.sockets.in(payload.roomCode).emit('broadcast-game', newDetailGame)
    }
  })
});

server.listen(port, () => {
  console.log(`Server running at port : ${port}`);
});

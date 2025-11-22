const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const uuid = require('uuid');
const DB = require('./database.js');
const http = require('http');
const { WebSocketServer } = require('ws');
const { setupWebSocket } = require('./webSocket.js');
const server = http.createServer(app);

const authCookieName = 'token';

const port = process.argv.length > 2 ? process.argv[2] : 3000;

let scores = {}

app.use((req,res,next)=> { // I use this function to check things within the backend // claude
  //console.log(req.url)
  //console.log(req.params)
  //console.log(req.body)
  next();
})

// JSON body parsing using built-in middleware
app.use(express.json());

// Use the cookie parser middleware for tracking authentication tokens
app.use(cookieParser());

// Serve up the front-end static content hosting
app.use(express.static('public'));

// Router for service endpoints
const apiRouter = express.Router();
app.use(`/api`, apiRouter);

// CreateAuth a new user
apiRouter.post('/auth/create', async (req, res) => {
  if (await findUser('email', req.body.email)) {
    res.status(409).send({ msg: 'Existing user' });
  } else {
    const user = await createUser(req.body.email, req.body.password);

    setAuthCookie(res, user.token);
    res.send({ email: user.email });
  }
});

// GetAuth login an existing user
apiRouter.post('/auth/login', async (req, res) => {
  const user = await findUser('email', req.body.email);
  if (user) {
    if (await bcrypt.compare(req.body.password, user.password)) {
      user.token = uuid.v4();
      await DB.updateUser(user);
      setAuthCookie(res, user.token);
      res.send({ email: user.email });
      return;
    }
  }
  res.status(401).send({ msg: 'Unauthorized' });
});

// DeleteAuth logout a user
apiRouter.delete('/auth/logout', async (req, res) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  if (user) {
    delete user.token;
    DB.updateUser(user);
  }
  res.clearCookie(authCookieName);
  res.status(204).end();
});

// Middleware to verify that the user is authorized to call an endpoint
const verifyAuth = async (req, res, next) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  if (user) {
    next();
  } else {
    res.status(401).send({ msg: 'Unauthorized' });
  }
};

// GetScores
apiRouter.get('/scores', verifyAuth, async (_req, res) => {
  const user = await findUser('token', _req.cookies[authCookieName]);
  const userScore = await DB.getScore(user.email);

  res.send({ playerScore : userScore.score });
});

// SubmitScore
apiRouter.post('/score', verifyAuth, async (req, res) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  const result = await updateScores(user.email, req.body.score);
  res.send(result);
});

// Helper function for scores
function updateScores(user, newScore) {
  scores[user] = newScore;
  const userScore = { 
    user: user,
    score: newScore,
  }
  DB.updateScoreDB(userScore);
  return scores;
}



// Default error handler
app.use(function (err, req, res, next) {
  res.status(500).send({ type: err.name, message: err.message });
});

// Return the application's default page if the path is unknown
app.use((_req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

// create user
async function createUser(email, password) {
  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    email: email,
    password: passwordHash,
    token: uuid.v4(),
    gameID: null,
    cat: null,
  };
  await DB.addUser(user);

  return user;
}

async function findUser(field, value) {
  if (!value) return null;

  if (field === 'token') {
    return DB.getUserByToken(value);
  }
  return DB.getUser(value);
}

// setAuthCookie in the HTTP response
function setAuthCookie(res, authToken) {
  res.cookie(authCookieName, authToken, {
    maxAge: 1000 * 60 * 60 * 24 * 365,
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
  });
}
//// -------------------------------- Game Endpoints --------------------------------////

// drawing a card for user in game
apiRouter.post('/play/draw', verifyAuth, async (req, res) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  const deck = await DB.getDeck(user.gameID);

  if (deck.length === 0) {
    return res.send({ Card: -1 });
  }
  const randomIndex = Math.floor(Math.random() * deck.length);
  const randomCard = deck[randomIndex];
  deck.splice(randomIndex, 1);

  await DB.updateDeck(user.gameID, deck);

  res.send({ Card: randomCard });
});

// checking length of avail Deck for game
apiRouter.get('/play/checkDeck', verifyAuth, async (req, res) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  const deck = await DB.getDeck(user.gameID); // Fixed!
  
  if (!deck || deck.length === 0) {
    res.send({ value: 0 });
  } else {
    res.send({ value: 1 });
  }
});

// create new game id and tie it to the user and also create a new deck tied to the game id
apiRouter.post('/play/new', verifyAuth, async(req,res) => {
  // also put game states associated with the currentGames id
  const user = await findUser('token', req.cookies[authCookieName]);

  if (!user) return res.status(401).send({mes: 'Unauthorized'});
  if (user.gameID) {
    return res.status(400).send({ msg: 'User already in a game'});
  }
  
  const gameID = uuid.v4();
  const gameDeck = [1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9];
  
  const game = {
    gameID: gameID,
    hasStarted: false, // change this someday
    whosTurn: 0,
    startingPlayer: Math.floor(Math.random() * 2),
    gamePhase: null, // modify this too with other endpoint calls?
    deck: gameDeck,
    players: { [user.email]: {email: user.email}},
  }

  await DB.addGame(game);

  user.gameID = gameID;
  await DB.updateUser(user);
  res.send({gameID});
})

// games over, delete it from being tied to the user and to currentGame
apiRouter.delete('/play/delete', verifyAuth, async (req, res) => {
  const user = await findUser('token', req.cookies[authCookieName]);

  if (!user || !user.gameID) {
    return res.status(400).send({ msg: 'No active game to delete' });
  }

  const gameID = req.body.gameID || user.gameID;
  console.log("Deleting game with ID:", gameID);
  
  const deleteResult = await DB.deleteGame(gameID);
  console.log("Database delete result:", deleteResult);
  
  // Remove the link from the user
  user.gameID = null;
  await DB.updateUser(user);

  res.send({ msg: 'Game deleted successfully' });
});

const io = setupWebSocket(server, DB);

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
const { MongoClient } = require('mongodb');
const config = require('./dbConfig.json');

const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const client = new MongoClient(url);
const db = client.db('startup');
const userCollection = db.collection('user');
const scoreCollection = db.collection('score');
const currentGamesCollection = db.collection('currentGames');
const waitlistCollection = db.collection('waitlist');

// Test connection
(async function testConnection() {
  try {
    await db.command({ ping: 1 });
    console.log(`Connected to database`);
  } catch (ex) {
    console.log(`Unable to connect to database with ${url} because ${ex.message}`);
    process.exit(1);
  }
})();

// ===== USER FUNCTIONS =====

function getUser(email) {
  return userCollection.findOne({ email: email });
}

function getUserByToken(token) {
  return userCollection.findOne({ token: token });
}

async function addUser(user) {
  await userCollection.insertOne(user);
}

async function updateUser(user) {
  await userCollection.updateOne({ email: user.email }, { $set: user });
}

// ===== SCORE FUNCTIONS =====

async function updateScoreDB(score) {
  await scoreCollection.updateOne({ user: score.user }, { $set: score }, { upsert: true });
}

async function getScore(user) {
  return scoreCollection.findOne({ user: user });
}

// ===== GAME FUNCTIONS =====

async function addGame(game) {
  return currentGamesCollection.insertOne(game);
}

async function getGame(gameID) {
  return currentGamesCollection.findOne({ gameID: gameID });
}

async function deleteGame(gameID) {
  const result = await currentGamesCollection.deleteOne({ gameID: gameID });
  return result;
}

async function getDeck(gameID) {
  const game = await currentGamesCollection.findOne({ gameID: gameID });
  return game ? game.deck : [];
}

async function updateDeck(gameID, newDeck) {
  await currentGamesCollection.updateOne(
    { gameID: gameID },
    { $set: { deck: newDeck } }
  );
}

// Update any field in a game (flexible helper)
async function updateGame(gameID, updates) {
  await currentGamesCollection.updateOne(
    { gameID: gameID },
    { $set: updates }
  );
}

// ===== WAITLIST FUNCTIONS =====

async function addToWaitlist(user) {
  await waitlistCollection.insertOne({
    user: user,
    joinedAt: new Date()
  });
}

async function getFirstInWaitlist() {
  return waitlistCollection.findOneAndDelete(
    {},
    { sort: { _id: 1 } }
  );
}

async function removeFromWaitlist(userEmail) {
  await waitlistCollection.deleteOne({ 'user.email': userEmail });
}

// ===== EXPORTS =====

module.exports = {
  // User
  getUser,
  getUserByToken,
  addUser,
  updateUser,
  // Score
  updateScoreDB,
  getScore,
  // Game
  addGame,
  getGame,
  deleteGame,
  getDeck,
  updateDeck,
  updateGame,
  // Waitlist
  addToWaitlist,
  getFirstInWaitlist,
  removeFromWaitlist,
};
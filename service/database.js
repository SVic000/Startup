const { MongoClient } = require('mongodb');
const config = require('./dbConfig.json');

const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const client = new MongoClient(url);
const db = client.db('startup');
const userCollection = db.collection('user');
const scoreCollection = db.collection('score');
const currentGamesCollection = db.collection('currentGames');

// This will asynchronously test the connection and exit the process if it fails
(async function testConnection() {
  try {
    await db.command({ ping: 1 });
    console.log(`Connect to database`);
  } catch (ex) {
    console.log(`Unable to connect to database with ${url} because ${ex.message}`);
    process.exit(1);
  }
})();

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

async function updateScoreDB(score) {
  await scoreCollection.updateOne( { user: score.user }, { $set: score}, { upsert: true } );
}

async function getScore(user) {
  return scoreCollection.findOne( { user : user} );
}

async function addGame(game) {
  return currentGamesCollection.insertOne(game);
}

async function deleteGame(gameID) {

  const result = await currentGamesCollection.deleteOne({ gameID: gameID });
  return result;
}

async function getDeck(gameID) {
  findgame = await currentGamesCollection.findOne( { gameID : gameID });
  return findgame.deck;
}
async function updateDeck(gameID, newDeck) {
  await currentGamesCollection.updateOne (
    { gameID: gameID}, 
    {$set: {deck: newDeck}}
  )
}
module.exports = {
  getUser,
  getUserByToken,
  addUser,
  updateUser,
  updateScoreDB,
  addGame,
  getDeck,
  deleteGame,
  getScore,
  updateDeck,
};

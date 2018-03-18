let mongodb = require('mongodb');
let ObjectId = require('mongodb').ObjectID;

let user = 'tim';
let password = 'timtim';
let uri = 'mongodb://' + user + ':' + password + '@ds261128.mlab.com:61128/pixel_legions';

function insertPlayer(playerObject, callback) {

	mongodb.MongoClient.connect(uri, function(err, db) {
		db.db('pixel_legions').collection('players').insert(playerObject, function(err, player) {
			if (callback) {
				callback(player);
			}
		});

	});

}

function getPlayerById(playerId, callback) {

	mongodb.MongoClient.connect(uri, function(err, db) {

		db.db('pixel_legions').collection('players').findOne({_id: ObjectId(playerId)}, function(err, player) {
			if (callback) {
				callback(player);
			}
		});

	});

}

function getPlayerByName(playerName, callback) {

	mongodb.MongoClient.connect(uri, function(err, db) {

		db.db('pixel_legions').collection('players').findOne({name: playerName}, function(err, player) {
			if (callback) {
				callback(player);
			}
		});

	});

}

function getAllPlayers() {

	mongodb.MongoClient.connect(uri, function(err, db) {

		db.db('pixel_legions').collection('players').find().forEach(function(doc) {
			console.log(doc);
		});

	});

}

function removeAllPlayers() {

	mongodb.MongoClient.connect(uri, function(err, db) {

		db.db('pixel_legions').collection('players').remove({});

	});

}

function updatePlayer(playerId, updatedObject, callback) {

	mongodb.MongoClient.connect(uri, function(err, db) {

		db.db('pixel_legions').collection('players').update({_id: ObjectId(playerId)}, {$set: updatedObject}, function(err, player) {
			if (callback) {
				callback(player);
			}
		});

	});

}

function insertRoom(roomObject, callback) {

	mongodb.MongoClient.connect(uri, function(err, db) {

		db.db('pixel_legions').collection('rooms').insert(roomObject, function(err, room) {
			if (callback) {
				callback(room);
			}
		});

	});

}

function getRoom(roomId, callback) {

	mongodb.MongoClient.connect(uri, function(err, db) {

		db.db('pixel_legions').collection('rooms').findOne({id: roomId}, function(err, room) {
			if (callback) {
				callback(room);
			}
		});

	});

}

function getLeaderboard(callback) {

	mongodb.MongoClient.connect(uri, function(err, db) {

		db.db('pixel_legions').collection('players').find().sort({rating: -1}).toArray(function(err, leaderboard) {
			if (callback) {
				callback(leaderboard);
			}
		});

	});

}

module.exports = {
	insertPlayer: insertPlayer,
	getPlayerById: getPlayerById,
	getPlayerByName: getPlayerByName,
	getAllPlayers: getAllPlayers,
	removeAllPlayers: removeAllPlayers,
	updatePlayer: updatePlayer,
	insertRoom: insertRoom,
	getRoom: getRoom,
	getLeaderboard: getLeaderboard
}
let mongodb = require('mongodb');
let ObjectId = require('mongodb').ObjectID;

let user = 'tim';
let password = 'timtim';
let uri = 'mongodb://' + user + ':' + password + '@ds261128.mlab.com:61128/pixel_legions';

function insertPlayer(playerObject, callback) {

	mongodb.MongoClient.connect(uri, function(err, db) {
		db.db('pixel_legions').collection('players').insert(playerObject, function(err, player) {
			callback(player);
		});

	});

}

function getPlayerById(playerId, callback) {

	mongodb.MongoClient.connect(uri, function(err, db) {

		db.db('pixel_legions').collection('players').findOne({_id: ObjectId(playerId)}, function(err, player) {
			callback(player);
		});

	});

}

function getPlayerByName(playerName, callback) {

	mongodb.MongoClient.connect(uri, function(err, db) {

		db.db('pixel_legions').collection('players').findOne({name: playerName}, function(err, player) {
			callback(player);
		});

	});

}

module.exports = {
	insertPlayer: insertPlayer,
	getPlayerById: getPlayerById,
	getPlayerByName: getPlayerByName
}
module.exports.MAX_LEGIONS = 10;

module.exports.STARTING_RATING = 1500;

module.exports.GAME_PLAYERS_NUM = 4;
module.exports.WAIT_TIME_BEFORE_AI_FILL = 1 * 1000;

module.exports.PLAYFIELD_WIDTH = 1000;
module.exports.PLAYFIELD_HEIGHT = 550;

module.exports.KING_COUNT = 50;
module.exports.KING_WIDTH = 30;

module.exports.KING_PX_PER_FRAME = 0.7;

module.exports.INITIAL_LEGIONS_NUM = 2;
module.exports.LEGION_COUNT = 25;
module.exports.LEGION_COUNT_TO_WIDTH = 1.6;
module.exports.LEGION_MINIMAL_PX = 30;
module.exports.LEGION_OVER_BORDER = 0.2;

module.exports.PIXEL_SIZE_PX = 4;	// preferably even number
module.exports.PIXELS_NUM_MIN = 8;

module.exports.HULL_SPACE_PX = 10;

module.exports.AI_LOOP_INTERVAL = 2 * 1000;
module.exports.SPAWN_INTERVAL = 10 * 1000;
module.exports.SPAWN_ITERVAL_RANDOM_PART = 0.1;

module.exports.SPAWN_AREA_WIDTH = 200;

module.exports.BATTLE_COUNT_LOSE = 0.04;
module.exports.BATTLE_AMBUSH_COUNT_LOSE = 0.03;
module.exports.BATTLE_DISTANCE = 100;

module.exports.AI_ATTACK_LEGION_CHANCE = 0.2;

module.exports.RATING_K = 26;	// rating change per place

module.exports.COLORS = {
	blue: {
		normal: 'rgba(76, 103, 214, 1)',
		selected: 'rgba(122, 143, 214, 1)'
	},
	red: {
		normal: 'rgba(248, 6, 42, 1)',
		selected: 'rgba(254, 76, 112, 1)'
	},
	green: {
		normal: 'rgba(37, 177, 42, 1)',
		selected: 'rgba(87, 217, 82, 1)'
	},
	orange: {
		normal: 'rgba(240, 100, 23, 1)',
		selected: 'rgba(254, 140, 63, 1)'
	},
	purple: {
		normal: 'rgba(178, 50, 194, 1)',
		selected: 'rgba(218, 90, 234, 1)'
	},
	yellow: {
		normal: 'rgba(244, 198, 28, 1)',
		selected: 'rgba(254, 238, 68, 1)'
	}
};

module.exports.AI_OBJECTS = [
	{
		name: 'DeepBlue',
		aggressiveness: 0.40
	},
	{
		name: 'AlphaZero',
		aggressiveness: 0.75
	},
	{
		name: 'TARS',
		aggressiveness: 0.62
	},
	{
		name: 'R2D2',
		aggressiveness: 0.20
	},
	{
		name: 'Unity',
		aggressiveness: 0.30
	}
];
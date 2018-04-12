module.exports.MAX_LEGIONS = 10;

module.exports.STARTING_COINS = 1000;
module.exports.STARTING_RATING = 1500;
module.exports.RATING_K = 26;	// rating change per place

module.exports.GAME_PLAYERS_NUM = 4;
module.exports.PRIZES = [100, 60, 20, 0];

module.exports.WAIT_TIME_BEFORE_AI_FILL = 1 * 1000;

module.exports.PLAYFIELD_WIDTH = 1000;
module.exports.PLAYFIELD_HEIGHT = 550;

module.exports.KING_BASE_ATTACK = 0.04;
module.exports.KING_BASE_COUNT = 50;
module.exports.KING_WIDTH = 30;

module.exports.KING_PX_PER_FRAME = 0.7;

module.exports.INITIAL_LEGIONS_NUM = 2;
module.exports.LEGION_BASE_ATTACK = 0.04;
module.exports.LEGION_BASE_COUNT = 25;
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

module.exports.BATTLE_AMBUSH_COUNT_LOSE = 0.03;
module.exports.BATTLE_DISTANCE = 100;

module.exports.AI_ATTACK_LEGION_CHANCE = 0.2;

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

let ID_LEGION_SPEED = module.exports.ID_LEGION_SPEED = 'speed_legion';
let ID_KING_SPEED = module.exports.ID_KING_SPEED = 'speed_king';
let ID_LEGION_HP = module.exports.ID_LEGION_HP = 'hp_legion';
let ID_KING_HP = module.exports.ID_KING_HP = 'hp_king';
let ID_LEGION_ATTACK = module.exports.ID_LEGION_ATTACK = 'attack_legion';
let ID_KING_ATTACK = module.exports.ID_KING_ATTACK = 'attack_king';
let ID_LEGION_RANGE = module.exports.ID_LEGION_RANGE = 'range_legion';
let ID_KING_RANGE = module.exports.ID_KING_RANGE = 'range_king';
let ID_SPAWN_RATE = module.exports.ID_SPAWN_RATE = 'spawn_rate';
let ID_AMBUSH_DAMAGE = module.exports.ID_AMBUSH_DAMAGE = 'ambush_damage';
let ID_COIN_REVENUE = module.exports.ID_COIN_REVENUE = 'coin_revenue';

module.exports.UPGRADES_ARRAY = [
	{
		id: ID_LEGION_SPEED,
		name: 'Legion speed',
		icon: 'assets/speed_legion.svg',
		description: 'Increase speed of your legions by 1%.',
		cost: [300, 350, 400, 450, 500],
		upgradePerLevel: 0.01,
		available: true
	},
	{
		id: ID_KING_SPEED,
		name: 'King speed',
		icon: 'assets/speed_king.svg',
		description: 'Increase speed of your king by 1%.',
		cost: [200, 250, 300, 350, 400],
		upgradePerLevel: 0.01,
		available: true
	},
	{
		id: ID_LEGION_HP,
		name: 'Legion HP',
		icon: 'assets/hp_legion.svg',
		description: 'Increase hit points of your legions by 5%.',
		cost: [350, 400, 450, 500, 550],
		upgradePerLevel: 0.05,
		available: true
	},
	{
		id: ID_KING_HP,
		name: 'King HP',
		icon: 'assets/hp_king.svg',
		description: 'Increase hit points of your king by 5%.',
		cost: [500, 550, 600, 650, 700],
		upgradePerLevel: 0.05,
		available: true
	},
	{
		id: ID_LEGION_ATTACK,
		name: 'Legion attack',
		icon: 'assets/attack_legion.svg',
		description: 'Increase attack of your legion by 3%.',
		cost: [650, 700, 750, 800, 850],
		upgradePerLevel: 0.03,
		available: true
	},
	{
		id: ID_KING_ATTACK,
		name: 'King attack',
		icon: 'assets/attack_king.svg',
		description: 'Increase attack of your king by 3%.',
		cost: [550, 600, 650, 700, 750],
		upgradePerLevel: 0.03,
		available: true
	},
	{
		id: ID_LEGION_RANGE,
		name: 'Legion range',
		icon: 'assets/wax_badge.svg',
		description: 'Increase range of your legion by 2%.',
		cost: 'N/A',
		upgradePerLevel: 0.02,
		available: false
	},
	{
		id: ID_KING_RANGE,
		name: 'King range',
		icon: 'assets/wax_badge.svg',
		description: 'Increase range of your king by 2%.',
		cost: 'N/A',
		upgradePerLevel: 0.02,
		available: false
	},
	{
		id: ID_SPAWN_RATE,
		name: 'Spawn rate',
		icon: 'assets/wax_badge.svg',
		description: 'Not yet available.',
		cost: 'N/A',
		upgradePerLevel: 0.01,
		available: false
	},
	{
		id: ID_AMBUSH_DAMAGE,
		name: 'Ambush damage',
		icon: 'assets/wax_badge.svg',
		description: 'Not yet available.',
		cost: 'N/A',
		upgradePerLevel: 0.01,
		available: false
	},
	{
		id: ID_COIN_REVENUE,
		name: 'Coin revenue',
		icon: 'assets/wax_badge.svg',
		description: 'Not yet available.',
		cost: 'N/A',
		upgradePerLevel: 0.01,
		available: false
	}
];
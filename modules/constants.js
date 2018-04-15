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
		icon: '/assets/speed_legion.svg',
		description: 'Increase speed of your legions by 1%.',
		cost: [300, 350, 400, 450, 500],
		upgradePerLevel: 0.01,
		available: true
	},
	{
		id: ID_KING_SPEED,
		name: 'King speed',
		icon: '/assets/speed_king.svg',
		description: 'Increase speed of your king by 1%.',
		cost: [200, 250, 300, 350, 400],
		upgradePerLevel: 0.01,
		available: true
	},
	{
		id: ID_LEGION_HP,
		name: 'Legion HP',
		icon: '/assets/hp_legion.svg',
		description: 'Increase hit points of your legions by 5%.',
		cost: [350, 400, 450, 500, 550],
		upgradePerLevel: 0.05,
		available: true
	},
	{
		id: ID_KING_HP,
		name: 'King HP',
		icon: '/assets/hp_king.svg',
		description: 'Increase hit points of your king by 5%.',
		cost: [500, 550, 600, 650, 700],
		upgradePerLevel: 0.05,
		available: true
	},
	{
		id: ID_LEGION_ATTACK,
		name: 'Legion attack',
		icon: '/assets/attack_legion.svg',
		description: 'Increase attack of your legion by 3%.',
		cost: [650, 700, 750, 800, 850],
		upgradePerLevel: 0.03,
		available: true
	},
	{
		id: ID_KING_ATTACK,
		name: 'King attack',
		icon: '/assets/attack_king.svg',
		description: 'Increase attack of your king by 3%.',
		cost: [550, 600, 650, 700, 750],
		upgradePerLevel: 0.03,
		available: true
	},
	{
		id: ID_LEGION_RANGE,
		name: 'Legion range',
		icon: '/assets/wax_badge.svg',
		description: 'Increase range of your legion by 2%.',
		cost: 'N/A',
		upgradePerLevel: 0.02,
		available: false
	},
	{
		id: ID_KING_RANGE,
		name: 'King range',
		icon: '/assets/wax_badge.svg',
		description: 'Increase range of your king by 2%.',
		cost: 'N/A',
		upgradePerLevel: 0.02,
		available: false
	},
	{
		id: ID_SPAWN_RATE,
		name: 'Spawn rate',
		icon: '/assets/wax_badge.svg',
		description: 'Not yet available.',
		cost: 'N/A',
		upgradePerLevel: 0.01,
		available: false
	},
	{
		id: ID_AMBUSH_DAMAGE,
		name: 'Ambush damage',
		icon: '/assets/wax_badge.svg',
		description: 'Not yet available.',
		cost: 'N/A',
		upgradePerLevel: 0.01,
		available: false
	},
	{
		id: ID_COIN_REVENUE,
		name: 'Coin revenue',
		icon: '/assets/wax_badge.svg',
		description: 'Not yet available.',
		cost: 'N/A',
		upgradePerLevel: 0.01,
		available: false
	}
];

module.exports.ACHIEVEMENTS_ARRAY = [
	{
		id: 'first_game',
		icon: '/assets/first_game.svg',
		description: 'First game played'
	},
	{
		id: 'first_king_kill',
		icon: '/assets/king_kill.svg',
		description: 'First king kill'
	},
	{
		id: 'first_win',
		icon: '/assets/first_win.svg',
		description: 'First win'
	},
	{
		id: 'rating_over_1600',
		icon: '/assets/rating_over_1600.svg',
		description: 'Rating over 1600'
	}
];

module.exports.COUNTRIES = [
	{
		"code": "af",
		"name": "Afghanistan"
	},
	{
		"code": "ax",
		"name": "Aland Islands"
	},
	{
		"code": "al",
		"name": "Albania"
	},
	{
		"code": "dz",
		"name": "Algeria"
	},
	{
		"code": "as",
		"name": "American Samoa"
	},
	{
		"code": "ad",
		"name": "Andorra"
	},
	{
		"code": "ao",
		"name": "Angola"
	},
	{
		"code": "ai",
		"name": "Anguilla"
	},
	{
		"code": "aq",
		"name": "Antarctica"
	},
	{
		"code": "ag",
		"name": "Antigua And Barbuda"
	},
	{
		"code": "ar",
		"name": "Argentina"
	},
	{
		"code": "am",
		"name": "Armenia"
	},
	{
		"code": "aw",
		"name": "Aruba"
	},
	{
		"code": "au",
		"name": "Australia"
	},
	{
		"code": "at",
		"name": "Austria"
	},
	{
		"code": "az",
		"name": "Azerbaijan"
	},
	{
		"code": "bs",
		"name": "Bahamas"
	},
	{
		"code": "bh",
		"name": "Bahrain"
	},
	{
		"code": "bd",
		"name": "Bangladesh"
	},
	{
		"code": "bb",
		"name": "Barbados"
	},
	{
		"code": "by",
		"name": "Belarus"
	},
	{
		"code": "be",
		"name": "Belgium"
	},
	{
		"code": "bz",
		"name": "Belize"
	},
	{
		"code": "bj",
		"name": "Benin"
	},
	{
		"code": "bm",
		"name": "Bermuda"
	},
	{
		"code": "bt",
		"name": "Bhutan"
	},
	{
		"code": "bo",
		"name": "Bolivia"
	},
	{
		"code": "ba",
		"name": "Bosnia And Herzegovina"
	},
	{
		"code": "bw",
		"name": "Botswana"
	},
	{
		"code": "bv",
		"name": "Bouvet Island"
	},
	{
		"code": "br",
		"name": "Brazil"
	},
	{
		"code": "io",
		"name": "British Indian Ocean Territory"
	},
	{
		"code": "bn",
		"name": "Brunei Darussalam"
	},
	{
		"code": "bg",
		"name": "Bulgaria"
	},
	{
		"code": "bf",
		"name": "Burkina Faso"
	},
	{
		"code": "bi",
		"name": "Burundi"
	},
	{
		"code": "kh",
		"name": "Cambodia"
	},
	{
		"code": "cm",
		"name": "Cameroon"
	},
	{
		"code": "ca",
		"name": "Canada"
	},
	{
		"code": "cv",
		"name": "Cape Verde"
	},
	{
		"code": "ky",
		"name": "Cayman Islands"
	},
	{
		"code": "cf",
		"name": "Central African Republic"
	},
	{
		"code": "td",
		"name": "Chad"
	},
	{
		"code": "cl",
		"name": "Chile"
	},
	{
		"code": "cn",
		"name": "China"
	},
	{
		"code": "cx",
		"name": "Christmas Island"
	},
	{
		"code": "cc",
		"name": "Cocos (Keeling) Islands"
	},
	{
		"code": "co",
		"name": "Colombia"
	},
	{
		"code": "km",
		"name": "Comoros"
	},
	{
		"code": "cg",
		"name": "Congo"
	},
	{
		"code": "cd",
		"name": "Congo, Democratic Republic"
	},
	{
		"code": "ck",
		"name": "Cook Islands"
	},
	{
		"code": "cr",
		"name": "Costa Rica"
	},
	{
		"code": "ci",
		"name": "Cote D'Ivoire"
	},
	{
		"code": "hr",
		"name": "Croatia"
	},
	{
		"code": "cu",
		"name": "Cuba"
	},
	{
		"code": "cy",
		"name": "Cyprus"
	},
	{
		"code": "cz",
		"name": "Czech Republic"
	},
	{
		"code": "dk",
		"name": "Denmark"
	},
	{
		"code": "dj",
		"name": "Djibouti"
	},
	{
		"code": "dm",
		"name": "Dominica"
	},
	{
		"code": "do",
		"name": "Dominican Republic"
	},
	{
		"code": "ec",
		"name": "Ecuador"
	},
	{
		"code": "eg",
		"name": "Egypt"
	},
	{
		"code": "sv",
		"name": "El Salvador"
	},
	{
		"code": "gq",
		"name": "Equatorial Guinea"
	},
	{
		"code": "er",
		"name": "Eritrea"
	},
	{
		"code": "ee",
		"name": "Estonia"
	},
	{
		"code": "et",
		"name": "Ethiopia"
	},
	{
		"code": "fk",
		"name": "Falkland Islands (Malvinas)"
	},
	{
		"code": "fo",
		"name": "Faroe Islands"
	},
	{
		"code": "fj",
		"name": "Fiji"
	},
	{
		"code": "fi",
		"name": "Finland"
	},
	{
		"code": "fr",
		"name": "France"
	},
	{
		"code": "gf",
		"name": "French Guiana"
	},
	{
		"code": "pf",
		"name": "French Polynesia"
	},
	{
		"code": "tf",
		"name": "French Southern Territories"
	},
	{
		"code": "ga",
		"name": "Gabon"
	},
	{
		"code": "gm",
		"name": "Gambia"
	},
	{
		"code": "ge",
		"name": "Georgia"
	},
	{
		"code": "de",
		"name": "Germany"
	},
	{
		"code": "gh",
		"name": "Ghana"
	},
	{
		"code": "gi",
		"name": "Gibraltar"
	},
	{
		"code": "gr",
		"name": "Greece"
	},
	{
		"code": "gl",
		"name": "Greenland"
	},
	{
		"code": "gd",
		"name": "Grenada"
	},
	{
		"code": "gp",
		"name": "Guadeloupe"
	},
	{
		"code": "gu",
		"name": "Guam"
	},
	{
		"code": "gt",
		"name": "Guatemala"
	},
	{
		"code": "gg",
		"name": "Guernsey"
	},
	{
		"code": "gn",
		"name": "Guinea"
	},
	{
		"code": "gw",
		"name": "Guinea-Bissau"
	},
	{
		"code": "gy",
		"name": "Guyana"
	},
	{
		"code": "ht",
		"name": "Haiti"
	},
	{
		"code": "hm",
		"name": "Heard Island & Mcdonald Islands"
	},
	{
		"code": "va",
		"name": "Holy See (Vatican City State)"
	},
	{
		"code": "hn",
		"name": "Honduras"
	},
	{
		"code": "hk",
		"name": "Hong Kong"
	},
	{
		"code": "hu",
		"name": "Hungary"
	},
	{
		"code": "is",
		"name": "Iceland"
	},
	{
		"code": "in",
		"name": "India"
	},
	{
		"code": "id",
		"name": "Indonesia"
	},
	{
		"code": "ir",
		"name": "Iran, Islamic Republic Of"
	},
	{
		"code": "iq",
		"name": "Iraq"
	},
	{
		"code": "ie",
		"name": "Ireland"
	},
	{
		"code": "im",
		"name": "Isle Of Man"
	},
	{
		"code": "il",
		"name": "Israel"
	},
	{
		"code": "it",
		"name": "Italy"
	},
	{
		"code": "jm",
		"name": "Jamaica"
	},
	{
		"code": "jp",
		"name": "Japan"
	},
	{
		"code": "je",
		"name": "Jersey"
	},
	{
		"code": "jo",
		"name": "Jordan"
	},
	{
		"code": "kz",
		"name": "Kazakhstan"
	},
	{
		"code": "ke",
		"name": "Kenya"
	},
	{
		"code": "ki",
		"name": "Kiribati"
	},
	{
		"code": "kr",
		"name": "Korea"
	},
	{
		"code": "kw",
		"name": "Kuwait"
	},
	{
		"code": "kg",
		"name": "Kyrgyzstan"
	},
	{
		"code": "la",
		"name": "Lao People's Democratic Republic"
	},
	{
		"code": "lv",
		"name": "Latvia"
	},
	{
		"code": "lb",
		"name": "Lebanon"
	},
	{
		"code": "ls",
		"name": "Lesotho"
	},
	{
		"code": "lr",
		"name": "Liberia"
	},
	{
		"code": "ly",
		"name": "Libyan Arab Jamahiriya"
	},
	{
		"code": "li",
		"name": "Liechtenstein"
	},
	{
		"code": "lt",
		"name": "Lithuania"
	},
	{
		"code": "lu",
		"name": "Luxembourg"
	},
	{
		"code": "mo",
		"name": "Macao"
	},
	{
		"code": "mk",
		"name": "Macedonia"
	},
	{
		"code": "mg",
		"name": "Madagascar"
	},
	{
		"code": "mw",
		"name": "Malawi"
	},
	{
		"code": "my",
		"name": "Malaysia"
	},
	{
		"code": "mv",
		"name": "Maldives"
	},
	{
		"code": "ml",
		"name": "Mali"
	},
	{
		"code": "mt",
		"name": "Malta"
	},
	{
		"code": "mh",
		"name": "Marshall Islands"
	},
	{
		"code": "mq",
		"name": "Martinique"
	},
	{
		"code": "mr",
		"name": "Mauritania"
	},
	{
		"code": "mu",
		"name": "Mauritius"
	},
	{
		"code": "yt",
		"name": "Mayotte"
	},
	{
		"code": "mx",
		"name": "Mexico"
	},
	{
		"code": "fm",
		"name": "Micronesia, Federated States Of"
	},
	{
		"code": "md",
		"name": "Moldova"
	},
	{
		"code": "mc",
		"name": "Monaco"
	},
	{
		"code": "mn",
		"name": "Mongolia"
	},
	{
		"code": "me",
		"name": "Montenegro"
	},
	{
		"code": "ms",
		"name": "Montserrat"
	},
	{
		"code": "ma",
		"name": "Morocco"
	},
	{
		"code": "mz",
		"name": "Mozambique"
	},
	{
		"code": "mm",
		"name": "Myanmar"
	},
	{
		"code": "na",
		"name": "Namibia"
	},
	{
		"code": "nr",
		"name": "Nauru"
	},
	{
		"code": "np",
		"name": "Nepal"
	},
	{
		"code": "nl",
		"name": "Netherlands"
	},
	{
		"code": "an",
		"name": "Netherlands Antilles"
	},
	{
		"code": "nc",
		"name": "New Caledonia"
	},
	{
		"code": "nz",
		"name": "New Zealand"
	},
	{
		"code": "ni",
		"name": "Nicaragua"
	},
	{
		"code": "ne",
		"name": "Niger"
	},
	{
		"code": "ng",
		"name": "Nigeria"
	},
	{
		"code": "nu",
		"name": "Niue"
	},
	{
		"code": "nf",
		"name": "Norfolk Island"
	},
	{
		"code": "mp",
		"name": "Northern Mariana Islands"
	},
	{
		"code": "no",
		"name": "Norway"
	},
	{
		"code": "om",
		"name": "Oman"
	},
	{
		"code": "pk",
		"name": "Pakistan"
	},
	{
		"code": "pw",
		"name": "Palau"
	},
	{
		"code": "ps",
		"name": "Palestinian Territory, Occupied"
	},
	{
		"code": "pa",
		"name": "Panama"
	},
	{
		"code": "pg",
		"name": "Papua New Guinea"
	},
	{
		"code": "py",
		"name": "Paraguay"
	},
	{
		"code": "pe",
		"name": "Peru"
	},
	{
		"code": "ph",
		"name": "Philippines"
	},
	{
		"code": "pn",
		"name": "Pitcairn"
	},
	{
		"code": "pl",
		"name": "Poland"
	},
	{
		"code": "pt",
		"name": "Portugal"
	},
	{
		"code": "pr",
		"name": "Puerto Rico"
	},
	{
		"code": "qa",
		"name": "Qatar"
	},
	{
		"code": "re",
		"name": "Reunion"
	},
	{
		"code": "ro",
		"name": "Romania"
	},
	{
		"code": "ru",
		"name": "Russian Federation"
	},
	{
		"code": "rw",
		"name": "Rwanda"
	},
	{
		"code": "bl",
		"name": "Saint Barthelemy"
	},
	{
		"code": "sh",
		"name": "Saint Helena"
	},
	{
		"code": "kn",
		"name": "Saint Kitts And Nevis"
	},
	{
		"code": "lc",
		"name": "Saint Lucia"
	},
	{
		"code": "mf",
		"name": "Saint Martin"
	},
	{
		"code": "pm",
		"name": "Saint Pierre And Miquelon"
	},
	{
		"code": "vc",
		"name": "Saint Vincent And Grenadines"
	},
	{
		"code": "ws",
		"name": "Samoa"
	},
	{
		"code": "sm",
		"name": "San Marino"
	},
	{
		"code": "st",
		"name": "Sao Tome And Principe"
	},
	{
		"code": "sa",
		"name": "Saudi Arabia"
	},
	{
		"code": "sn",
		"name": "Senegal"
	},
	{
		"code": "rs",
		"name": "Serbia"
	},
	{
		"code": "sc",
		"name": "Seychelles"
	},
	{
		"code": "sl",
		"name": "Sierra Leone"
	},
	{
		"code": "sg",
		"name": "Singapore"
	},
	{
		"code": "sk",
		"name": "Slovakia"
	},
	{
		"code": "si",
		"name": "Slovenia"
	},
	{
		"code": "sb",
		"name": "Solomon Islands"
	},
	{
		"code": "so",
		"name": "Somalia"
	},
	{
		"code": "za",
		"name": "South Africa"
	},
	{
		"code": "gs",
		"name": "South Georgia And Sandwich Isl."
	},
	{
		"code": "es",
		"name": "Spain"
	},
	{
		"code": "lk",
		"name": "Sri Lanka"
	},
	{
		"code": "sd",
		"name": "Sudan"
	},
	{
		"code": "sr",
		"name": "Suriname"
	},
	{
		"code": "sj",
		"name": "Svalbard And Jan Mayen"
	},
	{
		"code": "sz",
		"name": "Swaziland"
	},
	{
		"code": "se",
		"name": "Sweden"
	},
	{
		"code": "ch",
		"name": "Switzerland"
	},
	{
		"code": "sy",
		"name": "Syrian Arab Republic"
	},
	{
		"code": "tw",
		"name": "Taiwan"
	},
	{
		"code": "tj",
		"name": "Tajikistan"
	},
	{
		"code": "tz",
		"name": "Tanzania"
	},
	{
		"code": "th",
		"name": "Thailand"
	},
	{
		"code": "tl",
		"name": "Timor-Leste"
	},
	{
		"code": "tg",
		"name": "Togo"
	},
	{
		"code": "tk",
		"name": "Tokelau"
	},
	{
		"code": "to",
		"name": "Tonga"
	},
	{
		"code": "tt",
		"name": "Trinidad And Tobago"
	},
	{
		"code": "tn",
		"name": "Tunisia"
	},
	{
		"code": "tr",
		"name": "Turkey"
	},
	{
		"code": "tm",
		"name": "Turkmenistan"
	},
	{
		"code": "tc",
		"name": "Turks And Caicos Islands"
	},
	{
		"code": "tv",
		"name": "Tuvalu"
	},
	{
		"code": "ug",
		"name": "Uganda"
	},
	{
		"code": "ua",
		"name": "Ukraine"
	},
	{
		"code": "ae",
		"name": "United Arab Emirates"
	},
	{
		"code": "gb",
		"name": "United Kingdom"
	},
	{
		"code": "us",
		"name": "United States"
	},
	{
		"code": "um",
		"name": "United States Outlying Islands"
	},
	{
		"code": "uy",
		"name": "Uruguay"
	},
	{
		"code": "uz",
		"name": "Uzbekistan"
	},
	{
		"code": "vu",
		"name": "Vanuatu"
	},
	{
		"code": "ve",
		"name": "Venezuela"
	},
	{
		"code": "vn",
		"name": "Viet Nam"
	},
	{
		"code": "vg",
		"name": "Virgin Islands, British"
	},
	{
		"code": "vi",
		"name": "Virgin Islands, U.S."
	},
	{
		"code": "wf",
		"name": "Wallis And Futuna"
	},
	{
		"code": "eh",
		"name": "Western Sahara"
	},
	{
		"code": "ye",
		"name": "Yemen"
	},
	{
		"code": "zm",
		"name": "Zambia"
	},
	{
		"code": "zw",
		"name": "Zimbabwe"
	}
];
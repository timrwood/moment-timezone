(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('moment')) :
	typeof define === 'function' && define.amd ? define(['moment'], factory) :
	(global.moment = factory(global.moment));
}(this, function (moment) { 'use strict';

	moment = 'default' in moment ? moment['default'] : moment;

	var babelHelpers = {};

	babelHelpers.classCallCheck = function (instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	};

	babelHelpers;

	function logError(message) {
		if (typeof console !== 'undefined' && typeof console.error === 'function') {
			console.error(message);
		}
	}

	var VERSION = '0.5.1';

	function isVersionLessThan(a, b) {
		var _a$split = a.split('.');

		var aMajor = _a$split[0];
		var aMinor = _a$split[1];
		var aPatch = _a$split[2];

		var _b$split = b.split('.');

		var bMajor = _b$split[0];
		var bMinor = _b$split[1];
		var bPatch = _b$split[2];

		var sameMajor = aMajor === bMajor;
		var sameMinor = sameMajor && aMinor === bMinor;
		return +aMajor < +bMajor || sameMajor && +aMinor < +bMinor || sameMinor && +aPatch < +bPatch;
	}

	function needsOffset(m) {
		return !!(m._a && m._tzm === undefined);
	}

	function buildTz(moment, db) {
		function tz() {
			for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
				args[_key] = arguments[_key];
			}

			var name = args.pop();
			var zone = db.getZone(name);
			var out = moment.utc.apply(moment, args);

			if (zone && !moment.isMoment(args[0]) && needsOffset(out)) {
				out.add(zone.parse(out, tz), 'minutes');
			}

			out.tz(name);

			return out;
		}
		return tz;
	}

	function guessFromIntl(db) {
		try {
			var intlName = Intl.DateTimeFormat().resolvedOptions().timeZone;
			var zone = db.getZone(intlName);
			if (zone) {
				return zone.name;
			}
			logError("Moment Timezone found " + intlName + " from the Intl api, but did not have that data loaded.");
		} catch (e) {
			// Intl unavailable, fall back to manual guessing.
		}
	}

	var OffsetAt = function OffsetAt(at) {
		babelHelpers.classCallCheck(this, OffsetAt);

		var timeString = at.toTimeString();
		var abbr = timeString.match(/\([a-z ]+\)/i);

		if (abbr && abbr[0]) {
			// 17:56:31 GMT-0600 (CST)
			// 17:56:31 GMT-0600 (Central Standard Time)
			abbr = abbr[0].match(/[A-Z]/g);
			abbr = abbr ? abbr.join('') : undefined;
		} else {
			// 17:56:31 CST
			// 17:56:31 GMT+0800 (台北標準時間)
			abbr = timeString.match(/[A-Z]{3,5}/g);
			abbr = abbr ? abbr[0] : undefined;
		}

		if (abbr === 'GMT') {
			abbr = undefined;
		}

		this.at = +at;
		this.abbr = abbr;
		this.offset = at.getTimezoneOffset();
	};

	function findChange(low, high) {
		var diff = undefined;

		while (diff = ((high.at - low.at) / 12e4 | 0) * 6e4) {
			var mid = new OffsetAt(new Date(low.at + diff));
			if (mid.offset === low.offset) {
				low = mid;
			} else {
				high = mid;
			}
		}

		return low;
	}

	function userOffsets(year) {
		var startYear = year - 2;
		var offsets = [];
		var last = new OffsetAt(new Date(startYear, 0, 1));

		for (var i = 1; i < 48; i++) {
			var next = new OffsetAt(new Date(startYear, i, 1));
			if (next.offset !== last.offset) {
				var change = findChange(last, next);
				offsets.push(change);
				offsets.push(new OffsetAt(new Date(change.at + 6e4)));
			}
			last = next;
		}

		for (var _i = 0; _i < 4; _i++) {
			offsets.push(new OffsetAt(new Date(startYear + _i, 0, 1)));
			offsets.push(new OffsetAt(new Date(startYear + _i, 6, 1)));
		}

		return offsets;
	}

	var ZoneScore = function () {
		function ZoneScore(zone) {
			babelHelpers.classCallCheck(this, ZoneScore);

			this.zone = zone;
			this.offsetScore = 0;
			this.abbrScore = 0;
		}

		ZoneScore.prototype.scoreOffsetAt = function scoreOffsetAt(offsetAt) {
			this.offsetScore += Math.abs(this.zone.offset(offsetAt.at) - offsetAt.offset);
			this.abbrScore += this.zone.abbr(offsetAt.at).replace(/[^A-Z]/g, '') !== offsetAt.abbr;
		};

		return ZoneScore;
	}();

	function sortZoneScores(a, b) {
		if (a.offsetScore !== b.offsetScore) {
			return a.offsetScore - b.offsetScore;
		}
		if (a.abbrScore !== b.abbrScore) {
			return a.abbrScore - b.abbrScore;
		}
		return b.zone.population - a.zone.population;
	}

	function guessFromUserOffsets(db) {
		var offsets = userOffsets(new Date().getFullYear());
		var offsetsLength = offsets.length;
		var guesses = db.getGuesses(offsets);
		var zoneScores = [];

		for (var i = 0, l = guesses.length; i < l; i++) {
			var zoneScore = new ZoneScore(db.getZone(guesses[i]), offsetsLength);
			for (var j = 0; j < offsetsLength; j++) {
				zoneScore.scoreOffsetAt(offsets[j]);
			}
			zoneScores.push(zoneScore);
		}

		zoneScores.sort(sortZoneScores);

		return zoneScores.length > 0 ? zoneScores[0].zone.name : undefined;
	}

	function memoizeGuess(db) {
		var cachedGuess = undefined;
		return function guess(ignoreCache) {
			if (!cachedGuess || ignoreCache) {
				cachedGuess = guessFromIntl(db) || guessFromUserOffsets(db);
			}
			return cachedGuess;
		};
	}

	function charCodeToInt(charCode) {
		if (charCode > 96) {
			return charCode - 87;
		} else if (charCode > 64) {
			return charCode - 29;
		}
		return charCode - 48;
	}

	var _Math = Math;
	var max = _Math.max;


	function unpackBase60(string) {
		var parts = string.split('.');
		var whole = parts[0];
		var fractional = parts[1] || '';
		var multiplier = 1;
		var out = 0;
		var sign = string[0] === '-' ? -1 : 1;

		// handle digits before the decimal
		for (var i = max(0, -sign); i < whole.length; i++) {
			out = 60 * out + charCodeToInt(whole.charCodeAt(i));
		}

		// handle digits after the decimal
		for (var _i = 0; _i < fractional.length; _i++) {
			multiplier /= 60;
			out += charCodeToInt(fractional.charCodeAt(_i)) * multiplier;
		}

		return out * sign;
	}

	function arrayToInt(array) {
		for (var i = 0, l = array.length; i < l; i++) {
			array[i] = unpackBase60(array[i]);
		}
	}

	function normalizeName(name) {
		return String(name || '').toLowerCase().replace(/\//g, '_');
	}

	function intsToUntils(array, length) {
		for (var i = 0; i < length; i++) {
			array[i] = Math.round((array[i - 1] || 0) + array[i] * 60000); // minutes to milliseconds
		}

		array[length - 1] = Infinity;
	}

	function mapIndices(source, indices) {
		var out = [];

		for (var i = 0, l = indices.length; i < l; i++) {
			out[i] = source[indices[i]];
		}

		return out;
	}

	function unpack(string) {
		var data = string.split('|');
		var offsets = data[2].split(' ');
		var indices = data[3].split('');
		var untils = data[4].split(' ');

		arrayToInt(offsets);
		arrayToInt(indices);
		arrayToInt(untils);

		intsToUntils(untils, indices.length);

		return {
			name: data[0],
			abbrs: mapIndices(data[1].split(' '), indices),
			offsets: mapIndices(offsets, indices),
			untils: untils,
			population: data[5] | 0
		};
	}

	var Zone = function () {
		function Zone(packedString) {
			babelHelpers.classCallCheck(this, Zone);

			if (packedString) {
				this._set(unpack(packedString));
			}
		}

		Zone.prototype._set = function _set(unpacked) {
			this.name = unpacked.name;
			this.abbrs = unpacked.abbrs;
			this.untils = unpacked.untils;
			this.offsets = unpacked.offsets;
			this.population = unpacked.population;
		};

		Zone.prototype._index = function _index(timestamp) {
			var target = +timestamp;
			var untils = this.untils;

			for (var i = 0, l = untils.length; i < l; i++) {
				if (target < untils[i]) {
					return i;
				}
			}
		};

		Zone.prototype.parse = function parse(timestamp, config) {
			var target = +timestamp;
			var offsets = this.offsets;
			var untils = this.untils;
			var max = untils.length - 1;

			for (var i = 0; i < max; i++) {
				var offset = offsets[i];
				var offsetNext = offsets[i + 1];
				var offsetPrev = offsets[i ? i - 1 : i];

				if (offset < offsetNext && config && config.moveAmbiguousForward) {
					offset = offsetNext;
				} else if (offset > offsetPrev && config && config.moveInvalidForward) {
					offset = offsetPrev;
				}

				if (target < untils[i] - offset * 60000) {
					return offsets[i];
				}
			}

			return offsets[max];
		};

		Zone.prototype.abbr = function abbr(mom) {
			return this.abbrs[this._index(mom)];
		};

		Zone.prototype.offset = function offset(mom) {
			return this.offsets[this._index(mom)];
		};

		return Zone;
	}();

	var Database = function () {
		function Database() {
			babelHelpers.classCallCheck(this, Database);

			this._links = {};
			this._names = {};
			this._zones = {};
			this._guesses = {};
			this.version = "";
		}

		Database.prototype.put = function put(data) {
			this.putZone(data.zones);
			this.putLink(data.links);
			this.version = data.version;
		};

		Database.prototype.putZone = function putZone(packed) {
			var _names = this._names;
			var _zones = this._zones;
			var _guesses = this._guesses;


			if (typeof packed === "string") {
				packed = [packed];
			}

			for (var i = 0; i < packed.length; i++) {
				var split = packed[i].split('|');
				var name = split[0];
				var normalized = normalizeName(name);
				_zones[normalized] = packed[i];
				_names[normalized] = name;

				if (split[5]) {
					var offsets = split[2].split(' ');
					arrayToInt(offsets);
					for (var _i = 0, l = offsets.length; _i < l; _i++) {
						var offset = offsets[_i];
						_guesses[offset] = _guesses[offset] || {};
						_guesses[offset][normalized] = true;
					}
				}
			}
		};

		Database.prototype.putLink = function putLink(aliases) {
			var _names = this._names;
			var _links = this._links;


			if (typeof aliases === "string") {
				aliases = [aliases];
			}

			for (var i = 0; i < aliases.length; i++) {
				var alias = aliases[i].split('|');

				var normal0 = normalizeName(alias[0]);
				var normal1 = normalizeName(alias[1]);

				_links[normal0] = normal1;
				_names[normal0] = alias[0];

				_links[normal1] = normal0;
				_names[normal1] = alias[1];
			}
		};

		Database.prototype.getZone = function getZone(name, _stopRecursion) {
			name = normalizeName(name);

			var _names = this._names;
			var _zones = this._zones;
			var _links = this._links;

			var zone = _zones[name];

			if (zone instanceof Zone) {
				return zone;
			}

			if (typeof zone === 'string') {
				zone = new Zone(zone);
				_zones[name] = zone;
				return zone;
			}

			if (_links[name] && !_stopRecursion) {
				var link = this.getZone(_links[name], true);
				if (link) {
					zone = _zones[name] = new Zone();
					zone._set(link);
					zone.population = 0;
					zone.name = _names[name];
					return zone;
				}
			}

			return null;
		};

		Database.prototype.getNames = function getNames() {
			var _names = this._names;
			var _zones = this._zones;
			var _links = this._links;

			var out = [];

			for (var i in _names) {
				if (_names.hasOwnProperty(i) && (_zones[i] || _zones[_links[i]]) && _names[i]) {
					out.push(_names[i]);
				}
			}

			return out.sort();
		};

		Database.prototype.getGuesses = function getGuesses(offsetAts) {
			var _names = this._names;
			var _guesses = this._guesses;

			var filteredGuesses = {};
			var out = [];

			for (var i = 0, l = offsetAts.length; i < l; i++) {
				var guessesForOffset = _guesses[offsetAts[i].offset] || {};
				for (var j in guessesForOffset) {
					if (guessesForOffset.hasOwnProperty(j)) {
						filteredGuesses[j] = true;
					}
				}
			}

			for (var _i2 in filteredGuesses) {
				if (filteredGuesses.hasOwnProperty(_i2)) {
					out.push(_names[_i2]);
				}
			}

			return out.sort();
		};

		return Database;
	}();

	function attachToArray(array) {
		var hasA = false;
		var hasZ = false;

		for (var i = 0; i < array.length; i++) {
			hasA = hasA || array[i] === '_a';
			hasZ = hasZ || array[i] === '_z';
		}
		if (!hasA) {
			array.push('_a');
		}
		if (!hasZ) {
			array.push('_z');
		}
	}

	function attachMomentProperties(moment) {
		var momentProperties = moment.momentProperties;

		if (Object.prototype.toString.call(momentProperties) === '[object Array]') {
			// moment 2.8.1+
			attachToArray(momentProperties);
		} else if (momentProperties) {
			// moment 2.7.0
			momentProperties._z = null;
		}
	}

	function attachPrototypeTz(moment, db) {
		moment.fn.tz = function (name) {
			if (name) {
				this._z = db.getZone(name);
				if (this._z) {
					moment.updateOffset(this);
				} else {
					logError("Moment Timezone has no data for " + name + ". See http://momentjs.com/timezone/docs/#/data-loading/.");
				}
				return this;
			}
			return this._z && this._z.name;
		};
	}

	function wrapUtc(old) {
		return function () {
			this._z = null;
			return old.apply(this, arguments);
		};
	}

	function wrapZoneAbbr(old) {
		return function () {
			if (this._z) {
				return this._z.abbr(this);
			}
			return old.apply(this, arguments);
		};
	}

	function attachPrototypeWrappers(prototype) {
		prototype.zoneName = wrapZoneAbbr(prototype.zoneName);
		prototype.zoneAbbr = wrapZoneAbbr(prototype.zoneAbbr);
		prototype.utc = wrapUtc(prototype.utc);
	}

	function attachSetDefault(moment, db) {
		moment.defaultZone = null;

		return function (name) {
			if (isVersionLessThan(moment.version, '2.9.0')) {
				logError('Moment Timezone setDefault() requires Moment.js >= 2.9.0. You are using Moment.js ' + moment.version + '.');
			} else {
				moment.defaultZone = name ? db.getZone(name) : null;
			}
			return moment;
		};
	}

	function updateOffsetFromZone(instance, zone, keepTime) {
		var offset = zone.offset(instance);

		if (Math.abs(offset) < 16) {
			offset = offset / 60;
		}

		if (instance.utcOffset !== undefined) {
			instance.utcOffset(-offset, keepTime);
		} else {
			instance.zone(offset, keepTime);
		}
	}

	function setZoneFromDefaultZone(instance, moment) {
		var zone = moment.defaultZone;

		if (zone && needsOffset(instance) && !instance._isUTC) {
			instance._d = moment.utc(instance._a)._d;
			instance.utc().add(zone.parse(instance), 'minutes');
		}

		instance._z = zone;
	}

	function attachUpdateOffset(moment) {
		moment.updateOffset = function (instance, keepTime) {
			if (instance._z === undefined) {
				setZoneFromDefaultZone(instance, moment);
			}

			if (instance._z) {
				updateOffsetFromZone(instance, instance._z, keepTime);
			}
		};
	}

	function versionIsNotSupported(version) {
		if (isVersionLessThan(version, '2.6.0')) {
			logError('Moment Timezone requires Moment.js >= 2.6.0. You are using Moment.js ' + version + '. See momentjs.com');
			return true;
		}
	}

	function attach(moment) {
		if (versionIsNotSupported(moment.version)) {
			return;
		}

		var db = new Database();
		var tz = buildTz(moment, db);

		tz.version = VERSION;
		tz.dataVersion = '';
		tz.moveInvalidForward = true;
		tz.moveAmbiguousForward = false;

		tz.add = function (zone) {
			db.putZone(zone);
		};
		tz.link = function (link) {
			db.putLink(link);
		};
		tz.load = function (data) {
			db.put(data);
			tz.dataVersion = db.version;
		};

		tz.zone = function (name) {
			return db.getZone(name);
		};
		tz.names = function (_) {
			return db.getNames();
		};

		tz.guess = memoizeGuess(db);

		tz.setDefault = attachSetDefault(moment, db);

		attachPrototypeTz(moment, db);
		attachPrototypeWrappers(moment.fn);
		attachUpdateOffset(moment);
		attachMomentProperties(moment);

		moment.tz = tz;
		tz.moment = moment;

		return tz;
	}

	attach(moment);

	return moment;

}));
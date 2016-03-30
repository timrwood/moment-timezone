(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.moment = factory());
}(this, function () { 'use strict';

	var babelHelpers = {};

	babelHelpers.classCallCheck = function (instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	};

	babelHelpers;

	function validatePackData(source) {
		if (!source.name) {
			throw new Error("Missing name");
		}
		if (!source.abbrs) {
			throw new Error("Missing abbrs");
		}
		if (!source.untils) {
			throw new Error("Missing untils");
		}
		if (!source.offsets) {
			throw new Error("Missing offsets");
		}
		if (source.offsets.length !== source.untils.length || source.offsets.length !== source.abbrs.length) {
			throw new Error("Mismatched array lengths");
		}
	}

	var BASE60 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWX';
	var EPSILON = 0.000001; // Used to fix floating point rounding errors

	var _Math = Math;
	var abs = _Math.abs;
	var min = _Math.min;
	var floor = _Math.floor;


	function packBase60Fraction(fraction, precision) {
		var buffer = '.';
		var output = '';

		while (precision > 0) {
			precision -= 1;
			fraction *= 60;
			var current = floor(fraction + EPSILON);
			buffer += BASE60[current];
			fraction -= current;

			// Only add buffer to output once we have a non-zero value.
			// This makes '.000' output '', and '.100' output '.1'
			if (current) {
				output += buffer;
				buffer = '';
			}
		}

		return output;
	}

	function packBase60(number, precision) {
		var output = '';
		var absolute = abs(number);
		var whole = floor(absolute);
		var fraction = packBase60Fraction(absolute - whole, min(~ ~precision, 10));

		while (whole > 0) {
			output = BASE60[whole % 60] + output;
			whole = floor(whole / 60);
		}

		if (number < 0) {
			output = '-' + output;
		}

		if (output && fraction) {
			return output + fraction;
		}

		if (!fraction && output === '-') {
			return '0';
		}

		return output || fraction || '0';
	}

	function packAbbrsAndOffsets(source) {
		var index = 0;
		var abbrs = [];
		var offsets = [];
		var indices = [];
		var map = {};

		for (var i = 0; i < source.abbrs.length; i++) {
			var key = source.abbrs[i] + '|' + source.offsets[i];
			if (map[key] === undefined) {
				map[key] = index;
				abbrs[index] = source.abbrs[i];
				offsets[index] = packBase60(Math.round(source.offsets[i] * 60) / 60, 1);
				index++;
			}
			indices[i] = packBase60(map[key], 0);
		}

		return abbrs.join(' ') + '|' + offsets.join(' ') + '|' + indices.join('');
	}

	function packPopulation(number) {
		if (!number) {
			return '';
		}
		if (number < 1000) {
			return '|' + number;
		}
		var exponent = String(number | 0).length - 2;
		var precision = Math.round(number / Math.pow(10, exponent));
		return '|' + precision + 'e' + exponent;
	}

	function packUntils(untils) {
		var out = [];
		var last = 0;

		for (var i = 0; i < untils.length - 1; i++) {
			out[i] = packBase60(Math.round((untils[i] - last) / 1000) / 60, 1);
			last = untils[i];
		}

		return out.join(' ');
	}

	function pack(source) {
		validatePackData(source);
		return [source.name, packAbbrsAndOffsets(source), packUntils(source.untils) + packPopulation(source.population)].join('|');
	}

	function areArraysEqual(a, b) {
		var length = a.length;
		if (b.length !== length) {
			return false;
		}

		for (var i = 0; i < length; i++) {
			if (a[i] !== b[i]) {
				return false;
			}
		}

		return true;
	}

	function areZonesEqual(a, b) {
		return areArraysEqual(a.abbrs, b.abbrs) && areArraysEqual(a.untils, b.untils) && areArraysEqual(a.offsets, b.offsets);
	}

	function findAndCreateLinks(input, output, links) {
		var groups = [];

		for (var i = 0; i < input.length; i++) {
			var foundGroup = false;
			var a = input[i];

			for (var j = 0; j < groups.length; j++) {
				var group = groups[j];
				var b = group[0];
				if (areZonesEqual(a, b)) {
					if (a.population > b.population) {
						group.unshift(a);
					} else {
						group.push(a);
					}
					foundGroup = true;
				}
			}

			if (!foundGroup) {
				groups.push([a]);
			}
		}

		for (var _i = 0; _i < groups.length; _i++) {
			var _group = groups[_i];
			output.push(_group[0]);
			for (var _j = 1; _j < _group.length; _j++) {
				links.push(_group[0].name + '|' + _group[_j].name);
			}
		}
	}

	function createLinks(source) {
		var zones = [];
		var links = source.links ? source.links.slice() : [];

		findAndCreateLinks(source.zones, zones, links);

		return {
			version: source.version,
			zones: zones,
			links: links.sort()
		};
	}

	function findStartAndEndIndex(untils, start, end) {
		var startI = 0;
		var endI = untils.length + 1;

		end = end || start;

		if (start > end) {
			var _ref = [end, start];
			start = _ref[0];
			end = _ref[1];
		}

		for (var i = 0; i < untils.length; i++) {
			if (untils[i] == null) {
				continue;
			}
			var untilYear = new Date(untils[i]).getUTCFullYear();
			if (untilYear < start) {
				startI = i + 1;
			}
			if (untilYear > end) {
				endI = Math.min(endI, i + 1);
			}
		}

		return [startI, endI];
	}

	function filterYears(source, start, end) {
		var _source$untils, _source$abbrs, _source$offsets;

		var indices = findStartAndEndIndex(source.untils, start, end);
		var untils = (_source$untils = source.untils).slice.apply(_source$untils, indices);

		untils[untils.length - 1] = null;

		return {
			name: source.name,
			abbrs: (_source$abbrs = source.abbrs).slice.apply(_source$abbrs, indices),
			untils: untils,
			offsets: (_source$offsets = source.offsets).slice.apply(_source$offsets, indices),
			population: source.population
		};
	}

	function filterLinkPack(input, start, end) {
		var inputZones = input.zones;
		var outputZones = [];

		for (var i = 0; i < inputZones.length; i++) {
			outputZones[i] = filterYears(inputZones[i], start, end);
		}

		var output = createLinks({
			zones: outputZones,
			links: input.links.slice(),
			version: input.version
		});

		for (var _i = 0; _i < output.zones.length; _i++) {
			output.zones[_i] = pack(output.zones[_i]);
		}

		return output;
	}

	var momentTimezoneUtils = { pack: pack, packBase60: packBase60, createLinks: createLinks, filterYears: filterYears, filterLinkPack: filterLinkPack };

	return momentTimezoneUtils;

}));
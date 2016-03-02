import normalizeName from './normalize-name';
import Zone from '../zone/zone';

export default class Database {
	constructor () {
		this._links = {};
		this._names = {};
		this._zones = {};
	}

	putZone (packed) {
		if (typeof packed === "string") {
			packed = [packed];
		}

		for (let i = 0; i < packed.length; i++) {
			let split = packed[i].split('|');
			let name = split[0];
			let normalized = normalizeName(name);
			this._zones[normalized] = packed[i];
			this._names[normalized] = name;
      // TODO: Add tests for checking guesses
			// if (split[5]) {
			//   addToGuesses(normalized, split[2].split(' '));
			// }
		}
	}

	getZone (name, _stopRecursion) {
		name = normalizeName(name);

		const { _names, _zones, _links } = this;
		let zone = _zones[name];

		if (zone instanceof Zone) {
			return zone;
		}

		if (typeof zone === 'string') {
			zone = new Zone(zone);
			_zones[name] = zone;
			return zone;
		}

		if (_links[name] && !_stopRecursion) {
			let link = this.getZone(_links[name], true);
			if (link) {
				zone = _zones[name] = new Zone();
				zone._set(link);
				zone.name = _names[name];
				return zone;
			}
		}

		return null;
	}

	getNames () {
		const { _names, _zones, _links } = this;
		const out = [];

		for (let i in _names) {
			if (_names.hasOwnProperty(i) && (_zones[i] || _zones[_links[i]]) && _names[i]) {
				out.push(_names[i]);
			}
		}

		return out.sort();
	}

	putLink (aliases) {
		const { _names, _links } = this;

		if (typeof aliases === "string") {
			aliases = [aliases];
		}

		for (let i = 0; i < aliases.length; i++) {
			let alias = aliases[i].split('|');

			let normal0 = normalizeName(alias[0]);
			let normal1 = normalizeName(alias[1]);

			_links[normal0] = normal1;
			_names[normal0] = alias[0];

			_links[normal1] = normal0;
			_names[normal1] = alias[1];
		}
	}
}

function wrapUtc (old) {
	return function () {
		this._z = null;
		return old(...arguments);
	};
}

function wrapZoneAbbr (old) {
	return function () {
		if (this._z) {
			return this._z.abbr(this);
		}
		return old(...arguments);
	};
}

export default function attachPrototypeWrappers (prototype) {
	prototype.zoneName = wrapZoneAbbr(prototype.zoneName);
	prototype.zoneAbbr = wrapZoneAbbr(prototype.zoneAbbr);
	prototype.utc = wrapUtc(prototype.utc);
}

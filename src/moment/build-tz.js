import needsOffset from '../parse/needs-offset';

export default function buildTz (moment, db) {
	return function tz (...args) {
		const name = args.pop();
		const zone = db.getZone(name);
		const out = moment.utc(...args);

		if (zone && !moment.isMoment(args[0]) && needsOffset(out)) {
			out.add(zone.parse(out), 'minutes');
		}

		out.tz(name);

		return out;
	};
}

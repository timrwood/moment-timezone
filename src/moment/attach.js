import logError from '../utils/log-error';
import VERSION from './version';
import isVersionLessThan from './is-version-less-than';

export default function attach (moment) {
	if (isVersionLessThan(moment.version, '2.6.0')) {
		logError('Moment Timezone requires Moment.js >= 2.6.0. You are using Moment.js ' + moment.version + '. See momentjs.com');
		return;
	}

	const tz = {};

	tz.version = VERSION;

	return tz;
}

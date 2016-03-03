import test from 'ava';
import moment from 'moment';
import VERSION from '../../src/moment/version';
import { pauseErrors, resumeErrors } from '../helpers/logging';
import attach from '../../src/moment/attach';

test.afterEach(t => {
	resumeErrors();
});

test('check moment version', t => {
	pauseErrors();
	const tz = attach({ version: "2.5.0" });

	t.same(resumeErrors(), ['Moment Timezone requires Moment.js >= 2.6.0. You are using Moment.js 2.5.0. See momentjs.com']);
	t.is(tz, undefined);
});

test('moment-timezone version', t => {
	let tz = attach(moment);

	t.is(tz.version, VERSION);
});

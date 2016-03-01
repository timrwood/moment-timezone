const BASE60 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWX';
const EPSILON = 0.000001; // Used to fix floating point rounding errors

const { abs, min, floor } = Math;

function packBase60Fraction(fraction, precision) {
	let buffer = '.';
	let output = '';

	while (precision > 0) {
		precision -= 1;
		fraction *= 60;
		let current = floor(fraction + EPSILON);
		buffer += BASE60[current];
		fraction -= current;

		// Only add buffer to output once we have a non-zero value.
		// This makes '.000' output '', and '.100' output '.1'
		if (current) {
			output += buffer;
			buffer  = '';
		}
	}

	return output;
}

export default function packBase60(number, precision) {
	let output = '';
	const absolute = abs(number);
	let whole = floor(absolute);
	const fraction = packBase60Fraction(absolute - whole, min(~~precision, 10));

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

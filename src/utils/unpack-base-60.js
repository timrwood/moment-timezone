const { max } = Math;

function charCodeToInt(charCode) {
	if (charCode > 96) {
		return charCode - 87;
	} else if (charCode > 64) {
		return charCode - 29;
	}
	return charCode - 48;
}

export default function unpackBase60(string) {
	const parts = string.split('.');
	const whole = parts[0];
	const fractional = parts[1] || '';
	let multiplier = 1;
	let out = 0;
	let sign = string[0] === '-' ? -1 : 1;

	// handle digits before the decimal
	for (let i = max(0, -sign); i < whole.length; i++) {
		out = 60 * out + charCodeToInt(whole.charCodeAt(i));
	}

	// handle digits after the decimal
	for (let i = 0; i < fractional.length; i++) {
		multiplier /= 60;
		out += charCodeToInt(fractional.charCodeAt(i)) * multiplier;
	}

	return out * sign;
}

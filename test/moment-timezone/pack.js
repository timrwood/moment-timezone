import test from 'ava';
import pack from '../../src/utils/pack';

test('single', t => {
	t.is(pack({
		name : "Some/Zone_Name",
		abbrs   : ["ABC", "DEF", "ABC", "DEF", "GHI", "DEF"],
		offsets : [60, 239, 60, 239, 60, 239],
		untils  : [
			-4259 * 60000,
			-4139 * 60000,
			-3900 * 60000,
			-3780 * 60000,
			-3541 * 60000,
			Infinity
		]
	}), "Some/Zone_Name|ABC DEF GHI|10 3X 10|010121|-1aX 20 3X 20 3X");
});

test('single with population', t => {
	t.is(pack({
		name : "Some/Zone_Name",
		abbrs   : ["ABC", "DEF", "ABC", "DEF", "GHI", "DEF"],
		offsets : [60, 239, 60, 239, 60, 239],
		untils  : [
			-4259 * 60000,
			-4139 * 60000,
			-3900 * 60000,
			-3780 * 60000,
			-3541 * 60000,
			Infinity
		],
		population : 1234567
	}), "Some/Zone_Name|ABC DEF GHI|10 3X 10|010121|-1aX 20 3X 20 3X|12e5");
});

test('single with population under 1000', t => {
	t.is(pack({
		name : "Some/Zone_Name",
		abbrs   : ["ABC"],
		offsets : [60],
		untils  : [Infinity],
		population : 999
	}), "Some/Zone_Name|ABC|10|0||999");
});

test('single with population under 1000', t => {
	t.is(pack({
		name : "Some/Zone_Name",
		abbrs   : ["ABC"],
		offsets : [60],
		untils  : [Infinity],
		population : 455000001
	}), "Some/Zone_Name|ABC|10|0||46e7");
});

test('errors without name', t => {
	t.throws(_ => pack({
		abbrs : ['ABC'],
		offsets : [60],
		untils : [1000]
	}));

	t.throws(_ => pack({
		name : "",
		abbrs : ['ABC'],
		offsets : [60],
		untils : [1000]
	}));
});

test('errors without abbrs', t => {
	t.throws(_ => pack({
		name : "Test/Name",
		offsets : [60],
		untils : [1000]
	}));
});

test('errors without offsets', t => {
	t.throws(_ => pack({
		name : "Test/Name",
		abbrs : ["ABC"],
		untils : [1000]
	}));
});

test('errors without untils', t => {
	t.throws(_ => pack({
		name : "Test/Name",
		abbrs : ["ABC"],
		offsets : [60]
	}));
});

test('errors with mismatched data lengths', t => {
	t.throws(_ => pack({
		name : "Test/Name",
		abbrs : ['ABC'],
		offsets : [60, 20],
		untils : [1000]
	}));

	t.throws(_ => pack({
		name : "Test/Name",
		abbrs : ['ABC', 'DEF'],
		offsets : [60],
		untils : [1000]
	}));

	t.throws(_ => pack({
		name : "Test/Name",
		abbrs : ['ABC'],
		offsets : [60],
		untils : [1000, 2000]
	}));
});

export const setNumeralLocale = (numeral) => {
	numeral.register('locale', 'my', {
		delimiters: {
				thousands: ' ',
				decimal: '.'
		},
		abbreviations: {
				thousand: 'k',
				million: 'M',
				billion: 'B',
				trillion: 't'
		},
		// ordinal : function (number) {
		// 		return number === 1 ? 'er' : 'ème';
		// },
		// currency: {
		// 		symbol: '€'
		// }
	});
	
	numeral.locale('my');
}
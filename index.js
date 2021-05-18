#!/usr/bin/env node
const axios = require("axios");
const argv = require("yargs/yargs")(process.argv.slice(2))
	.default({
		i: "1h",
		l: 50,
		p: "USDT",
		r: 25,
	})
	.alias("v", "version")
	.help("h")
	.alias("h", "help")
	.alias("i", "interval")
	.describe("i", "Interval eg. 15m, 4h, 1d")
	.alias("p", "pair")
	.describe("p", "Coin pairing eg. BTC, BNB, ETH")
	.alias("l", "limit")
	.describe("l", "Number of candlesticks")
	.alias("r", "rows")
	.describe("r", "Graph height in rows").argv;

let [coin] = argv._.length ? argv._ : ["BTC"];
coin = coin.toUpperCase();
const interval = argv.i;
const limit = argv.l;
const pair = argv.p.toUpperCase();
const graphHeight = argv.r;

let coinData;
const getData = () => {
	const data = axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${coin}${pair}`);
	const graphData = axios.get(
		`https://api.binance.com/api/v3/klines?symbol=${coin}${pair}&interval=${interval}&limit=${limit}`
	);
	Promise.all([data, graphData])
		.then((res) => {
			coinData = res[0].data;
			plot(res[1].data);
		})
		.catch(() => console.log("Error fetching data :( Please try again!"));
};

const plot = (series) => {
	let seriesLength = series.length;

	let min = series[0][3];
	let max = series[0][2];

	const openArr = [];
	const closeArr = [];
	const highArr = [];
	const lowArr = [];

	series.forEach((d, i) => {
		let values = d.slice(1, 5);
		min = Math.min(min, ...values);
		max = Math.max(max, ...values);
		openArr.push(values[0]);
		highArr.push(values[1]);
		lowArr.push(values[2]);
		closeArr.push(values[3]);
	});

	let range = Math.abs(max - min);
	let height = graphHeight;
	let ratio = range !== 0 ? height / range : 1;

	let min2 = Math.round(min * ratio);
	let max2 = Math.round(max * ratio);

	let rows = Math.abs(max2 - min2);
	let width = seriesLength;
	let padding = "           ";
	let offset = 3;
	width = width + offset;

	let result = new Array(rows + 1);

	for (let i = 0; i <= rows; i++) {
		result[i] = new Array(width);
		for (let j = 0; j < width; j++) {
			result[i][j] = " ";
		}
	}

	const format = function (x) {
		const dec = x < 1 ? 4 : x < 1000 ? 2 : 0;
		return (padding + x.toFixed(dec)).slice(-padding.length);
	};

	for (let y = min2; y <= max2; ++y) {
		let label = format(rows > 0 ? max - ((y - min2) * range) / rows : y, y - min2);
		result[y - min2][Math.max(offset - label.length, 0)] = label;
		result[y - min2][offset - 1] = "┤";
	}

	for (let x = 0; x < seriesLength; x++) {
		let yOpen = Math.round(openArr[x] * ratio) - min2;
		let yClose = Math.round(closeArr[x] * ratio) - min2;
		let yHigh = Math.round(highArr[x] * ratio) - min2;
		let yLow = Math.round(lowArr[x] * ratio) - min2;

		const col = x + offset;

		if (yOpen <= yClose) {
			for (let i = rows - yHigh; i < rows - yClose; ++i) {
				result[i][col] = "|";
			}
			for (let i = rows - yOpen; i < rows - yLow; i++) {
				result[i][col] = "|";
			}
		} else {
			for (let i = rows - yOpen; i <= rows - yLow; ++i) {
				result[i][col] = "|";
			}
			for (let i = rows - yHigh; i <= rows - yClose; ++i) {
				result[i][col] = "|";
			}
		}

		//fill between open and close
		const low = Math.min(rows - yOpen, rows - yClose);
		const high = Math.max(rows - yOpen, rows - yClose);

		if (low !== high) {
			for (let i = low; i < high; ++i) {
				result[i][col] = "█";
			}
		}
		result[rows - yOpen][col] = "█";
	}
	console.log(result.map((x) => x.join(" ")).join("\n"));
	console.log(
		`\n The current price for ${coin} is ${coinData.lastPrice} ${pair} (${coinData.priceChangePercent}%)`
	);
};
getData();

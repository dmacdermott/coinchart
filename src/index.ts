#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import axios, { AxiosError } from "axios";
import { CoinResponse, GraphResponse } from "./types";

const BASE_URL = "https://api.binance.com/api/v3";

const COLOURS = {
  green: "\u001b[32;1m",
  red: "\u001b[31;1m",
  yellow: "\u001b[33;1m",
  reset: "\u001b[0m",
};

const argv = yargs(hideBin(process.argv))
  .default({
    i: "1h",
    l: 50,
    p: "USDT",
    r: 25,
  })
  .help("h")
  .alias("h", "help")
  .alias("i", "interval")
  .describe("i", "Interval eg. 15m, 4h, 1d")
  .alias("p", "pair")
  .describe("p", "Coin pairing eg. BTC, ETH, BNB")
  .alias("l", "limit")
  .describe("l", "Number of candlesticks")
  .alias("r", "rows")
  .describe("r", "Graph height measured in rows")
  .parseSync();

const coin = (argv._.length ? argv._[0] : "BTC")?.toString().toUpperCase();
const { i: interval, l: limit, p: pairInput, r: graphHeight } = argv;
const pair = pairInput?.toUpperCase();

const coinDataUrl = `${BASE_URL}/ticker/24hr?symbol=${coin}${pair}`;
const graphDataUrl = `${BASE_URL}/klines?symbol=${coin}${pair}&interval=${interval}&limit=${limit}`;

// ==== Graph Response format ==== //
//
// [
//   [
//     1499040000000,      // Kline open time
//     "0.01634790",       // Open price
//     "0.80000000",       // High price
//     "0.01575800",       // Low price
//     "0.01577100",       // Close price
//     "148976.11427815",  // Volume
//     1499644799999,      // Kline Close time
//     "2434.19055334",    // Quote asset volume
//     308,                // Number of trades
//     "1756.87402397",    // Taker buy base asset volume
//     "28.46694368",      // Taker buy quote asset volume
//     "0"                 // Unused field, ignore.
//   ]
// ]
//
// Refer to https://github.com/binance/binance-spot-api-docs/blob/master/rest-api.md#klinecandlestick-data
//
// =============================== //

const fetcher = async <T>(url: string): Promise<T> =>
  axios.get(url, { timeout: 5000 }).then((res) => res.data);

(async () => {
  try {
    const [coinData, graphData] = await Promise.all([
      fetcher<CoinResponse>(coinDataUrl),
      fetcher<GraphResponse>(graphDataUrl),
    ]);

    if (!coinData || !graphData) {
      console.log("Error fetching data :( Please try again!");
      return;
    }

    const {
      openingPrices,
      closingPrices,
      highestPrices,
      lowestPrices,
      minPrice,
      maxPrice,
    } = graphData.reduce(
      (acc, d, i) => {
        const values = d.slice(1, 5).map((v) => parseFloat(v as string));

        acc.minPrice = Math.min(acc.minPrice, ...values);
        acc.maxPrice = Math.max(acc.maxPrice, ...values);

        const [open, high, low, close] = values;

        acc.openingPrices.push(open!);
        acc.highestPrices.push(high!);
        acc.lowestPrices.push(low!);
        acc.closingPrices.push(close!);

        return acc;
      },
      {
        openingPrices: [] as number[],
        closingPrices: [] as number[],
        highestPrices: [] as number[],
        lowestPrices: [] as number[],
        minPrice: parseFloat(graphData?.[0]?.[3] as string),
        maxPrice: parseFloat(graphData?.[0]?.[2] as string),
      }
    );

    const range = Math.abs(maxPrice - minPrice);

    const ratio = range !== 0 ? graphHeight / range : 1;

    // Recalculate min and max to fit graph height
    const adjustedMin = Math.round(minPrice * ratio);
    const adjustedMax = Math.round(maxPrice * ratio);

    const seriesLength = graphData.length;
    const labelOffset = 3;
    const height = Math.abs(adjustedMax - adjustedMin);
    const width = seriesLength + labelOffset;
    const padding = "         ";

    const graph = new Array(height + 1);
    for (let i = 0; i <= height; i++) {
      graph[i] = new Array(width);
      for (let j = 0; j < width; j++) {
        graph[i][j] = " ";
      }
    }

    // Draw y axis labels
    for (let val = adjustedMin; val <= adjustedMax; ++val) {
      const labelValue =
        height > 0 ? maxPrice - ((val - adjustedMin) * range) / height : val;

      const decimal = labelValue < 1 ? 4 : labelValue < 1000 ? 2 : 0;
      const label = (padding + labelValue.toFixed(decimal)).slice(
        -padding.length
      );
      graph[val - adjustedMin][Math.max(labelOffset - label.length, 0)] = label;
      graph[val - adjustedMin][labelOffset - 1] = "┤";
    }

    const getPriceYIndex = (price: number) =>
      Math.round(price * ratio) - adjustedMin;

    // Draw graph
    for (let x = 0; x < seriesLength; x++) {
      const openingPriceIndex = getPriceYIndex(openingPrices[x]!);
      const closingPriceIndex = getPriceYIndex(closingPrices[x]!);
      const highestPriceIndex = getPriceYIndex(highestPrices[x]!);
      const lowestPriceIndex = getPriceYIndex(lowestPrices[x]!);
      const currentColumn = x + labelOffset;
      const colour =
        openingPriceIndex <= closingPriceIndex ? COLOURS.green : COLOURS.red;

      for (
        let i = height - highestPriceIndex;
        i <= height - lowestPriceIndex;
        ++i
      ) {
        // Draw candle body if inbetween opening and closing price
        if (
          (i <= height - openingPriceIndex &&
            i >= height - closingPriceIndex) ||
          (i >= height - openingPriceIndex && i <= height - closingPriceIndex)
        ) {
          graph[i][currentColumn] = `${colour}█${COLOURS.reset}`;
        } else {
          graph[i][currentColumn] = `${colour}|${COLOURS.reset}`; // Draw candle wick if not inbetween opening and closing price
        }
      }
    }

    console.log(graph.map((x) => x.join(" ")).join("\n"));
    console.log(
      `\n ${COLOURS.yellow}${coin}/${pair}\u001b[0m  ${interval} chart`
    );

    const priceChangeColour =
      parseInt(coinData.priceChangePercent) >= 0 ? COLOURS.green : COLOURS.red;

    console.log(
      `\n The current price for ${coin} is ${priceChangeColour}${coinData.lastPrice} ${pair} (${coinData.priceChangePercent}%)`
    );
  } catch (error) {
    console.log("Oh no! An error occured. \n");

    if (axios.isAxiosError(error)) {
      console.error(`Error: ${error.message} \n`);
    }

    console.log("Please try again!");
  }
})();

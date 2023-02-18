# coinchart

#### Display cryptocurrency candlestick charts in your terminal.

![screenshot](https://user-images.githubusercontent.com/8098110/219873326-f8c39078-e1f5-4485-97fb-803dd2d1c4fd.png)


## Installation

```bash
npm i -g coinchart
```

## Examples 


```bash
coinchart
```

Returns the default ie. BTC/USDT 1h interval chart.

```bash
coinchart eth
```

Returns ETH/USDT 1h interval chart.

```bash
coinchart ada -i 1d
```

Returns ADA/USDT 1d interval chart.

## Options

```bash
Options:
  -h, --help      Show help
  -i, --interval  Interval eg. 15m, 4h, 1d                       [default: "1h"]
  -p, --pair      Coin pairing eg. BTC, BNB, ETH               [default: "USDT"]
  -l, --limit     Number of candlesticks                           [default: 50]
  -r, --rows      Graph height in rows                             [default: 25]
  -v, --version   Show version number
```

## Contribute

Feel free to make a PR with any improvements or features.

## Acknowledgements

Thanks to [asciichart](https://www.npmjs.com/package/asciichart) for the inspiration.

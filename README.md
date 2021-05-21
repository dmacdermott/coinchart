# 💹 coinchart

### Display crypto candlestick charts in terminal

![screenshot](https://user-images.githubusercontent.com/8098110/119164477-70c94a00-ba97-11eb-8962-25900ea5a83f.png)

# 🛠 Installation

```bash
npm i coinchart
```

💁‍♂️ To make the most of this package, I recommend installing it globally.

```bash
npm i -g coinchart
```

# 👨‍💻 Usage

## Examples

### Basic Usage

```bash
coinchart
```

Returns the default ie. BTC/USDT 1h interval chart

```bash
coinchart eth
```

Returns ETH/USDT 1h interval chart

```bash
coinchart ada -i 1d
```

Returns ADA/USDT 1d interval chart

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

# 🏄‍♂️ Contribute

Feel free to contribute to make it even cooler!

# Acknowledgements

Thanks to [asciichart](https://www.npmjs.com/package/asciichart) for the inspiration.

import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Tus wallets:
const wallets = {
    usdt: "0x556CCE927de417c2782E05Be58316432937CC973",
    eth:  "0x556CCE927de417c2782E05Be58316432937CC973",
    btc:  "bc1qpmhcfx58gyucv4a6t7k4lz6nf3kqgzt2pdh2ld",
    trx:  "TJ8w9DZjBNyi13JfJ67bTzxuFkqajpM79q",
    ltc:  "ltc1qe6lakaugt5k0dhnjttf0x2k4mka06qxu477ejc"
};

// PACKS
const packs = {
    "50": 50,
    "250": 250,
    "500": 500
};

// Crear orden
app.post("/payment", (req, res) => {
    const { currency, pack } = req.body;

    if (!wallets[currency]) return res.json({ error: "Currency not found" });
    if (!packs[pack]) return res.json({ error: "Pack not found" });

    res.json({
        address: wallets[currency],
        amount: packs[pack],
        currency,
        pack
    });
});

// Verificar pago BTC
app.get("/check/btc/:address", async (req, res) => {
    const adr = req.params.address;

    const info = await fetch(
        `https://api.blockcypher.com/v1/btc/main/addrs/${adr}`
    ).then(r => r.json());

    const txs = info.txrefs || [];

    const confirmed = txs.some(tx => tx.confirmations >= 5);

    res.json({
        confirmed,
        confirmations: confirmed ? 5 : 0
    });
});

// Verificar pago ETH / USDT
app.get("/check/eth/:address", async (req, res) => {
    const adr = req.params.address;

    const info = await fetch(
        `https://api.etherscan.io/api?module=account&action=txlist&address=${adr}&startblock=0&endblock=99999999&sort=desc&apikey=YourAPIKey`
    ).then(r => r.json());

    const tx = info.result[0];

    if (!tx) return res.json({ confirmed: false });

    const confirmations = tx.confirmations || 0;

    res.json({
        confirmed: confirmations >= 5,
        confirmations
    });
});

// Verificar TRON (TRX / USDT TRC20)
app.get("/check/trx/:address", async (req, res) => {
    const adr = req.params.address;

    const info = await fetch(
        `https://api.trongrid.io/v1/accounts/${adr}/transactions`
    ).then(r => r.json());

    const tx = info.data?.[0];

    if (!tx) return res.json({ confirmed: false });

    const confirmed = tx.ret[0].contractRet === "SUCCESS";

    res.json({
        confirmed,
        confirmations: confirmed ? 5 : 0
    });
});

app.listen(3000, () => console.log("API on port 3000"));

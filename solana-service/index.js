// solana-service/index.js
// ╔══════════════════════════════════════════════════════════════════╗
// ║  SEEKHO Solana Microservice                                     ║
// ║  Handles SPL token minting & transfers for SEEKHO token (SKO)  ║
// ║  Deploy on Railway / Render / VPS alongside your Django backend ║
// ╚══════════════════════════════════════════════════════════════════╝

const express = require("express");
const {
  Connection, PublicKey, Keypair, Transaction,
  sendAndConfirmTransaction,
} = require("@solana/web3.js");
const {
  createTransferCheckedInstruction,
  getOrCreateAssociatedTokenAccount,
  getMint,
} = require("@solana/spl-token");
const bs58 = require("bs58");

const app = express();
app.use(express.json());

// ─── Config ───────────────────────────────────────────────────────────────────
const SOLANA_RPC = process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com";
const SEEKHO_TOKEN_MINT = process.env.SEEKHO_TOKEN_MINT; // Your deployed SPL mint address
const AUTHORITY_KEYPAIR_BASE58 = process.env.AUTHORITY_KEYPAIR; // Base58 secret key
const SERVICE_SECRET = process.env.SERVICE_SECRET; // Shared secret with Django backend
const PORT = process.env.PORT || 3001;

// ─── Auth middleware ──────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${SERVICE_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// ─── Transfer endpoint ────────────────────────────────────────────────────────
app.post("/transfer", authMiddleware, async (req, res) => {
  const { recipient, amount, token_mint } = req.body;

  if (!recipient || !amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid params" });
  }

  try {
    const connection = new Connection(SOLANA_RPC, "confirmed");

    // Authority keypair (holds the token authority)
    const authorityKeypair = Keypair.fromSecretKey(
      bs58.decode(AUTHORITY_KEYPAIR_BASE58)
    );

    const mintAddress = new PublicKey(token_mint || SEEKHO_TOKEN_MINT);
    const recipientPubkey = new PublicKey(recipient);

    // Get mint info for decimals
    const mintInfo = await getMint(connection, mintAddress);
    const decimals = mintInfo.decimals; // Typically 6 for SPL tokens

    // Get/create the authority's token account
    const authorityTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      authorityKeypair,
      mintAddress,
      authorityKeypair.publicKey
    );

    // Get/create recipient's token account
    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      authorityKeypair, // payer for account creation
      mintAddress,
      recipientPubkey
    );

    // Build transfer instruction
    const transferAmount = BigInt(amount) * BigInt(10 ** decimals);
    const instruction = createTransferCheckedInstruction(
      authorityTokenAccount.address,
      mintAddress,
      recipientTokenAccount.address,
      authorityKeypair.publicKey,
      transferAmount,
      decimals
    );

    const transaction = new Transaction().add(instruction);
    const txHash = await sendAndConfirmTransaction(
      connection,
      transaction,
      [authorityKeypair]
    );

    console.log(`✅ Transferred ${amount} SKO to ${recipient} | tx: ${txHash}`);
    res.json({ success: true, tx_hash: txHash, amount, recipient });

  } catch (err) {
    console.error("Transfer error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Balance check ────────────────────────────────────────────────────────────
app.get("/balance/:address", authMiddleware, async (req, res) => {
  try {
    const connection = new Connection(SOLANA_RPC, "confirmed");
    const pubkey = new PublicKey(req.params.address);
    const lamports = await connection.getBalance(pubkey);
    res.json({ sol: lamports / 1e9 });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/health", (_, res) => res.json({ ok: true, service: "seekho-solana" }));

app.listen(PORT, () => console.log(`🚀 Seekho Solana service running on :${PORT}`));

/*
 ╔══════════════════════════════════════════════════════════════════╗
 ║  DEPLOYMENT STEPS                                               ║
 ╠══════════════════════════════════════════════════════════════════╣
 ║                                                                 ║
 ║  1. Create your SPL token mint:                                 ║
 ║     spl-token create-token                                      ║
 ║     spl-token create-account <MINT>                             ║
 ║     spl-token mint <MINT> 1000000  ← initial supply            ║
 ║                                                                 ║
 ║  2. Set env vars:                                               ║
 ║     SEEKHO_TOKEN_MINT=<your mint address>                       ║
 ║     AUTHORITY_KEYPAIR=<base58 secret key of mint authority>     ║
 ║     SERVICE_SECRET=<random secret shared with Django>           ║
 ║     SOLANA_RPC=https://api.mainnet-beta.solana.com              ║
 ║                                                                 ║
 ║  3. Deploy: npm install && node index.js                        ║
 ║                                                                 ║
 ║  4. In Django .env:                                             ║
 ║     SOLANA_SERVICE_URL=https://your-service.railway.app/transfer║
 ║     SOLANA_SERVICE_SECRET=<same secret>                         ║
 ║     SEEKHO_TOKEN_MINT=<same mint address>                       ║
 ║                                                                 ║
 ╚══════════════════════════════════════════════════════════════════╝
*/

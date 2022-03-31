const express = require("express");
const crypto = require("crypto");
const cliProgress = require("cli-progress");

const PID = process.pid;

const LOOP_TIMES = 1e7;
const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

const app = express();

function log(msg) {
  console.log(`[${PID}]`, new Date(), msg);
}

function randomString() {
  return crypto.randomBytes(100).toString("hex");
}

app.get("/health-check", function healthCheck(req, res) {
  log("check my health");
  res.send("all good!\n");
});

app.get("/compute-sync", function computeSync(req, res) {
  log("computing sync!");
  bar1.start(LOOP_TIMES, 0);

  const hash = crypto.createHash("sha256");
  for (let i = 0; i < LOOP_TIMES; i++) {
    hash.update(randomString());
    bar1.update(i + 1);
  }

  bar1.stop();
  res.send(hash.digest("hex") + "\n");
});

const asyncUpdate = async (hash) => hash.update(randomString());
app.get("/compute-async", async function computeAsync(req, res) {
  log("computing async!");

  bar1.start(LOOP_TIMES, 0);
  const hash = crypto.createHash("sha256");

  for (let i = 0; i < LOOP_TIMES; i++) {
    await asyncUpdate(hash);
    bar1.update(i + 1);
  }

  bar1.stop();
  res.send(hash.digest("hex") + "\n");
});

// Set timeout
function setTimeoutPromise(delay) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), delay);
  });
}
app.get(
  "/compute-with-set-timeout",
  async function computeWSetTimeout(req, res) {
    log("async with setTimeout!");
    bar1.start(LOOP_TIMES, 0);

    const hash = crypto.createHash("sha256");
    for (let i = 0; i < LOOP_TIMES; i++) {
      hash.update(randomString());
      await setTimeoutPromise(0);
      bar1.update(i + 1);
    }

    bar1.stop();
    res.send(hash.digest("hex") + "\n");
  }
);

// Set Immediate
function setImmediatePromise() {
  return new Promise((resolve) => {
    setImmediate(() => resolve());
  });
}
app.get(
  "/compute-with-set-immediate",
  async function computeWSetImmediate(req, res) {
    log("async with setImmediate!");
    bar1.start(LOOP_TIMES, 0);

    const hash = crypto.createHash("sha256");
    for (let i = 0; i < LOOP_TIMES; i++) {
      hash.update(randomString());
      await setImmediatePromise();
      bar1.update(i + 1);
    }

    bar1.stop();
    res.send(hash.digest("hex") + "\n");
  }
);

const PORT = process.env.PORT || 1337;
app.listen(PORT, () => log("server listening on :" + PORT));

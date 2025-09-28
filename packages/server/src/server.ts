/*
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';

import { info } from './logger';

// Main update loop
const TICK = 1000 * 60 * 2; // Every two minute
const updateLoop = () => {
  info('Update loop');
  // TODO: Update everything
  setTimeout(updateLoop, TICK);
};
updateLoop();

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket: Socket) => {
  console.log('connected', socket.id);
  socket.send({ message: 'hello there' })
});

httpServer.listen(3000);
*/

import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import { PGliteDataAdapter } from 'data-adapter/src/pglite-data-adapter';
import { Engine } from 'engine/src/engine';
import { MAX_AGE, verifyAccessToken } from 'shared/src/auth';
import { NameError } from 'shared/src/errors';

const PORT = 3000;
const app = express();
const router = express.Router();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(verifyAccessToken);

const dataAdapter = new PGliteDataAdapter();
const engine = new Engine(dataAdapter);

router.post('/api/explore', async (req: any, res) => {
  const mage = await engine.getMageByUser(req.user.username);
  const { turns } = req.body;
  try {
    const landGained = await engine.exploreLand(mage, turns);
    res.status(200).json({ mage, landGained });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/api/geld', async (req: any, res) => {
  const mage = await engine.getMageByUser(req.user.username);
  const { turns } = req.body;
  const geldGained = await engine.gelding(mage, turns);
  res.status(200).json({ mage, geldGained });
});

router.post('/api/charge', async (req: any, res) => {
  const mage = await engine.getMageByUser(req.user.username);
  const { turns } = req.body;
  const manaGained = await engine.manaCharge(mage, turns);
  res.status(200).json({ mage, manaGained });
});

router.post('/api/build', async (req: any, res) => {
  const mage = await engine.getMageByUser(req.user.username);
  const payload = req.body;
  try {
    await engine.build(mage, payload);
    res.status(200).json({ mage });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/api/destroy', async (req: any, res) => {
  const mage = await engine.getMageByUser(req.user.username);
  const payload = req.body;
  try {
    await engine.destroy(mage, payload);
    res.status(200).json({ mage });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/api/ranklist', async (_req: any, res) => {
  const rankList = await engine.rankList('');
  res.status(200).json({ rankList });
});

router.post('/api/spell', async (req: any, res) => {
  const mage = await engine.getMageByUser(req.user.username);
  const { spellId, num, target } = req.body;
  const result = await engine.castSpell(mage, spellId, num, target);
  res.status(200).json({ result, mage });
});

router.post('/api/dispel', async (req: any, res) => {
  const mage = await engine.getMageByUser(req.user.username);
  const { enchantId, mana } = req.body;
  const result = await engine.dispel(mage, enchantId, mana);
  res.status(200).json({ result, mage });
});

router.post('/api/defence-assignment', async (req: any, res) => {
  const mage = await engine.getMageByUser(req.user.username);
  const assignment = req.body;

  await engine.setAssignment(mage, assignment);
  res.status(200).json({ mage });
});

router.post('/api/recruitments', async (req: any, res) => {
  const mage = await engine.getMageByUser(req.user.username);
  const body = req.body;

  await engine.setRecruitments(mage, body.recruitments);
  res.status(200).json({ mage });
});

router.post('/api/disband', async (req: any, res) => {
  const mage = await engine.getMageByUser(req.user.username);
  const body = req.body;

  await engine.disbandUnits(mage, body.disbands);
  res.status(200).json({ mage });
});

router.post('/api/item', async (req: any, res) => {
  const mage = await engine.getMageByUser(req.user.username);
  const { itemId, num, target } = req.body;
  const r = await engine.useItem(mage, itemId, num, target);
  res.status(200).json({ r, mage });
});


router.post('/api/research', async (req: any, res) => {
  const mage = await engine.getMageByUser(req.user.username);
  const { magic, focus, turns } = req.body;
  const result = await engine.research(mage, magic, focus, turns);
  res.status(200).json({ result, mage });
});

router.post('/api/war', async (req: any, res) => {
  const mage = await engine.getMageByUser(req.user.username);
  const { spellId, itemId, stackIds, targetId, battleType } = req.body;

  // Do not proceed if there are errors
  const errors = await engine.preBattleCheck(mage, +targetId, battleType);
  if (errors.length > 0) {
    res.status(200).json({ errors, reportId: null, mage });
    return;
  }

  const r = await engine.doBattle(mage, +targetId, battleType, stackIds, spellId, itemId);
  res.status(200).json({ errors: [], reportId: r.id, mage });
});

router.get('/api/report/:id', async (req: any, res) => {
  const mage = await engine.getMageByUser(req.user.username);
  const reportId = req.params.id;
  const report = await engine.getBattleReport(mage, reportId);
  res.status(200).json({ report });
});

router.get('/api/mage-battles', async (req: any, res) => {
  const mage = await engine.getMageByUser(req.user.username);
  const battles = await engine.getMageBattles(mage);
  res.status(200).json({ battles });
});


router.get('/api/chronicles', async (req: any, res) => {
  const mage = await engine.getMageByUser(req.user.username);
  const chronicles = await engine.getChronicles(mage);
  res.status(200).json({ chronicles });
})


router.post('/api/register', async (req, res) => {
  const { username, password, magic } = req.body;

  try {
    const { user, mage } = await engine.register(username, password, magic);
    res.cookie('amr-jwt', user.token, {
      httpOnly: true,
      maxAge: MAX_AGE * 1000
    });
    res.status(200).json(mage);
  } catch (err) {
    if (err instanceof NameError) {
      res.status(409).json({ error: err.message });
    }
  }
});

router.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const { user, mage } = await engine.login(username, password);

  if (!user || !mage) {
    return res.status(200).json(null);
  }

  res.cookie('amr-jwt', user.token, {
    httpOnly: true,
    maxAge: MAX_AGE * 1000
  });
  res.status(200).json(mage);
});

router.post('/api/logout', async (req, res) => {
  res.clearCookie('amr-jwt');
  res.status(200).json({})
});


router.get('/api/mage', async (req: any, res) => {
  console.log('cookies!!! ', req.user.username);
  const mage = await engine.getMageByUser(req.user.username);
  res.status(200).json({ mage });
});

router.get('/api/mage/:id', async (req: any, res) => {
  const id = +(req.params.id);
  const mage = await engine.getMageSummary(id);
  res.status(200).json({ mageSummary: mage });
});

router.post('/api/mages', async (req: any, res) => {
  const { ids } = req.body;
  const mages = await engine.getMages(ids);
  res.status(200).json({ mages });
});

router.get('/api/game-table', async (_req: any, res) => {
  const settings = await engine.getGameTable();
  res.status(200).json(settings);
});

router.get('/api/server-clock', async (_req: any, res) => {
  const clock = await engine.getServerClock();
  res.status(200).json(clock);
});

router.get('/api/market-items', async (_req, res) => {
  const result = await engine.getMarketItems();
  res.status(200).json(result);
});

router.get('/api/market-bids/:priceId', async (req, res) => {
  const id = req.params.priceId;
  const result = await engine.getMarketBids(id);
  res.status(200).json(result);
});

router.post('/api/market-bids', async (req: any, res) => {
  const bids = req.body;
  const mage = await engine.getMageByUser(req.user.username);
  await engine.makeMarketBids(mage.id, bids);

  res.status(200).json({});
});

// router.route('/api/test').get(verifyAccessToken, async (req: any, res) => {
//   console.log('cookies!!! ', req.user);
//   res.status(200).json({ user: req.user });
// });

app.use(router);

app.listen(PORT, ()=>{
  console.log(`App is listening on port ${PORT}`);
  console.log('================================');
  console.log('Archmage Reimagined');
  console.log('================================');
});

async function run() {
  await dataAdapter.initialize();
  await engine.initialize();
}

run();

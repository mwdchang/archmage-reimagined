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

import { SimpleDataAdapter } from 'data-adapter/src/simple-data-adapter';
import { Engine } from 'engine/src/engine';
import { MAX_AGE, verifyAccessToken } from 'shared/src/auth';

const PORT = 3000;
const app = express();
const router = express.Router();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(verifyAccessToken);

const engine = new Engine(new SimpleDataAdapter());

router.post('/api/explore', async (req: any, res) => {
  const mage = engine.getMageByUser(req.user.username);
  const { turns } = req.body;
  const landGained = await engine.exploreLand(mage, turns);
  res.status(200).json({ mage, landGained });
});

router.post('/api/geld', async (req: any, res) => {
  const mage = engine.getMageByUser(req.user.username);
  const { turns } = req.body;
  const geldGained = await engine.gelding(mage, turns);
  res.status(200).json({ mage, geldGained });
});

router.post('/api/charge', async (req: any, res) => {
  const mage = engine.getMageByUser(req.user.username);
  const { turns } = req.body;
  const manaGained = await engine.manaCharge(mage, turns);
  res.status(200).json({ mage, manaGained });
});

router.post('/api/build', async (req: any, res) => {
  const mage = engine.getMageByUser(req.user.username);
  const payload = req.body;
  await engine.build(mage, payload);
  res.status(200).json({ mage });
});

router.post('/api/destroy', async (req: any, res) => {
  const mage = engine.getMageByUser(req.user.username);
  const payload = req.body;
  await engine.destroy(mage, payload);
  res.status(200).json({ mage });
});

router.get('/api/ranklist', async (_req: any, res) => {
  const rankList = await engine.rankList('');
  res.status(200).json({ rankList });
});

router.post('/api/spell', async (req: any, res) => {
  const mage = engine.getMageByUser(req.user.username);
  const { spellId, num, target } = req.body;
  const r = await engine.castSpell(mage, spellId, num, target);
  res.status(200).json({ r, mage });
});

router.post('/api/defence-assignment', async (req: any, res) => {
  const mage = engine.getMageByUser(req.user.username);
  const assignment = req.body;

  await engine.setAssignment(mage, assignment);
  res.status(200).json({ mage });
});

router.post('/api/item', async (req: any, res) => {
  const mage = engine.getMageByUser(req.user.username);
  const { itemId, num, target } = req.body;
  const r = await engine.useItem(mage, itemId, num, target);
  res.status(200).json({ r, mage });
});


router.post('/api/research', async (req: any, res) => {
  const mage = engine.getMageByUser(req.user.username);
  const { magic, focus, turns } = req.body;
  const r = await engine.research(mage, magic, focus, turns);
  res.status(200).json({ r, mage });

});

router.post('/api/war', async (req: any, res) => {
  const mage = engine.getMageByUser(req.user.username);
  const { spellId, itemId, stackIds, targetId } = req.body;
  const r = await engine.doBattle(mage, +targetId, stackIds, spellId, itemId);
  res.status(200).json({ reportId: r.id, mage });
});

router.get('/api/report/:id', async (req, res) => {
  const mage = engine.getMageByUser(req.user.username);
  const reportId = req.params.id;
  const report = await engine.getBattleReport(mage, reportId);
  res.status(200).json({ report });
});

router.get('/api/mage-battles', async (req, res) => {
  const mage = engine.getMageByUser(req.user.username);
  const battles = await engine.getMageBattles(mage);
  console.log('battles', battles);
  res.status(200).json({ battles });
});

router.post('/api/register', async (req, res) => {
  const { username, password, magic } = req.body;
  const { user, mage } = await engine.register(username, password, magic);
  res.cookie('amr-jwt', user.token, {
    httpOnly: true,
    maxAge: MAX_AGE * 1000
  });
  res.status(200).json(mage);
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

router.get('/api/mage', async (req: any, res) => {
  console.log('cookies!!! ', req.user.username);
  const mage = engine.getMageByUser(req.user.username);
  res.status(200).json({ mage });
});

router.get('/api/mage/:id', async (req: any, res) => {
  const id = +(req.params.id);
  const mage = engine.getMageSummary(id);
  res.status(200).json({ mageSummary: mage });
});


// router.route('/api/test').get(verifyAccessToken, async (req: any, res) => {
//   console.log('cookies!!! ', req.user);
//   res.status(200).json({ user: req.user });
// });

app.use(router);

app.listen(PORT, ()=>{
  console.log(`App is listening on port ${PORT}`);
});


import { Engine } from 'engine/src/engine';
import { PGliteDataAdapter } from 'data-adapter/src/pglite-data-adapter';
import { SimpleDataAdapter } from 'data-adapter/src/simple-data-adapter';


const dataAdapter = new PGliteDataAdapter();
const engine = new Engine(dataAdapter, true);

async function run() {
  await dataAdapter.initialize();
  await engine.initialize(true);

  let mage1 = (await engine.register('mage1', 'mage1', 'verdant', {
    currentGeld: 500
  })).mage;

  let mage2 = (await engine.register('mage2', 'mage2', 'verdant', {
    currentGeld: 500
  })).mage;

  await engine.adapter.addMarketItem({
    id: 'xyz',
    priceId: 'carpetOfFlying',
    basePrice: 100,
    expiration: 2
  });

  await engine.makeMarketBids(mage1.id, [{ marketId: 'xyz', bid: 200 }]);
  await engine.makeMarketBids(mage2.id, [{ marketId: 'xyz', bid: 191 }]);

  await engine.updateLoop();
  await engine.updateLoop();

  mage1 = await engine.getMage(mage1.id);
  mage2 = await engine.getMage(mage2.id);

  console.log('mage1')
  console.log(mage1.currentGeld, mage1.items);

  console.log('mage2')
  console.log(mage2.currentGeld, mage2.items);
}


run();

import { Engine } from 'engine/src/engine';
import { PGliteDataAdapter } from 'data-adapter/src/pglite-data-adapter';
import { SimpleDataAdapter } from 'data-adapter/src/simple-data-adapter';


const dataAdapter = new SimpleDataAdapter();
const engine = new Engine(dataAdapter, true);

async function run() {
  await dataAdapter.initialize();
  await engine.initialize();

  const mage1 = (await engine.register('mage1', 'mage1', 'verdant', {
    currentGeld: 50000000
  })).mage;

  const mage2 = (await engine.register('mage2', 'mage2', 'verdant', {
    currentGeld: 50000000
  })).mage;

  await engine.adapter.addMarketItem({
    id: 'xyz',
    itemId: 'carpetOfFlying',
    basePrice: 100,
    expiration: 2
  });

  await engine.adapter.addMarketBid({
    id: 'xyz',
    mageId: mage1.id,
    bid: 190
  })
  
  await engine.adapter.addMarketBid({
    id: 'xyz',
    mageId: mage2.id,
    bid: 191
  })


  await engine.updateLoop();
  await engine.updateLoop();
}


run();

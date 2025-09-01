## Archmage Reimagined
Archmage Reimagined is both a modern take and a re-imagination of the  classic online MMORPG game "Archmage: Reincarnation from Hell".

Archmage was a rich and complex game enjoyed by those who likes deep strategy games. It began in the early 2000s and had kept a cult-following until this day. The player incarnate a mage from amongst five factions, each with its own unique strengths and weakensses, and comp]ete to become to greatest mage on Terra.


### Development
You will need to meet the following prerequisites
- nodeJS version 20 or higher
- yarn version 1.22.19 or higher

Code is written in [Typescript](https://www.typescriptlang.org/), with the UI written in [Vue 3](https://vuejs.org/).

#### Running locally
This setup has been tested on \*nix-based machines, it should work on Windows with a few tweaks to setup.sh file.
- In the project folder, run `yarn`
- Run `setup.sh` to link mono repo resources
- Running the server `yarn run dev`, server should be listening on http://localhost:3000
- Running the client `yarn run dev`, client should be running on http://localhost:9000


#### Organizational structure
- packages/shared: Shared utilities, types
- packages/data: Units, spells, and items files
- packages/data-adapter: Data stroage adapters
- packages/engine: Game engine
- packages/server: Game server, REST server in Express
- packages/client: Game client


### Acknowledgement
Much of this project is inspired by other Archmage-like projects, if you are interested in playing the game closer to the original, please check them out:
- [TheLord Archmage](https://www.thelord.cl/)
- [The Reincarnation](https://www.the-reincarnation.com/)

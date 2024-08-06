## Archmage Reimagined
Archmage Reimagined is both a modern take and a re-imagination of the  classic online MMORPG game "Archmage: Reincarnation from Hell".

Archmage was a rich and complex game enjoyed by those who likes deep strategy games. However, it is not easy to play, especialy for new players and those with limited time. This project will address these limitations and introduce new ideas to keep the game fresh.

### Development
You will need to meet the following prerequisites
- nodeJS version 20 or higher
- yarn version 1.22.19 or higher

Code is written in [Typescript](https://www.typescriptlang.org/), with the UI written in [Vue 3](https://vuejs.org/).

#### Running locally
This setup has been tested on \*nix-based machines, it should work on Windows with a few tweaks to setup.sh file.
- In the project folder, run `yarn`
- Run `setup.sh` to link mono repo resources
- Running the server `yarn run server`, server should be listening on http://localhost:3000
- Running the client `yarn run dev`, client should be running on http://localhost:9000


#### Organizational structure
- packages/shared: Shared utilities, types
- packages/data: Unit and spell files
- packages/data-adapter: I/O
- packages/engine: Game engine
- packages/server: Game server
- packages/client: Game client


### Acknowledgement
Much of this project is inspired by other Archmage-like projects, if you are interested in playing the game closer to the original, please check them out:
- [TheLord Archmage](https://www.thelord.cl/)
- [The Reincarnation](https://www.the-reincarnation.com/)

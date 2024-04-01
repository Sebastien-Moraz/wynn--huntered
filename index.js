import wynn from 'wynn-api-node';

const pseudo = "Azypas";

async function getPlayerCharacterList(pseudo) {
    return await wynn.getPlayerCharacterList(pseudo).then((characters) => {
        return characters;
    });
}

async function getPlayer(pseudo) {
    return await wynn.getPlayer(pseudo).then((player) => {
        return player;
    });
}


async function getCurrentCharacter(pseudo) {
    const player = await getPlayer(pseudo);
    const characters = await getPlayerCharacterList(pseudo);
    // Get the current character
    for (let i = 0; i < characters.length; i++) {
        if (Reflect(characters[i]).name() === player.currentCharacter) {
            var currentCharacter = characters[i];
        }
    }
    return currentCharacter;
}

console.log(await getCurrentCharacter(pseudo));
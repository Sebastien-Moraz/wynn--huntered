import wynn from 'wynn-api-node';

const pseudo = "Myiro";

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

async function getPlayerUUID(pseudo) {
    const player = await getPlayer(pseudo);
    return player.uuid;
}

async function getPlayersOnServer(serverName) {
    return await wynn.getOnlinePlayers("uuid", serverName).then((players) => {
        return Object.keys(players.players);
    });
}

async function getLocation(pseudo) {
    const player = await getPlayer(pseudo);
    return await wynn.getPlayerLocations(player.uuid).then((location) => {
        const loc = location.find((loc) => loc.uuid === player.uuid);
        try {
            return {
                x: loc.x,
                y: loc.y,
                z: loc.z,
                server: loc.server
            }
        } catch {
            return "location not found";
        }
    });
}


async function getCurrentCharacter(pseudo) {
    const player = await getPlayer(pseudo);
    const characters = await getPlayerCharacterList(pseudo);
    return characters[player.activeCharacter]
}

async function isOnline(pseudo) {
    const player = await getPlayer(pseudo);
    return (player.online);
}
async function getServer(pseudo) {
    const loc = await getLocation(pseudo)
    return loc.server;
}

async function getPlayersIsHunter(playersUUID) {
    const playersPromises = playersUUID.map(async (uuid) => {
        const player = await getPlayer(uuid);
        const currentCharacter = await getCurrentCharacter(player.uuid)
        if (player.online && currentCharacter.gamemode.includes("hunted")) {
            return {
                player: player,
                character: currentCharacter
            }
        }
    });
    const players = await Promise.all(playersPromises);
    return players.filter(Boolean)
}

async function getRisquedHunter(pseudo) {
    const playerPromise = getPlayer(pseudo);
    const huntersPromise = getPlayersIsHunter(await getPlayersOnServer(await getServer(pseudo)))
    const playerCharacterPromise = getCurrentCharacter(pseudo);
    const playerLocationPromise = getLocation(pseudo);
    const player = await playerPromise;
    let hunters = await huntersPromise;
    //hunters = hunters.filter((hunter) => hunter.player.uuid !== player.uuid);
    const playerCharacter = await playerCharacterPromise;

    //check if hunter have a level to -10 or +10 of the player
    hunters = hunters.filter((hunter) => {
        return (Math.abs(hunter.character.level - playerCharacter.level) < 10)
    });

    const playerLocation = await playerLocationPromise;

    //get the distance between the player and the hunter to async
    const huntersPromises = hunters.map(async (hunter) => {
        const hunterLocation = await getLocation(hunter.player.name);
        return {
            hunter: hunter,
            distance: Math.sqrt((playerLocation.x - hunterLocation.x) ** 2 + (playerLocation.y - hunterLocation.y) ** 2 + (playerLocation.z - hunterLocation.z) ** 2)
        }
    });
    hunters = await Promise.all(huntersPromises);

    //filter the hunter to get the closest one
    hunters = hunters.sort((a, b) => a.distance - b.distance);
    return hunters;
}


console.log(await getRisquedHunter(pseudo));
//console.log(await getPlayerCharacterList(pseudo));
//console.log(await getPlayersOnServer(await getServer(pseudo)));
//console.log(await getPlayersIsHunter(await getPlayersOnServer(await getServer(pseudo))));
//console.log(await getServer(pseudo));
//console.log(await isOnline(pseudo));
//console.log(await getCurrentCharacter(pseudo));
//console.log(await getLocation(pseudo));
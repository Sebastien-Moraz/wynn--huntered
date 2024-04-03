import wynn from 'wynn-api-node';

//get a username in argument
const pseudo = process.argv[2];
let serverPlayersList = [];

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
        if (!players.players) {
            return serverPlayersList;
        }else {
            serverPlayersList = Object.keys(players.players);
            return serverPlayersList;
        }
    });
}

async function getLocation(pseudo) {
    const player = await getPlayer(pseudo);
    return await wynn.getPlayerLocations().then((location) => {
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
    const player = await getPlayer(pseudo);
    return player.server;
}

async function getPlayersIsHunter(playersUUID) {
    const playersPromises = playersUUID.map(async (uuid) => {
        const player = await getPlayer(uuid);
        const currentCharacter = await getCurrentCharacter(player.uuid)
        try {
            if (player.online && currentCharacter.gamemode.includes("hunted")) {
                return {
                    player: player,
                    character: currentCharacter
                }
            }
        } catch {
            return;
        }
    });
    const players = await Promise.all(playersPromises);
    return players.filter(Boolean)
}

async function getRisquedHunter(pseudo) {
    try {
    const playerPromise = getPlayer(pseudo);
    const huntersPromise = getPlayersIsHunter(await getPlayersOnServer(await getServer(pseudo)))
    const playerCharacterPromise = getCurrentCharacter(pseudo);
    const player = await playerPromise;
    let hunters = await huntersPromise;
    hunters = hunters.filter((hunter) => hunter.player.uuid !== player.uuid);
    const playerCharacter = await playerCharacterPromise;

    //check if hunter have a level to -10 or +10 of the player
    hunters = hunters.filter((hunter) => {
        return (Math.abs(hunter.character.level - playerCharacter.level) < 10)
    });
    return hunters;
    } catch {
        return "error";
    }
}

function timeSince(date) {
    const now = new Date();
    const elapsed = now - date;

    const days = Math.floor(elapsed / (1000 * 60 * 60 * 24));
    const hours = Math.floor((elapsed % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));

    let timeAgo;
    if (days > 0) {
        timeAgo = `${days} days ago`;
    } else if (hours > 0) {
        timeAgo = `${hours} hours ago`;
    } else {
        timeAgo = `${minutes} minutes ago`;
    }

    return `${date.toLocaleDateString()} (${timeAgo})`;
}

function promoteHunter() {
    try {
        getRisquedHunter(pseudo).then((hunters) => {
            console.clear();
            if (hunters.length === 0) {
                console.log("Relax, no hunters are near you.");
                return;
            }

            console.log("Risqued hunters:");     
            hunters.forEach((hunter) => {
                const playerInfo = {
                    username: hunter.player.username,
                    rank: hunter.player.rank,
                    firstJoin: timeSince(new Date(hunter.player.firstJoin)),
                    lastJoin: timeSince(new Date(hunter.player.lastJoin)),
                    playtime: hunter.player.playtime,
                };
                const characterInfo = {
                    type: hunter.character.type,
                    level: hunter.character.level,
                    xp: hunter.character.xp,
                    totalLevel: hunter.character.totalLevel,
                };
                console.table({ ...playerInfo, ...characterInfo });
            });
        });
    } catch (error) {
        console.error(error);
    }
}

promoteHunter();
setInterval(() => {
    promoteHunter();
}, 1000 * 60);

//console.log(await getPlayerCharacterList(pseudo));
//console.log(await getPlayersOnServer(await getServer(pseudo)));
//console.log(await getPlayersIsHunter(await getPlayersOnServer(await getServer(pseudo))));
//console.log(await getServer(pseudo));
//console.log(await isOnline(pseudo));
//console.log(await getCurrentCharacter(pseudo));
//console.log(await getLocation(pseudo));
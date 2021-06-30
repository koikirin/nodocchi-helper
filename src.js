
/*

starttime
during

akaari
- 0
- 1

kuitanari
- 0
- 1

sctype
- a Lobby
- b Rank
- c Rank Higher?

playerlevel
- 0 Normal
- 1 Upper
- 2 Super
- 3 Phonex

playlength
- 1 Half
- 2 Full

playernum
- 3
- 4

player$#
player$#ptr


url
tw
rate



*/

/* Define Node JS */
const fetch = require("node-fetch");
/* */


class TenhouHelper {

  static get pts() {
    return [
      ["新人", 0, 20],
      ["９級", 0, 20],
      ["８級", 0, 20],
      ["７級", 0, 20],
      ["６級", 0, 40],
      ["５級", 0, 60],
      ["４級", 0, 80],
      ["３級", 0, 100],
      ["２級", 0, 100],
      ["１級", 0, 100],
      ["初段", 200, 400],
      ["二段", 400, 800],
      ["三段", 600, 1200],
      ["四段", 800, 1600],
      ["五段", 1000, 2000],
      ["六段", 1200, 2400],
      ["七段", 1400, 2800],
      ["八段", 1600, 3200],
      ["九段", 1800, 3600],
      ["十段", 2000, 4000],
      ["天鳳位", 0, 0],
    ]
  }

  static get max_level() {
    return 20;
  }

  constructor(playernum, playlength) {
    this.playernum = playernum;
    this.playlength = playlength;
    this.pts = TenhouHelper.pts;

    const f_length = x => this.playlength == 2 ? x*1.5 : x;

    this.dpts = [
      0, 0, 0, 0, 0, 0, 0, 0, 
      -10, -20, -30, -40, -50, -60, -70, -80, -90, -100, -110, -120, 0
    ].map(f_length);

    if (this.playernum == 4) {
      this.dpts_match = [
        [20, 10].map(f_length),
        [40, 10].map(f_length),
        [50, 20].map(f_length),
        [60, 30].map(f_length),
      ];
    } else {
      this.dpts_match = [
        30, 50, 70, 90
      ].map(f_length);
    }
  } 
};

function range(size, startAt = 0) {
  return [...Array(size).keys()].map(i => i + startAt);
}

function stringify_ranks(ranks) {
  return `[${TenhouHelper.pts[ranks[4].level][0]} ${ranks[4].pt}/${TenhouHelper.pts[ranks[4].level][2]}][${TenhouHelper.pts[ranks[3].level][0]} ${ranks[3].pt}/${TenhouHelper.pts[ranks[3].level][2]}]`
}


const tenhous = {
  4: {
    1: new TenhouHelper(4, 1),
    2: new TenhouHelper(4, 2),
  },
  3: {
    1: new TenhouHelper(3, 1),
    2: new TenhouHelper(3, 2),
  },
}

async function fetchGameListFromNodochi(username) {
  let resp = await(await fetch(`https://nodocchi.moe/api/listuser.php?name=${encodeURI(username)}`, {
    method: 'GET',
    headers: {
      referer: 'https://nodocchi.moe/'
    }
  })).text();
  gamelist = JSON.parse(resp);
  return gamelist.list;
}

function filterCurrentAccountGameList(gamelist) {
  let curTime = Math.floor(new Date().getTime() / 1000);
  const accountPeriod = 180 * 24 * 60 * 60;
  let i;
  for(i = gamelist.length - 1; i >= 0; i--) {
    const game = gamelist[i];
    // console.log(`${game.starttime} ${curTime}`)
    if (curTime - game.starttime > accountPeriod) break
    curTime = game.starttime;
  }
  let newGamelist = gamelist.slice(i+1, gamelist.length)
  return newGamelist;
}

function solveRankFromGameList(gamelist, username) {
  let ranks = {
    username: username,
    4: {
      level: 0,
      pt: 0,
      rank: 0
    },
    3: {
      level: 0,
      pt: 0,
      rank: 0
    }
  };

  function update_rank(game, place) {
    const tenhou = tenhous[game.playernum][game.playlength];

    if (ranks[game.playernum].level == tenhou.max_level) return;

    let dpt = 0;
    if (place == 1 && game.playernum == 4) dpt = tenhou.dpts_match[game.playerlevel][0];
    else if (place == 1 && game.playernum == 3) dpt = tenhou.dpts_match[game.playerlevel];
    else if (place == 2 && game.playernum == 4) dpt = tenhou.dpts_match[game.playerlevel][1];
    else if (place == 3 && game.playernum == 3) dpt = tenhou.dpts[ranks[game.playernum].level];
    else if (place == 4) dpt = tenhou.dpts[ranks[game.playernum].level];
    ranks[game.playernum].pt += dpt;
    if (ranks[game.playernum].pt >= tenhou.pts[ranks[game.playernum].level][2]) {
      // Level Up
      ranks[game.playernum].level += 1;
      ranks[game.playernum].pt = tenhou.pts[ranks[game.playernum].level][1];
    } else if (ranks[game.playernum].pt < 0) {
      // Level Down
      ranks[game.playernum].level -= 1;
      ranks[game.playernum].pt = tenhou.pts[ranks[game.playernum].level][1];
    }
  }

  gamelist.forEach(game => {
    if (['b', 'c'].includes(game.sctype)) {
      let place = 0;
      for (const i of range(parseInt(game.playernum), 1)) {
        if (game[`player${i}`] == username) {
          place = i;
          break;
        }
      }
      if (!place) return;
      update_rank(game, place);
    }
  })
  return ranks;
}


async function getCurrentRank(username) {
  let gamelist = await fetchGameListFromNodochi(username);
  gamelist = filterCurrentAccountGameList(gamelist);
  let ranks = solveRankFromGameList(gamelist, username);
  return ranks;
}


module.exports = {
  getCurrentRank: getCurrentRank,
  stringify_ranks: stringify_ranks
}
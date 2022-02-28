
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



/*
v1
v2
v3

*/

class TenhouHelper {

  get pts() {
    if (this.version >= 3)
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
        ["天鳳位", 2200, 4400],
      ]
    else
    return [
      ["新人", 0, 30],
      ["９級", 0, 30],
      ["８級", 0, 30],
      ["７級", 0, 60],
      ["６級", 0, 60],
      ["５級", 0, 60],
      ["４級", 0, 90],
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
      ["天鳳位", 2200, 4400],
    ]
  }

  static get max_level() {
    return 20;
  }

  constructor(playernum, playlength, version) {
    this.playernum = playernum;
    this.playlength = playlength;
    this.version = version;

    /* v1: ser=1, v2,v3: ser=1.5 */
    const f_length = x => this.playlength == 2 ? x*(version >= 2 ? 1.5 : 1) : x;

    this.dpts = [
      0, 0, 0, 0, 0, 0, 0, 0, 
      -10, -20, -30, -40, -50, -60, -70, -80, -90, -100, -110, -120, 0
    ].map(f_length);

    if (this.playernum == 4) {
      if (version >= 3)
        this.dpts_match = [
          [20, 10].map(f_length),
          [40, 10].map(f_length),
          [50, 20].map(f_length),
          [60, 30].map(f_length),
        ];
      else 
        this.dpts_match = [
          [30, 0].map(f_length),
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

function stringify_ranks(ranks, highest=false) {
  prefix = highest ? "h" : "";
  return `[${get_tenhou(4).pts[ranks[prefix+4].level][0]} ${ranks[prefix+4].pt}/${get_tenhou(4).pts[ranks[prefix+4].level][2]}][${get_tenhou(3).pts[ranks[prefix+3].level][0]} ${ranks[prefix+3].pt}/${get_tenhou(3).pts[ranks[prefix+3].level][2]}]`
}


const tenhous = {}


Array(3, 4).forEach(i => {
  [1, 2].forEach(j => {
    [1, 2, 3].forEach(v => {
      tenhous[`${i}.${j}.${v}`] = new TenhouHelper(i, j, v)
    })
  })
})

function get_tenhou(playernum, playlength=2, time=2508792400) {
  if (time < 1220194800) version = 1
  else if (time < 1508792400) version = 2
  else version = 3
  return tenhous[`${playernum}.${playlength}.${version}`]
}


async function fetchGameListFromNodochi(username) {
  let url = `https://nodocchi.moe/api/listuser.php?name=` + encodeURIComponent(username)
  let resp = await(await fetch(url, {
    method: 'GET',
    headers: {
      referer: 'https://nodocchi.moe/',
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7"
    }
  })).text();
  gamelist = JSON.parse(resp);
  return gamelist.list;
}

function splitAccountGameList(gamelist) {
  let result = [];
  let curTime = 0;
  const accountPeriod = 180 * 24 * 60 * 60;
  let i;
  for(i = gamelist.length - 1; i >= 0; i--) {
    const game = gamelist[i];
    if (curTime - game.starttime > accountPeriod) {
    result.push(gamelist.slice(i+1, gamelist.length))
      gamelist = gamelist.slice(0, i+1)
    }
    curTime = game.starttime;
  }
  if (gamelist.length > 0) result.push(gamelist)
  result.reverse()
  return result;
}

// function filterCurrentAccountGameList(gamelist) {
//   let curTime = Math.floor(new Date().getTime() / 1000);
//   let lastLevelCheck = false;
//   const accountPeriod = 180 * 24 * 60 * 60;
//   let i;
//   for(i = gamelist.length - 1; i >= 0; i--) {
//     const game = gamelist[i];
//     // console.log(`${game.starttime} ${curTime}`)
//     if (lastLevelCheck && curTime - game.starttime > accountPeriod) break
//     curTime = game.starttime;
//     if (game.playerlevel == 3) lastLevelCheck = false;
//     if (game.playerlevel == 0 || game.playerlevel == 1) lastLevelCheck = true;
//   }
//   let newGamelist = gamelist.slice(i+1, gamelist.length)
//   return newGamelist;
// }

function setupRanks(username) {
  let ranks = {
    username: username,
    4: {
      level: 0,
      pt: 0,
      rate: 0,
      time: 0,
      time_phoenix: 0,
    },
    3: {
      level: 0,
      pt: 0,
      rate: 0,
      time: 0,
      time_phoenix: 0,
    },
    h4: {
      level: 0,
      pt: 0,
      rate: 0,
      time: 0
    },
    h3: {
      level: 0,
      pt: 0,
      rate: 0,
      time: 0
    },
  };
  return ranks;
}

function solveRankFromGameList(gamelist, username, base_ranks) {

  let ranks = setupRanks(username);
  if (base_ranks != undefined) ranks = base_ranks;

  function update_rank(game, place) {
    const tenhou = get_tenhou(game.playernum, game.playlength, game.starttime);

    if (ranks[game.playernum].level == tenhou.max_level) return;

    if (game.playerlevel == 3 && ranks[game.playernum].level < 15) {
      console.log(ranks, game)
      throw 1;
    }
    if (game.playerlevel == 2 && ranks[game.playernum].level < 12) {
      console.log(ranks, game)
      throw 2;
    }
    let dpt = 0;
    if (place == 1 && game.playernum == 4) dpt = tenhou.dpts_match[game.playerlevel][0];
    else if (place == 1 && game.playernum == 3) dpt = tenhou.dpts_match[game.playerlevel];
    else if (place == 2 && game.playernum == 4) dpt = tenhou.dpts_match[game.playerlevel][1];
    else if (place == 3 && game.playernum == 3) dpt = tenhou.dpts[ranks[game.playernum].level];
    else if (place == 4) dpt = tenhou.dpts[ranks[game.playernum].level];
    if (ranks[game.playernum].level == 20) dpt = 0;
    ranks[game.playernum].pt += dpt;
    // console.log(`${JSON.stringify(game)}  ${stringify_ranks(ranks)} ${dpt}`)
    if (ranks[game.playernum].pt >= tenhou.pts[ranks[game.playernum].level][2]) {
      // Level Up
      ranks[game.playernum].level += 1;
      ranks[game.playernum].pt = tenhou.pts[ranks[game.playernum].level][1];
    } else if (ranks[game.playernum].pt < 0) {
      // Level Down
      if (ranks[game.playernum].level < 10)
        // No Level Down before 初段
        ranks[game.playernum].pt = 0;
      else {
        ranks[game.playernum].level -= 1;
        ranks[game.playernum].pt = tenhou.pts[ranks[game.playernum].level][1];
      }
    }

    // Update Highest Rank
    if ((ranks[game.playernum].level > ranks["h"+game.playernum].level) || ((ranks[game.playernum].level == ranks["h"+game.playernum].level) && (ranks[game.playernum].pt > ranks["h"+game.playernum].pt))) {
      // If Level Up, Record Time
      if (ranks[game.playernum].level > ranks["h"+game.playernum].level) {
        ranks["h"+game.playernum].level = ranks[game.playernum].level
        ranks["h"+game.playernum].pt = ranks[game.playernum].pt
        ranks["h"+game.playernum].rate = ranks[game.playernum].rate
        ranks["h"+game.playernum].time = parseInt(game.starttime)
        // Phoenix!
        if (ranks[game.playernum].level == 16) ranks[game.playernum].time_phoenix = parseInt(game.starttime)
      } else {
        ranks["h"+game.playernum].level = ranks[game.playernum].level
        ranks["h"+game.playernum].pt = ranks[game.playernum].pt
        ranks["h"+game.playernum].rate = ranks[game.playernum].rate
      }
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

  ranks["name4"] = get_tenhou(4).pts[ranks[4].level][0]
  ranks["name3"] = get_tenhou(3).pts[ranks[3].level][0]
  ranks["hname4"] = get_tenhou(4).pts[ranks["h4"].level][0]
  ranks["hname3"] = get_tenhou(3).pts[ranks["h3"].level][0]

  return ranks;
}


async function getCurrentRank(username) {
  let gamelist = await fetchGameListFromNodochi(username);
  if (gamelist == undefined || gamelist.length == 0) throw -1
  gamelists = splitAccountGameList(gamelist);
  let allranks = [];
  let ranks = setupRanks(username);
  gamelists.forEach(gamelist => {
    try {
      ranks = solveRankFromGameList(gamelist, username, ranks)
    } catch (e) {
      console.log(e)
      try {
        ranks = solveRankFromGameList(gamelist, username, allranks[allranks.length - 1])
      } catch (e) { console.log('?', e) }
    }
    allranks.push(ranks);
    if (ranks.h4.level == 20 || ranks.h3.level == 20) ;
    else ranks = setupRanks(username);
  })
  // console.log(allranks)
  return allranks[allranks.length - 1];
}


module.exports = {
  getCurrentRank: getCurrentRank,
  stringify_ranks: stringify_ranks
}
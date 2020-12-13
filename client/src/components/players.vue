<template>
  <div v-show="showPlayers" id="players">
    <table>
      <thead>
        <tr>
          <th>{{ lang.team }}</th>
          <th>{{ lang.name }}</th>
          <th :title="lang.pingDesc">{{ lang.ping }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="player in players"
          v-bind:key="player.id"
          :class="[teamClass(myTeam, player.team), myID == player.id ? 'my-player' : '']"
        >
          <!--<td>{{ side(player.team) }}</td>-->
          <td>
            <img :src="getFlag(player.team)" />
          </td>
          <td
            :class="isAlive(player.status) ? 'player-alive' : 'player-dead'"
            :title="'Player ID #' + player.id"
          >{{ player.name }}</td>
          <td :style="{ backgroundColor: getPingColor(player.ping) }">{{ player.ping }}</td>
        </tr>
      </tbody>
    </table>
    <div v-show="false">{{ updated }}</div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { EntityType } from "../../../dogfight/src/entity";
import { Team } from "../../../dogfight/src/constants";
import { PlayerStatus, PlayerInfo } from "../../../dogfight/src/entities/PlayerInfo";
import { Localizer } from "../localization/localizer";
const flags = {
  [Team.Centrals]: "germanflag_small.gif",
  [Team.Allies]: "raf_flag_small.gif"
};

const pingMax = 500;

function clamp(number, min, max): number {
  return Math.round(Math.max(min, Math.min(number, max)));
}

export default Vue.extend({
  data() {
    return {
      players: []
    };
  },
  computed: {
    lang() {
      return {
        name: Localizer.get("name"),
        team: Localizer.get("team"),
        ping: Localizer.get("ping"),
        pingDesc: Localizer.get("pingDescription")
      };
    },
    showPlayers() {
      return this.$store.state.clientState.showPlayers;
    },
    updated() {
      return this.$store.state.client.playersUpdated;
    },
    myTeam() {
      return this.$store.state.client.playerInfo.team;
    },
    myID() {
      return this.$store.state.client.playerInfo.id;
    }
  },
  methods: {
    getPingColor(ping: number): string {
      const hueMax = 120;
      const percentage = ping / pingMax;
      const hue = clamp(hueMax - percentage * hueMax, 0, hueMax);
      // console.log(`hsl(${hue}, 100%, 50%)`, ping);
      return `hsl(${hue}, 100%, 50%)`;
    },
    getFlag(team: number) {
      return "assets/images/" + flags[team];
    },
    isAlive(status: PlayerStatus) {
      return status == PlayerStatus.Playing ? true : false;
    },
    teamClass(me: Team, them: Team): string {
      if (me == undefined) {
        return "";
      }
      if (them == me) {
        return "my-team";
      }
      return "enemy-team";
    }
  },
  watch: {
    updated() {
      const players = this.$store.state.client.gameObjects[
        EntityType.Player
      ];
      const playerArray = [];
      for (const p in players) {
        const player = players[p];
        player.id = parseInt(p);
        playerArray.push(player);
      }
      playerArray.sort((p1, p2) => {
        return p1.team - p2.team;
      });
      this.players = playerArray;
    }
  }
});
</script>

<style>
#players {
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(85, 85, 85, 0.8);
}

/*
@keyframes slide {
  0% {
    height: 0px;
  }
  100% {
    height: 100%;
  }
}*/

.my-team {
  background-color: #8ecbff;
  color: #0000ff;
  border: 1px solid #0000ff;
}

.my-player {
  font-weight: bold;
}

.enemy-team {
  background-color: #ffb574;
  border: 1px solid #ff0000;
  color: #ff0000;
}

.player-alive {
}

.player-dead {
  text-decoration: line-through;
  /*font-style: italic;*/
}

#players table {
  width: 100%;
  background-color: white;
  border-collapse: collapse;
}

#players table thead {
  color: white;
  background-color: black;
}

#players table td {
  text-align: center;
}
</style>

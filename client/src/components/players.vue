<template>
  <div v-if="showPlayers" id="players">
    <table>
      <thead>
        <tr>
          <th>Team</th>
          <th>Name</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="player in players"
          v-bind:key="player.id"
          :class="player.team == myTeam ? 'my-team': 'enemy-team'"
        >
          {{ player }}
          <!--<td>{{ side(player.team) }}</td>-->
          <td>
            <img :src="getFlag(player.team)" />
          </td>
          <td
            :class="isAlive(player.status) ? 'player-alive' : 'player-dead'"
            :title="'Player ID #' + id"
          >{{ player.name }}</td>
        </tr>
      </tbody>
    </table>
    <div v-show="false">{{ updated }}</div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { GameObjectType } from "../../../dogfight/src/object";
import { Team } from "../../../dogfight/src/constants";
import { PlayerStatus, Player } from "../../../dogfight/src/objects/player";
const flags = {
  [Team.Centrals]: "germanflag_small.gif",
  [Team.Allies]: "raf_flag_small.gif"
};
export default Vue.extend({
  data() {
    return {
      players: []
    };
  },
  computed: {
    showPlayers() {
      return this.$store.state.clientState.showPlayers;
    },
    updated() {
      return this.$store.state.client.playersUpdated;
    },
    myTeam() {
      return this.$store.state.client.playerInfo.team;
    }
  },
  methods: {
    getFlag(team: number) {
      return "assets/images/" + flags[team];
    },
    isAlive(status: PlayerStatus) {
      return status == PlayerStatus.Playing ? true : false;
    }
  },
  watch: {
    updated() {
      const players = this.$store.state.client.gameObjects[
        GameObjectType.Player
      ];
      const playerArray = [];
      for (const p in players) {
        const player = players[p];
        player.id = parseInt(p);
        playerArray.push(player);
      }
      playerArray.sort((p1, p2) => {
        return p2.id;
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

.my-team {
  background-color: #8ecbff;
  color: #0000ff;
}

.enemy-team {
  background-color: #ffb574;
  color: #ff0000;
}

.player-alive {
  font-weight: bold;
}

.player-dead {
  /*text-decoration: line-through;*/
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

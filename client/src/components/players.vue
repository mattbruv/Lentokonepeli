<template>
  <div id="players">
    <table>
      <thead>
        <tr>
          <th>Team</th>
          <th>Name</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(player, id) in players" v-bind:key="id">
          <td>{{ side(player.team) }}</td>
          <td>{{ player.name }}</td>
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
export default Vue.extend({
  data() {
    return {
      players: {}
    };
  },
  computed: {
    updated() {
      return this.$store.state.client.playersUpdated;
    }
  },
  methods: {
    side(team: number) {
      return Team[team];
    }
  },
  watch: {
    updated() {
      this.players = this.$store.state.client.gameObjects[
        GameObjectType.Player
      ];
    }
  }
});
</script>

<style>
#players {
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(85, 85, 85, 0.9);
}

#players table {
  width: 100%;
  background-color: white;
}

#players table thead {
  color: white;
  background-color: black;
}
</style>

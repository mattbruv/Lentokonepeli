import { Facing } from "dogfight-types/Facing";

interface Entity {
  foo: () => Facing;
}

const x: Entity = {
  foo: function (): Facing {
    return "Right";
  },
};

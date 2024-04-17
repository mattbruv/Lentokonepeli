import { EntityChange } from "./bindings/EntityChange";

export function sayHello() {
  console.log("Hey");
}

export function sayGoodbye(changes: EntityChange[]): string {
  if (changes.length > 0) {
    const first = changes[0];

    return first.ent_type;
  }
  return "foo bar test";
}

import { EntityChange } from "./bindings/EntityChange";
import { EntityType } from "./bindings/EntityType";
import { ManProperties } from "./bindings/ManProperties";

export function sayHello() {
  console.log("Hey");
}

export function sayGoodbye(changes: EntityChange[]): ManProperties | null {
  if (changes.length > 0) {
    const first = changes[0];
  }
  return null;
}

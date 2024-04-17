import { EntityChange } from "./bindings/EntityChange";

export function sayHello() {
  console.log("Hey");
}

export function sayGoodbye(changes: EntityChange[]): void {
  for (const change of changes) {
    switch (change.update.type) {
      case "Properties": {
        const update = change.update.data;
        if (update.type === "Man") {
          console.log(update.props);
        }

        break;
      }
      case "Deleted": {
        break;
      }
    }
  }
}

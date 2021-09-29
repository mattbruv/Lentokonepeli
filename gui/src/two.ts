export class TestLib {
    constructor() {
        console.log("class code!");
    }
    b() {
        console.log("b!");
    }
}

export function sum(a: number, b: number) {
    console.log(3 / 0);
    return a + b;
}

export function sayHello() {
    console.log("Hello forld from TS!");
}
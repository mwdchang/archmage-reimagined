import { writeFileSync, readFileSync, open } from "fs";

const m = new Map<number, string[]>();
m.set(1, ['1', '2', '3']);
m.set(2, ['2', '2', '3']);
m.set(3, ['3', '2', '3']);
m.set(4, ['4', '2', '3']);
m.set(5, ['5', '2', '3']);


let saveBlob = JSON.stringify(Array.from(m.entries()));
writeFileSync('test.sav', saveBlob);

let loadBlob= readFileSync('test.sav', { encoding: 'utf-8' });
const m2 = new Map<number, string[]>(JSON.parse(loadBlob));

console.log(m2.size);

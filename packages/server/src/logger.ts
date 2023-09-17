export const info = (...args: any) => {
  args.unshift(`${(new Date()).toISOString().split('.')[0]} [Info] `);
  console.log.apply(console, args);
}

export const log = (...args: any) => {
  args.unshift(`${(new Date()).toISOString().split('.')[0]} [Log] `);
  console.log.apply(console, args);
}

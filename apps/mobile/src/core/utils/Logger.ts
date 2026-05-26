export const Logger = {
  info: (msg: string, ...args: any[]) => {
    if (__DEV__) console.log(`[INFO] ${msg}`, ...args);
  },
  warn: (msg: string, ...args: any[]) => {
    if (__DEV__) console.warn(`[WARN] ${msg}`, ...args);
  },
  error: (msg: string, ...args: any[]) => {
    if (__DEV__) console.error(`[ERROR] ${msg}`, ...args);
  }
};

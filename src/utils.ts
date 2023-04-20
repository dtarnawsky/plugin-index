export function hasArg(arg: string, args: string[]): boolean {

  for (const a of args) {
    const clean = a.replace('--', '').toLowerCase();
    if (arg == clean) {
      return true;
    }
  }
  return false;
}
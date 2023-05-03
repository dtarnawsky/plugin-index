export const minCapacitorVersion = 2;
export const maxCapacitorVersion = 5;

export function testNames(): string[] {
    const result = [];
    for (let version = minCapacitorVersion; version <= maxCapacitorVersion; version++) {
        result.push(`capacitor-ios-${version}`);
        result.push(`capacitor-android-${version}`);
    }
    for (let cordova of cordovaTestNames()) {
        result.push(cordova);
    }
    return result;
}

export function cordovaTestNames(): string[] {
    return ['cordova-ios-6', 'cordova-android-11'];
}
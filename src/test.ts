export const capacitorVersions = [2,3,4,5];

export function testNames(): string[] {
    const result = [];
    for (let version of capacitorVersions) {
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
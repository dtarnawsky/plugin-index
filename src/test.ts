export const minCapacitorVersion = 2;
export const maxCapacitorVersion = 5;

export enum Test {
    capacitorIos5 = 'capacitor-ios-5',
    capacitorAndroid5 = 'capacitor-android-5',
    capacitorIos4 = 'capacitor-ios-4',
    capacitorAndroid4 = 'capacitor-android-4',    
    capacitorIos3 = 'capacitor-ios-3',
    capacitorAndroid3 = 'capacitor-android-3',
    cordovaIos6 = 'cordova-ios-6',
    cordovaAndroid11 = 'cordova-android-11',
    failedInNPM = 'failed-in-npm',
    noOp = 'noop'
}

export const TestNames: string[] = [
    'capacitor-ios-5',
    'capacitor-android-5',
    'capacitor-ios-4',
    'capacitor-android-4',    
    'capacitor-ios-3',
    'capacitor-android-3',
    'cordova-ios-6',
    'cordova-android-11',
];

export interface TestInfo {
    ios: Test;
    android: Test;    
}
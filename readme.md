# Plugin Explorer

This is a tool to generate information about Capacitor and Cordova plugins. It tests plugins against various Capacitor and Cordova versions and captures whether the native code will compile or will fail.

The list of inspected plugins is in `data\plugins.txt`.

## Usage
The following commands can be run:
- `npm run inspect-all` - Will run tests against all plugins
- `npm run inspect-failed` - Will run tests against plugins that have previously failed tests
- `npm run inspect-new` - Will run test against plugins it has not tested yet
- `npm run prepare` - Will summarize all plugin json files and prepare a `dist folder to publishing
- `npm run publish` - Will publish to netlify at: [webnative-plugins.netlify.app](https://webnative-plugins.netlify.app)

## Tests
When running tests it will use a starter project in a GitHub repo for particular versions of Capacitor or Cordova. These projects are tested:
- [Capacitor 5](https://github.com/dtarnawsky/plugin-test-capacitor-5)
- [Capacitor 4](https://github.com/dtarnawsky/plugin-test-capacitor-4)
- [Capacitor 3](https://github.com/dtarnawsky/plugin-test-capacitor-3)
- [Cordova](https://github.com/dtarnawsky/plugin-test-cordova-6-11.git)

# Roadmap
- Plugins for cordova have a package.json with this to indicate platforms supported. Use it:
 "cordova": {
    "id": "cordova-plugin-android-fingerprint-auth",
    "platforms": [
      "android"
    ]
  },
- Check package.json to see if Capacitor is a dependency and push cordova to failed if so
- Cleanup git urls - some have ssh in them and will work if stripped
- Grab whether the plugin is deprecated from github
- Load each json and re-run if test not run or version number is new
- Grab readme.md from github
- Check git repo url and make sure it doesnt 404. eg https://github.com/htorbov/capacitor-apple-login.git (capacitor-apple-login). Remove url and downrank if this is the case
- Test with Capacitor 5
- Test with Cordova
- Look to combine added metadata (see below)
- Add test result history: `plugin-history.json`:
```json
[ 
    { "test": "capacitor-ios-3", "version": "1.0.0", "status": "fail-npm-install", "log": "filename", "tested": "date-time" }
]
```

## Added Metadata
Some data requires human interaction. This could include:
- Known list of exceptions: eg `cordova-plugin-ionic-webview` should not be used with Capacitor
- Known list of keywords to add to a plugin. Eg `authentication` to `@ionic-enterprise\auth-connect`

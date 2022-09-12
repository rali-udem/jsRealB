// Javascript code pattern for a js file that is also used in a web environment for which
// jsRealB has been loaded via a script

if (typeof process !== "undefined" && process?.versions?.node){ // cannot use isRunningUnderNode yet!!!
    let {default:jsRealB} = await import("../../dist/jsRealB.js");
    Object.assign(globalThis,jsRealB);
    // .... start of the application     
 } else {
    $(document).ready(function() {
        Object.assign(globalThis,jsRealB);
        // .... start of the application     
    })
 }
 
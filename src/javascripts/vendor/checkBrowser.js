function checkBrowser() {
  var appName = window.navigator.appName;
  var appVersion = window.navigator.appVersion;
  var strPlatform = window.navigator.platform;
  var appCodeName = window.navigator.appCodeName;
  var userAgent = window.navigator.userAgent;

  var BrowserName = ""
  var BrowserVersion = ""

  if (appVersion.indexOf("MSIE") != -1) {
    BrowserName = "Internet Explorer";

    var re = new RegExp("MSIE (\\S){1,16}\\b");
    var m = re.exec(userAgent);
    if (m != null) {
      BrowserVersion = m[0].replace("MSIE ", "");
    }
  }
  else if (appVersion.indexOf("Trident") != -1) { //for IE 11.x
    BrowserName = "Internet Explorer";
    var re = new RegExp("rv:(\\S){1,16}\\b");
    var m = re.exec(userAgent);
    if (m != null) {
      BrowserVersion = m[0].replace("rv:", "");
    }
  }
  else if ((appName.indexOf("Netscape") != -1) && (appCodeName.indexOf("Mozilla") != -1) && (userAgent.indexOf("Firefox") != -1)) {
    BrowserName = "Firefox";
    var re = new RegExp("Firefox/(\\S){1,16}\\b");
    var m = re.exec(userAgent);
    if (m != null) {
      BrowserVersion = m[0].replace("Firefox/", "");
    }
  }
  else if ((appName.indexOf("Opera") != -1) && (appCodeName.indexOf("Mozilla") != -1) && (userAgent.indexOf("Opera") != -1)) {
    BrowserName = "Opera";
    var re = new RegExp("Opera/(\\S){1,16}\\b");
    var m = re.exec(userAgent);
    if (m != null) {
      BrowserVersion = m[0].replace("Opera/", "");
    }
  }
  else if ((appName.indexOf("Netscape") != -1) && (appCodeName.indexOf("Mozilla") != -1) && (userAgent.indexOf("Chrome") != -1)) {
    BrowserName = "Chrome";
    var re = new RegExp("Chrome/(\\S){1,16}\\b");
    var m = re.exec(userAgent);
    if (m != null) {
      BrowserVersion = m[0].replace("Chrome/", "");
    }
  }
  return {Name: BrowserName, Ver: parseFloat(BrowserVersion), Platform: strPlatform};
}

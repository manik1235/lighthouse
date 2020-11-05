const fs = require('fs');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

var outputFilename = 'report.tsv'
var urls = [];

var lineReader = require('readline').createInterface({
  input: fs.createReadStream('./sites')
});

lineReader.on('line', function (line) {
  console.log('Line from file:', line);
  urls.push(line);
});

lineReader.on('close', function () {
  async function doIt() {
    for(var urlIndex = 0; urlIndex < urls.length; urlIndex++) {
      console.log('calling ' + urls[urlIndex]);
      const result = await getLighthouse(urls[urlIndex]);
      console.log('result');
      console.log(result);
      fs.appendFileSync('reports/' + outputFilename, result);
    };
  }

  doIt();
});

async function getLighthouse(url) {
  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  const options = {logLevel: 'info', output: 'html', onlyCategories: ['performance'], port: chrome.port};
  const runnerResult = await lighthouse(url, options);

  // `.report` is the HTML report as a string
  const reportHtml = runnerResult.report;

  // `.lhr` is the Lighthouse Result as a JS object
  console.log('Report is done for', runnerResult.lhr.finalUrl);
  console.log('Performance score was', runnerResult.lhr.categories.performance.score * 100);

  var audits = runnerResult.lhr.audits;
  console.log(audits['dom-size'].numericValue);

  var domInfo = audits["dom-size"].details.items;
  var output = domInfo.map(item => item.value).join('\t') + '\t' + url + '\n';

  await chrome.kill();
  return output;
}


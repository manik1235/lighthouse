const fs = require('fs');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
var lineReader = require('readline').createInterface({
  input: fs.createReadStream('./sites')
});

var outputFilename = 'report.tsv'
var urls = [];

lineReader.on('line', function (line) {
  urls.push(line);
});

lineReader.on('close', async function () {
  for(var urlIndex = 0; urlIndex < urls.length; urlIndex++) {
    const result = await getLighthouse(urls[urlIndex]);
    fs.appendFileSync(outputFilename, result);
  };
});

async function getLighthouse(url) {
  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  const options = {logLevel: 'info', output: 'html', onlyCategories: ['performance'], port: chrome.port};
  const runnerResult = await lighthouse(url, options);

  var audits = runnerResult.lhr.audits;

  var domInfo = audits["dom-size"].details.items;
  var output = domInfo.map(item => parseInt(item.value.replace(',', ''))).join('\t') + '\t' + url + '\n';

  await chrome.kill();
  return output;
}


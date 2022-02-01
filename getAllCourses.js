var selenium = require('selenium-webdriver');
var moment = require('moment-timezone');
var totp = require('totp-generator');
const path = require('path');
var fs = require('fs');


const TIMETABLE = process.env.USW_TIMETABLE || 'http://ttwebprod.uni.glam.ac.uk.ergo.southwales.ac.uk/sws/2122/';
const USERNAME = process.env.USW_USERNAME || 'nop';
const PASSWORD = process.env.USW_PASSWORD || 'nop';
const OTP = process.env.USW_OTP || 'nop';
const WEEK_ONE_START = process.env.USW_WEEK_ONE || '5 Jul 2021';
const DATA_DIR = process.env.DATA_DIR || "data";
const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN || "nop";

const WAIT_DURATION = 20000;

var until = selenium.until;
let weekOneStart = WEEK_ONE_START;
let weekDates = [];
for(var i = 0; i < 52; i++){
    weekDates[i + 1] = moment(weekOneStart, "D MMM YYYY").add(i, 'week');
}

const chromeCapabilities = selenium.Capabilities.chrome();
chromeCapabilities.set('browserless:token', BROWSERLESS_TOKEN);
chromeCapabilities.set('goog:chromeOptions', {
  args: [
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-breakpad",
    "--disable-component-extensions-with-background-pages",
    "--disable-dev-shm-usage",
    "--disable-extensions",
    "--disable-features=TranslateUI,BlinkGenPropertyTrees",
    "--disable-ipc-flooding-protection",
    "--disable-renderer-backgrounding",
    "--enable-features=NetworkService,NetworkServiceInProcess",
    "--force-color-profile=srgb",
    "--hide-scrollbars",
    "--metrics-recording-only",
    "--mute-audio",
    "--headless",
    "--no-sandbox"
  ]
});
  
async function run(courses) {

    var driver = new selenium.Builder()
    .forBrowser('chrome')
    .withCapabilities(chromeCapabilities)
    .usingServer('https://chrome.browserless.io/webdriver')
    .build();
    // var driver = new selenium.Builder().withCapabilities(capabilities).setFirefoxOptions(new firefox.Options()).build();
    await driver.get(TIMETABLE);
        console.log("Logging in");
        selector = selenium.By.name("Select");
        condition = selenium.until.elementLocated(selector);
        button = await driver.wait(condition, WAIT_DURATION);
        await button.click();
await driver.wait(until.elementLocated(selenium.By.id("i0116")));
   console.log((await driver.getCurrentUrl())); 
        selector = selenium.By.id("i0116");
        condition = selenium.until.elementLocated(selector);
        var text = await driver.wait(condition, WAIT_DURATION);
        await text.sendKeys(USERNAME);
    
        //idSIButton9
        selector = selenium.By.id("idSIButton9");
        condition = selenium.until.elementLocated(selector);
        button = await driver.wait(condition, WAIT_DURATION);
        await button.click();

        selector = selenium.By.id("i0118");
        condition = selenium.until.elementLocated(selector);
        text = await driver.wait(condition, WAIT_DURATION);
        await text.sendKeys(PASSWORD);

        await new Promise(resolve => setTimeout(resolve, 1000));

        selector = selenium.By.id("idSIButton9");
        condition = selenium.until.elementLocated(selector);
        button = await driver.wait(condition, WAIT_DURATION);
        await button.click();

        //idTxtBx_SAOTCC_OTC
        console.log((await driver.getCurrentUrl()))
        var token = totp(OTP);
        selector = selenium.By.id("idTxtBx_SAOTCC_OTC");
        condition = selenium.until.elementLocated(selector);
        text = await driver.wait(condition, WAIT_DURATION);
        await text.sendKeys(token);
    
        selector = selenium.By.id("idSubmit_SAOTCC_Continue");
        condition = selenium.until.elementLocated(selector);
        button = await driver.wait(condition, WAIT_DURATION);
        await button.click();

    console.log("Clicking Course Timetable");
    selector = selenium.By.linkText("Course Timetable (Student Group)");
    condition = selenium.until.elementLocated(selector);
    button = await driver.wait(condition, WAIT_DURATION);
    await button.click();

    if(courses.indexOf("Accounting and Finance (SWE Returners) - BA - Year 3  - Group 01") === -1){
        console.log("Selecting Courses", courses);
        console.log((await driver.getCurrentUrl()));
        selector = selenium.By.name("lbxStudentSets");
        condition = selenium.until.elementLocated(selector);
        select = await driver.wait(condition, WAIT_DURATION);
        options = await select.findElements(selenium.By.tagName("option"))
        var selectedCourses = 0;
        for(var i = 0; i < options.length; i++){
            var option = options[i];
            var text = await option.getText();
            if(courses.indexOf(text) !== -1 || text === "Accounting and Finance (SWE Returners) - BA - Year 3  - Group 01"){
                console.log("Selecting course", text);
                await option.click();
                if(courses.indexOf(text) !== -1){
                    selectedCourses++;
                    if(selectedCourses == courses.length){
                        break;
                    }
                }
            }
        }
    } else {
        selector = selenium.By.name("lbxStudentSets");
        condition = selenium.until.elementLocated(selector);
        select = await driver.wait(condition, WAIT_DURATION);
        options = await select.findElements(selenium.By.tagName("option"))
        var selectedCourses = 0;
        for(var i = 0; i < options.length; i++){
            var option = options[i]
            var text = await option.getText()
            if(text === "Accounting and Finance (SWE Returners) - BA - Year 3  - Group 01"){
                await option.click();
                await option.click();
                selectedCourses++;
                if(selectedCourses == courses.length){
                    break;
                }
            } else if(courses.indexOf(text) !== -1){
                await option.click();
                selectedCourses++;
                if(selectedCourses == courses.length){
                    break;
                }
            }
        }
    }
    console.log("Selecting weeks")
    let weeksSelector = selenium.By.name("lbxWeeks");
    let weeksCondition = selenium.until.elementLocated(weeksSelector);
    let weeksSelect = await driver.wait(weeksCondition, WAIT_DURATION);
    let weekOptions = await  weeksSelect.findElements(selenium.By.tagName("option"))
    for(var i = 0; i < weekOptions.length; i++){
         var option = weekOptions[i]
         var text = await option.getText()
         if(text.indexOf("Term") !== -1 && i !== 0){
             await option.click();
         }
    }
    console.log("Clicking show timetable");
    selector = selenium.By.name("btnShowTimetable");
    condition = selenium.until.elementLocated(selector);
    button = await driver.wait(condition, WAIT_DURATION);
    await button.click();

    let handles = await driver.getAllWindowHandles();
    await driver.switchTo().window(handles[1]);
    
    await new Promise((resolve, reject) => {
        setTimeout(async () => {
            console.log("Parsing table data");
            var weeks = {};
            for(var i = 0; i < 52; i++){
                weeks[i + 1] = {
                    startDate: weekDates[i + 1].format(),
                    monday: {},
                    tuesday: {},
                    wednesday: {},
                    thursday: {},
                    friday: {}
                };
            }
            var courseTables = {};
            var tables = await driver.findElements(selenium.By.css("body > table"));
            for(var m = 0; m < tables.length; m++){
                if((await tables[m].getAttribute("class")) === "header-border-args"){
                    var nameRow = await tables[m].findElement(selenium.By.className("header-5-0-8"));
                    var name = await nameRow.getText();
                    console.log("Found course title", name);
                    var tablesForCourse = tables.slice(m + 1, m + 6)
                    courseTables[name] = tablesForCourse;
                }
            }
            for(var t = 0; t < Object.keys(courseTables).length; t++){
                var courseWeeks = JSON.parse(JSON.stringify(weeks));
                var courseName = Object.keys(courseTables)[t];
                var coursesTable = courseTables[courseName];
                console.log("Going through tables for", courseName);
                for(var i = 0; i < coursesTable.length; i++){
                    var element = coursesTable[i];
                    var tbody;
                    try {
                        tbody = await element.findElement(selenium.By.tagName("tbody"));
                    }catch (e){
                        continue;
                    }
                    var rows = await tbody.findElements(selenium.By.tagName("tr"));
                    if(rows.length > 1){
                        rows.splice(0, 1);
                        for(var x = 0; x < rows.length; x++){
                            let row = rows[x];
                            let data = await row.findElements(selenium.By.tagName("td"));
                            if(data.length > 0){
                                let info = [];
                                for(var y = 0; y < data.length; y++){
                                    let text = await data[y].getText();
                                    info[y] = text;
                                }
                                let lessonWeeks = [];
                                if(info[5].indexOf('-') === -1){
                                    var split = info[5].split(",");
                                    split.forEach((wNum) => {
                                        lessonWeeks.push(parseInt(wNum));
                                    })
                                } else {
                                    if(info[5].indexOf(",") !== -1){
                                        let ranges = info[5].split(",");
                                        ranges.forEach((range) => {
                                            if(range.indexOf('-') === -1){
                                                lessonWeeks.push(parseInt(range));
                                            } else {
                                                let parts = range.split("-");
                                                for(var j = parseInt(parts[0]); j <= parseInt(parts[1]); j++){
                                                    lessonWeeks.push(j);
                                                }
                                            }
                                        })
                                    } else {
                                        let parts = info[5].split("-");
                                        for(var j = parseInt(parts[0]); j <= parseInt(parts[1]); j++){
                                            lessonWeeks.push(j);
                                        }
                                    }
                                }
                                let startSplit = info[3].split(":");
                                let endSplit = info[4].split(":");
                                for(var j = 0; j < lessonWeeks.length; j++){
                                    let weekNumber = lessonWeeks[j];
                                    let day = courseWeeks[weekNumber][Object.keys(courseWeeks[weekNumber])[i + 1]]
                                    let dayDate = moment(courseWeeks[weekNumber].startDate).add(i, 'day');
                                    if(!day.lessons){
                                        day['lessons'] = [];
                                    }
                                    day.lessons.push({
                                        module: info[0],
                                        title: info[1],
                                        start: dayDate.tz('Europe/London').set({'hour': startSplit[0], 'minute': startSplit[1]}).format(),
                                        end: dayDate.tz('Europe/London').set({'hour': endSplit[0], 'minute': endSplit[1]}).format(),
					staff: info[7],
                                        room: info[6]
                                    });
                                    courseWeeks[weekNumber][Object.keys(courseWeeks[weekNumber])[i + 1]] = day;
                                }
                            }
                        }
                    }
                }
                fs.writeFileSync(path.join(__dirname, DATA_DIR, 'courses/' + courseName + '.json'), JSON.stringify(courseWeeks));
                console.log("Finished course", courseName);
            }
            await driver.close();
            resolve();
        }, 2000);
    })
}
async function getCourse(course){
    await run(course);
}

module.exports = getCourse;

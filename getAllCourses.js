const puppeteer = require('puppeteer-extra');
var moment = require('moment-timezone');
var totp = require('totp-generator');
const path = require('path');
var fs = require('fs');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

const TIMETABLE = process.env.USW_TIMETABLE || 'http://ttwebprod.uni.glam.ac.uk.ergo.southwales.ac.uk/sws/2122/';
const USERNAME = process.env.USW_USERNAME || 'nop';
const PASSWORD = process.env.USW_PASSWORD || 'nop';
const OTP = process.env.USW_OTP || 'nop';
const WEEK_ONE_START = process.env.USW_WEEK_ONE || '5 Jul 2021';
const DATA_DIR = process.env.DATA_DIR || "data";

let weekOneStart = WEEK_ONE_START;
let weekDates = [];
for(var i = 0; i < 52; i++){
    weekDates[i + 1] = moment(weekOneStart, "D MMM YYYY").add(i, 'week');
}

let clickAndWaitForTarget = async (clickSelector, page, browser) => {
    const pageTarget = page.target(); //save this to know that this was the opener
    await page.click(clickSelector); //click on a link
    const newTarget = await browser.waitForTarget(target => target.opener() === pageTarget); //check that you opened this page, rather than just checking the url
    const newPage = await newTarget.page(); //get the page object
    await newPage.waitForSelector("body"); //wait for page to be loaded
  
    return newPage;
};
async function run(courses) {
    if(!fs.existsSync(path.join(__dirname, DATA_DIR))){
        fs.mkdirSync(path.join(__dirname, DATA_DIR));
    }
    if(!fs.existsSync(path.join(__dirname, DATA_DIR, 'courses'))){
        fs.mkdirSync(path.join(__dirname, DATA_DIR, 'courses'));
    }
    let browser = null;
    try {
        browser = await puppeteer.launch({headless: true, args: [
            "--disable-gpu",
            "--disable-dev-shm-usage"]});
        const page = await browser.newPage();
        console.log("Navigating to page");
        await page.goto(TIMETABLE);

        await page.waitForSelector('#IdPList > p:nth-child(1) > input[type=submit]');
        await page.click('#IdPList > p:nth-child(1) > input[type=submit]');

        await page.waitForSelector('#i0116');

        await page.click('#i0116');
        await page.keyboard.type(USERNAME);

        await page.click('#idSIButton9');

        console.log("Waiting for password box");

        await page.waitForSelector('#i0118:not(.moveOffScreen)');

        console.log("Typing password");
        await page.click('#i0118');
        await page.keyboard.type(PASSWORD);

        await page.click('#idSIButton9');

        await page.waitForSelector('#idTxtBx_SAOTCC_OTC');

        await page.click('#idTxtBx_SAOTCC_OTC');
        var token = totp(OTP);
        await page.keyboard.type(token);

        await page.click('#idSubmit_SAOTCC_Continue');

        await page.waitForNavigation();
        await page.waitForNavigation();
        console.log("Navigating to courses page", page.url());

        await page.click('a[href="studentset.asp"]');
        await page.waitForSelector('select[name="lbxStudentSets"]');

        console.log("Selecting Courses", courses);
        await page.evaluate((courses) => {
            const example = document.querySelector('select[name="lbxStudentSets"]');
            const example_options = example.querySelectorAll('option');
            example_options[0].selected = false;
            const selected_options = [...example_options].filter(option => courses.indexOf(option.text) !== -1);
            
            selected_options.forEach((op) => op.selected = true);
        }, courses);

        await page.select('select[name="lbxWeeks"]', "9-24", "28-40", "44-65");
        const timeTablePage = await clickAndWaitForTarget('input[name="btnShowTimetable"]', page, browser);
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
                var tables = await timeTablePage.$$('body > table');
                for(var m = 0; m < tables.length; m++){
                    if(await tables[m].evaluate(elem => elem.classList.contains("header-border-args"))){
                        var nameRow = await tables[m].$(".header-5-0-8");
                        var name = await nameRow.evaluate((elem) => elem.innerText);
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
                            tbody = await element.$("tbody");
                        }catch (e){
                            continue;
                        }
                        var rows = await tbody.$$("tr");
                        if(rows.length > 1){
                            rows.splice(0, 1);
                            for(var x = 0; x < rows.length; x++){
                                let row = rows[x];
                                let data = await row.$$("td");
                                if(data.length > 0){
                                    let info = [];
                                    for(var y = 0; y < data.length; y++){
                                        let text = await data[y].evaluate((elem) => elem.innerText);
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
                resolve();
            }, 2000);
        })
        browser.close();
    }   
    catch(ex) {
        console.error(ex);
    }
}
async function getCourse(course){
    await run(course);
}

module.exports = getCourse;

const https = require('https');
const path = require('path');
const fs = require('fs');
const getCourses = require('./getAllCourses.js');
const DATA_DIR = process.env.DATA_DIR || "data";
async function run(){
    let courses = [];
    if(!fs.existsSync(path.join(__dirname, DATA_DIR, 'courses.json'))){
        fs.writeFileSync(path.join(__dirname, DATA_DIR, 'courses.json'), JSON.stringify(courses));
    } else {
        courses = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'courses.json')));
    }
console.log("running...");
    await getCourses(courses);
    var options = {
        hostname: 'uswtime.date',
        port: 443,
        path: '/update',
        method: 'POST'
    };
    var req = https.request(options, (res) => {

    });
    req.on('error', (e) => {
    console.error(e);
    });
    req.end();
}
run();

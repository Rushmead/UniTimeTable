const ical = require('ical-generator');
const moment = require('moment');
const getCourses = require('./getAllCourses.js');
const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser')

const DATA_DIR = process.env.DATA_DIR || "data";

const port = 3000
const app = express();
app.use(bodyParser.json())

let courses = [];

if(!fs.existsSync(path.join(__dirname, DATA_DIR, 'courses.json'))){
    fs.writeFileSync(path.join(__dirname, DATA_DIR, 'courses.json'), JSON.stringify(courses));
} else {
    courses = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'courses.json')));
}
if(!fs.existsSync(path.join(__dirname, DATA_DIR, 'courses'))){
    fs.mkdirSync(path.join(__dirname, DATA_DIR, 'courses'));
}
let calendars = {};

function addCourse(course){
    let courseCalendar = ical({domain: 'uswtime.date', name: course, ttl: 60});
    calendars[course] = courseCalendar;
    if(fs.existsSync(path.join(__dirname, DATA_DIR, 'courses/' + course + '.json'))){
        loadCourse(course);
    }
}

courses.forEach((course) => {
    addCourse(course);
})

function loadCourse(course){
    if(!fs.existsSync(path.join(__dirname, DATA_DIR, 'courses/' + course + '.json'))){
        return;
    }
    console.log("Loading course " + course);
    let rawData = fs.readFileSync(path.join(__dirname, DATA_DIR, 'courses/' + course + '.json'));
    let data = JSON.parse(rawData);
    let weeks = Object.keys(data);
    let calendar = calendars[course];
    for(var i = 0; i < weeks.length; i++){
        let week = data[weeks[i]];
        let {startDate, ...days}  = week;
        Object.keys(days).forEach((dayName) => {
            let day = days[dayName];
            if(day.lessons){
                for(var x = 0; x < day.lessons.length; x++){
                    let lesson = day.lessons[x];
                    calendar.createEvent({
                        start: moment(lesson.start).tz('Europe/London'),
                        end: moment(lesson.end).tz('Europe/London'),
                        summary: lesson.title + " - " + lesson.staff,
                        description: lesson.module,
                        location: lesson.room
                    })
                }
            }
        })
    }
}
app.use(express.static('public'))
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
})
app.post('/add', async (req, res) => {
    let requestedCourses = req.body.courses;
    let finalCourseList = [];
    for(var i = 0; i < requestedCourses.length; i++){
        if(calendars[requestedCourses[i]] === undefined){
            finalCourseList.push(requestedCourses[i]);
        }
    }
    if(finalCourseList.length === 0){
        res.send('Done');
        return;
    }
    await getCourses(finalCourseList);
    for(var i = 0; i < finalCourseList.length; i++){
        courses.push(finalCourseList[i]);
        addCourse(finalCourseList[i]);
    }
    fs.writeFileSync(path.join(__dirname, DATA_DIR, 'courses.json'), JSON.stringify(courses));
    res.send('Done');
})
app.get('/courses', (req, res) => {
    res.send(JSON.stringify(courses));
})
app.get('/calendar/:course', (req, res) => {
    if(calendars[req.params.course] !== undefined){
        calendars[req.params.course].serve(res);
    } else {
        res.status(405).send('Not Found');
    }
})
app.get('/sound/all', (req, res) => calendars['Sound and Live Event Production - BSc - Year 1'].serve(res))
app.get('/lighting/all', (req, res) => calendars['Lighting Design and Technology - BSc - Year 1'].serve(res))
app.post('/update', (req, res) => {
    courses.forEach((course) => {
        if(calendars[course] === undefined){
            return;
        }
        calendars[course].clear();
        addCourse(course);
    })
    res.send('done');
})

app.listen(port, () => console.log(`Lights and Sound Live listening on port ${port}!`))

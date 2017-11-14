/**
 * The main class and interface of the schedule module
 */
const PriorityQueue = require('./priorityQueue');
const Job = require('./job.js');

const map = {};

function comparator(e1, e2) {
    return e1.time > e2.time;
}
const queue = PriorityQueue.createPriorityQueue(comparator);

let timer;

// The accuracy of the scheduler, it will affect the performance when the schedule tasks are
// crowded together
const accuracy = 10;

/**
 * Clear last timeout and schedule the next job, it will automaticly run the job that
 * need to run now
 * @param job The job need to schedule
 * @return void
 */
function setTimer(job) {
    clearTimeout(timer);

    timer = setTimeout(excuteJob, job.excuteTime() - Date.now());    // eslint-disable-line
}
/**
 * Return, but not remove the next valid job
 * @return Next valid job
 */
function peekNextJob() {
    if (queue.size() <= 0) { return null; }

    let job = null;

    do {
        job = map[queue.peek().id];
        if (!job) queue.pop();
    } while (!job && queue.size() > 0);

    return (job) || null;
}

/**
 * The function used to ran the schedule job, and setTimeout for next running job
 */
function excuteJob() {
    let job = peekNextJob();
    while (!!job && (job.excuteTime() - Date.now()) < accuracy) {
        job.run();
        queue.pop();

        const nextTime = job.nextTime();

        if (nextTime === null) {
            delete map[job.id];
        } else {
            queue.offer({ id: job.id, time: nextTime });
        }
        job = peekNextJob();
    }

    // If all the job have been canceled
    if (!job) { return; }

    // Run next schedule
    setTimer(job);
}

/**
 * Schedule a new Job
 */
function scheduleJob(trigger, jobFunc, jobData) {
    const job = Job.createJob(trigger, jobFunc, jobData);
    const excuteTime = job.excuteTime();
    const id = job.id;

    map[id] = job;
    const element = {
        id: id,
        time: excuteTime
    };

    const curJob = queue.peek();
    if (!curJob || excuteTime < curJob.time) {
        queue.offer(element);
        setTimer(job);

        return job.id;
    }

    queue.offer(element);
    return job.id;
}

/**
 * Cancel Job
 */
function cancelJob(id) {
    const curJob = queue.peek();
    if (curJob && id === curJob.id) { // to avoid queue.peek() is null
        queue.pop();
        delete map[id];

        clearTimeout(timer);
        excuteJob();
    }
    delete map[id];
    return true;
}

/**
 * Return and remove the next valid job
 * @return Next valid job
 */
function getNextJob() {
    let job = null;

    while (!job && queue.size() > 0) {
        const id = queue.pop().id;
        job = map[id];
    }

    return (job) || null;
}


module.exports.scheduleJob = scheduleJob;
module.exports.cancelJob = cancelJob;

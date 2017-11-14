/**
 * This is the trigger used to decode the cronTimer and calculate the next excution time of the cron Trigger.
 */
const logger = require('dreamix-logger').getLogger('dreamix-scheduler', __filename);
const utils = require('./utils');

const SECOND = 0;
const MIN = 1;
const HOUR = 2;
const DOM = 3;
const MONTH = 4;
const DOW = 5;

/**
 * return the next match time of the given value
 * @param value The time value
 * @param cronTime The cronTime need to match
 * @return The match value or null if unmatch(it offten means an error occur).
 */
function nextCronTime(value, cronTime) {
    value += 1;

    if (typeof (cronTime) === 'number') {
        if (cronTime === -1) { return value; }
        return cronTime;
    } else if (Array.isArray(cronTime)) {
        if (value <= cronTime[0] || value > cronTime[cronTime.length - 1]) { return cronTime[0]; }

        for (let i = 0; i < cronTime.length; i++) {
            if (value <= cronTime[i]) { return cronTime[i]; }
        }
    }

    logger.warn(`Compute next Time error! value :${value} cronTime : ${cronTime}`);
    return null;
}

/**
 * The constructor of the CronTrigger
 * @param trigger The trigger str used to build the cronTrigger instance
 */
class CronTrigger {
    constructor(trigger, job) {
        this.trigger = CronTrigger.decodeTrigger(trigger);
        this.nextTime = this.nextExcuteTime(Date.now());
        this.job = job;
    }
    /**
     * Get the current excuteTime of trigger
     */
    excuteTime() {
        return this.nextTime;
    }

    /**
     * Caculate the next valid cronTime after the given time
     * @param time The given time point
     * @return The nearest valid time after the given time point
     */
    nextExcuteTime(time) {
        // add 1s to the time so it must be the next time
        time = time || this.nextTime;
        time += 1000;

        const cronTrigger = this.trigger;
        const date = new Date(time);
        date.setMilliseconds(0);
        outmost:       // eslint-disable-line
        while (true) {   // eslint-disable-line
            if (date.getFullYear() > 2999) {
                logger.error("Can't compute the next time, exceed the limit");
                return null;
            }
            if (!utils.timeMatch(date.getMonth(), cronTrigger[MONTH])) {
                const nextMonth = nextCronTime(date.getMonth(), cronTrigger[MONTH]);

                if (nextMonth === null) { return null; }

                if (nextMonth <= date.getMonth()) {
                    date.setYear(date.getFullYear() + 1);
                    date.setMonth(0);
                    date.setDate(1);
                    date.setHours(0);
                    date.setMinutes(0);
                    date.setSeconds(0);
                    continue;    // eslint-disable-line
                }

                date.setDate(1);
                date.setMonth(nextMonth);
                date.setHours(0);
                date.setMinutes(0);
                date.setSeconds(0);
            }

            if (!utils.timeMatch(date.getDate(), cronTrigger[DOM]) || !utils.timeMatch(date.getDay(), cronTrigger[DOW])) {
                const domLimit = utils.getDomLimit(date.getFullYear(), date.getMonth());

                do {
                    const nextDom = nextCronTime(date.getDate(), cronTrigger[DOM]);
                    if (nextDom === null) { return null; }

                    // If the date is in the next month, add month
                    if (nextDom <= date.getDate() || nextDom > domLimit) {
                        date.setDate(1);
                        date.setMonth(date.getMonth() + 1);
                        date.setHours(0);
                        date.setMinutes(0);
                        date.setSeconds(0);
                        continue outmost;    // eslint-disable-line
                    }

                    date.setDate(nextDom);
                } while (!utils.timeMatch(date.getDay(), cronTrigger[DOW]));

                date.setHours(0);
                date.setMinutes(0);
                date.setSeconds(0);
            }

            if (!utils.timeMatch(date.getHours(), cronTrigger[HOUR])) {
                const nextHour = nextCronTime(date.getHours(), cronTrigger[HOUR]);

                if (nextHour <= date.getHours()) {
                    date.setDate(date.getDate() + 1);
                    date.setHours(nextHour);
                    date.setMinutes(0);
                    date.setSeconds(0);
                    continue;      // eslint-disable-line
                }

                date.setHours(nextHour);
                date.setMinutes(0);
                date.setSeconds(0);
            }

            if (!utils.timeMatch(date.getMinutes(), cronTrigger[MIN])) {
                const nextMinute = nextCronTime(date.getMinutes(), cronTrigger[MIN]);

                if (nextMinute <= date.getMinutes()) {
                    date.setHours(date.getHours() + 1);
                    date.setMinutes(nextMinute);
                    date.setSeconds(0);
                    continue;     // eslint-disable-line
                }

                date.setMinutes(nextMinute);
                date.setSeconds(0);
            }

            if (!utils.timeMatch(date.getSeconds(), cronTrigger[SECOND])) {
                const nextSecond = nextCronTime(date.getSeconds(), cronTrigger[SECOND]);

                if (nextSecond <= date.getSeconds()) {
                    date.setMinutes(date.getMinutes() + 1);
                    date.setSeconds(nextSecond);
                    continue;     // eslint-disable-line
                }

                date.setSeconds(nextSecond);
            }
            break;
        }

        this.nextTime = date.getTime();
        return this.nextTime;
    }
    /**
     * Decude the cronTrigger string to arrays
     * @param cronTimeStr The cronTimeStr need to decode, like "0 12 * * * 3"
     * @return The array to represent the cronTimer
     */
    static decodeTrigger(cronTimeStr) {
        const cronTimes = cronTimeStr.split(/\s+/);

        if (cronTimes.length !== 6) {
            console.log('error');
            return null;
        }

        for (let i = 0; i < cronTimes.length; i++) {
            cronTimes[i] = (utils.decodeTimeStr(cronTimes[i], i));

            if (!utils.checkNum(cronTimes[i], utils.Limit[i][0], utils.Limit[i][1])) {
                logger.error(`Decode crontime error, value exceed limit!${
                    JSON.stringify({ cronTime: cronTimes[i], limit: utils.Limit[i] })}`);
                return null;
            }
        }

        return cronTimes;
    }
}

module.exports.createTrigger = (trigger, job) => new CronTrigger(trigger, job);

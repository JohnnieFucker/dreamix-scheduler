const utils = {};
utils.Limit = [[0, 59], [0, 59], [0, 24], [1, 31], [0, 11], [0, 6]];

/**
 * Decode time range
 * @param map The decode map
 * @param timeStr The range string, like 2-5
 */
utils.decodeRangeTime = (map, timeStr) => {
    const times = timeStr.split('-');

    times[0] = Number(times[0]);
    times[1] = Number(times[1]);
    if (times[0] > times[1]) {
        console.log('Error time range');
        return;
    }

    for (let i = times[0]; i <= times[1]; i++) {
        map[i] = i;
    }
};

/**
 * Compute the period timer
 */
utils.decodePeriodTime = (map, timeStr, type) => {
    const times = timeStr.split('/');
    const min = this.Limit[type][0];
    const max = this.Limit[type][1];

    const remind = Number(times[0]);
    const period = Number(times[1]);

    if (period === 0) {
        return;
    }

    for (let i = min; i <= max; i++) {
        if (i % period === remind) {
            map[i] = i;
        }
    }
};


/**
 * Get the date limit of given month
 * @param year The given year
 * @param month The given month
 * @return The date count of given month
 */
utils.getDomLimit = (year, month) => {
    const date = new Date(year, month + 1, 0);

    return date.getDate();
};

/**
 * Check if the numbers are valid
 * @param nums The numbers array need to check
 * @param min Minimus value
 * @param max Maximam value
 * @return If all the numbers are in the data range
 */
utils.checkNum = (nums, min, max) => {
    if (nums === null) {
        return false;
    }

    if (nums === -1) {
        return true;
    }

    for (let i = 0; i < nums.length; i++) {
        if (nums[i] < min || nums[i] > max) {
            return false;
        }
    }

    return true;
};

/**
 * Match the given value to the cronTime
 * @param value The given value
 * @param cronTime The cronTime
 * @return The match result
 */
utils.timeMatch = (value, cronTime) => {
    if (typeof (cronTime) === 'number') {
        if (cronTime === -1) { return true; }
        return value === cronTime;
    } else if (Array.isArray(cronTime)) {
        if (value < cronTime[0] || value > cronTime[cronTime.length - 1]) { return false; }

        for (let i = 0; i < cronTime.length; i++) {
            if (value === cronTime[i]) { return true; }
        }

        return false;
    }

    return null;
};

/**
 * Decode the cron Time string
 * @param timeStr The cron time string, like: 1,2 or 1-3
 * @param type
 * @return A sorted array, like [1,2,3]
 */
utils.decodeTimeStr = (timeStr, type) => {
    const result = {};
    const arr = [];

    if (timeStr === '*') {
        return -1;
    } else if (timeStr.indexOf(',') > 0) {
        const timeArr = timeStr.split(',');
        for (let i = 0; i < timeArr.length; i++) {
            const time = timeArr[i];
            if (time.match(/^\d+-\d+$/)) {
                this.decodeRangeTime(result, time);
            } else if (time.match(/^\d+\/\d+/)) {
                this.decodePeriodTime(result, time, type);
            } else if (!isNaN(time)) {
                const num = Number(time);
                result[num] = num;
            } else { return null; }
        }
    } else if (timeStr.match(/^\d+-\d+$/)) {
        this.decodeRangeTime(result, timeStr);
    } else if (timeStr.match(/^\d+\/\d+/)) {
        this.decodePeriodTime(result, timeStr, type);
    } else if (!isNaN(timeStr)) {
        const num = Number(timeStr);
        result[num] = num;
    } else {
        return null;
    }

    for (const key in result) {
        if (result.hasOwnProperty(key)) {
            arr.push(result[key]);
        }
    }

    arr.sort((a, b) => a - b);

    return arr;
};

module.exports = utils;

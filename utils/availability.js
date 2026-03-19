function groupAvailability(hours) {
    let ranges = [];
    let rangeStart = parseInt(hours[0]);
    let rangeStartLabel = hours[0];
    let lastHour = parseInt(hours[0]);
    let lastHourLabel = hours[0];

    for (let i = 1; i < hours.length; i++) {
        let currentHour = parseInt(hours[i]);
        let currentLabel = hours[i];

        if (currentHour === lastHour + 1) {
            lastHour = currentHour;
            lastHourLabel = currentLabel;
        } else {
            if (rangeStart === lastHour) {
                ranges.push(rangeStartLabel);
            } else {
                ranges.push(`${rangeStartLabel} a ${lastHourLabel}`);
            }
            rangeStart = currentHour;
            rangeStartLabel = currentLabel;
            lastHour = currentHour;
            lastHourLabel = currentLabel;
        }
    }

    if (rangeStart === lastHour) {
        ranges.push(rangeStartLabel);
    } else {
        ranges.push(`${rangeStartLabel} a ${lastHourLabel}`);
    }

    return ranges;
}

module.exports = groupAvailability;
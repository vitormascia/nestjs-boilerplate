import BigNumber from "bignumber.js";
import ms from "ms";

const ONE_SECOND_IN_MILLISECONDS = ms("1 Second");
const ONE_MINUTE_IN_MILLISECONDS = ms("1 Minute");
const ONE_HOUR_IN_MILLISECONDS = ms("1 Hour");
const ONE_DAY_IN_MILLISECONDS = ms("1 Day");

const ONE_MINUTE_IN_SECONDS = new BigNumber(ONE_MINUTE_IN_MILLISECONDS)
	.dividedBy(1000)
	.toNumber();
const ONE_HOUR_IN_SECONDS = new BigNumber(ONE_MINUTE_IN_SECONDS)
	.times(60)
	.toNumber();
const ONE_DAY_IN_SECONDS = new BigNumber(ONE_HOUR_IN_SECONDS)
	.times(24)
	.toNumber();

const ONE_HOUR_IN_MINUTES = new BigNumber(ONE_HOUR_IN_MILLISECONDS)
	.dividedBy(ONE_MINUTE_IN_MILLISECONDS)
	.toNumber();
const ONE_DAY_IN_MINUTES = new BigNumber(ONE_DAY_IN_MILLISECONDS)
	.dividedBy(ONE_MINUTE_IN_MILLISECONDS)
	.toNumber();

const ONE_DAY_IN_HOURS = new BigNumber(ONE_DAY_IN_MILLISECONDS)
	.dividedBy(ONE_HOUR_IN_MILLISECONDS)
	.toNumber();

const time = Object.freeze({
	milliseconds: {
		second: ONE_SECOND_IN_MILLISECONDS,
		minute: ONE_MINUTE_IN_MILLISECONDS,
		hour: ONE_HOUR_IN_MILLISECONDS,
		day: ONE_DAY_IN_MILLISECONDS,
	},
	seconds: {
		minute: ONE_MINUTE_IN_SECONDS,
		hour: ONE_HOUR_IN_SECONDS,
		day: ONE_DAY_IN_SECONDS,
	},
	minutes: {
		hour: ONE_HOUR_IN_MINUTES,
		day: ONE_DAY_IN_MINUTES,
	},
	hours: {
		day: ONE_DAY_IN_HOURS,
	},
});

export default time;

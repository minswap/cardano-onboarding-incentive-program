import { format } from "date-fns";

const A_MINUTE = 60000;

export function getIntervalTime(
	from: number,
	to: number,
): { days: number; hours: number; minutes: number; seconds: number } {
	const ms = to - from >= 0 ? to - from : 0;

	const days = Math.floor(ms / (24 * 60 * 60 * 1000));
	const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
	const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
	const seconds = Math.floor((ms % (60 * 1000)) / 1000);

	return { days, hours, minutes, seconds };
}

const gmtRegex = /GMT../;

export const formatDate = (date: Date, localTz = true, pattern = "yyyy-MM-dd HH:mm O") => {
	if (!localTz) {
		const utcDate = toMagicUtcDate(date);
		let formattedDate = format(utcDate, pattern);
		if (pattern.includes("O")) {
			formattedDate = formattedDate.replace(gmtRegex, "UTC");
		} else {
			formattedDate += " UTC";
		}
		return formattedDate;
	}
	return format(date, pattern);
};

export const toMagicUtcDate = (date: Date) => {
	return new Date(date.getTime() + date.getTimezoneOffset() * A_MINUTE);
};

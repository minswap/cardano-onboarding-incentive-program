"use client";

import * as React from "react";
import { Separator } from "@/components/separator";
import { getIntervalTime } from "@/utils/date";

export function CountdownTimer({ startTime, endTime }: { startTime: number; endTime: number }) {
	const [currentTime, setCurrentTime] = React.useState(startTime);

	const timeLeft = React.useMemo(() => {
		return getIntervalTime(currentTime, endTime);
	}, [currentTime, endTime]);

	const { days, hours, minutes, seconds } = timeLeft;

	const isLessThanOneDayLeft = days < 1;

	React.useEffect(() => {
		if (startTime) {
			setCurrentTime(startTime);
		}
	}, [startTime]);

	React.useEffect(() => {
		const interval = setInterval(() => {
			setCurrentTime((prev) => prev + 1000);
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	return (
		<div className="flex items-center gap-2">
			{!isLessThanOneDayLeft ? (
				<>
					<TimeUnit
						label="D"
						value={days}
					/>
					<Separator />
				</>
			) : null}
			<TimeUnit
				label="H"
				value={hours}
			/>
			<Separator />
			<TimeUnit
				label="M"
				value={minutes}
			/>
			{isLessThanOneDayLeft ? (
				<>
					<Separator />
					<TimeUnit
						label="S"
						value={seconds}
					/>
				</>
			) : null}
		</div>
	);
}
function TimeUnit({ value, label }: { value: number; label: string }) {
	return (
		<div className="flex justify-center items-center gap-0.5 text-label-lg-sec">
			<span className="text-itr-tent-pri-df">{padZero(value)}</span>
			<span className="text-itr-tent-pri-sub">{label}</span>
		</div>
	);
}

const padZero = (num: number): string => (num < 10 ? `0${num}` : `${num}`);

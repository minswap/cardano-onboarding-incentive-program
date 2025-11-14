import { cn } from "@/lib/utils";
import { CountdownTimer } from "../count-down-timer";

export function ComingSoonBanner({ startTime, endTime }: { startTime: number; endTime: number }) {
	return (
		<div className="relative">
			<div className="relative flex justify-between flex-col lg:flex-row items-center lg:pl-8 lg:py-8 pt-8 gap-y-6 border rounded-[20px] max-w-screen overflow-hidden lg:h-[560px] border-bd-pri-sub">
				<div className="h-full flex flex-col justify-between gap-6 px-2">
					<div className="flex flex-col items-center lg:items-start gap-4">
						<div className="text-itr-tent-pri-sub text-label-lg-sec">Prize pool</div>
						<div className="text-itr-tent-pri-df text-title-h1 max-[378px]:text-title-h2">100,000 ₳ +</div>
					</div>
					<div className="flex flex-col items-center gap-6 lg:items-start">
						<div className="flex flex-col gap-6">
							<div className="flex flex-col items-center lg:items-start gap-4">
								<div className="text-label-lg-sec text-itr-tent-pri-sub">Event starts in</div>
								<CountdownTimer
									endTime={endTime}
									startTime={startTime}
								/>
							</div>
							<div className="space-y-2 text-itr-tent-pri-sub text-label-lg-sec text-center lg:text-left">
								<div className="block">The race hasn't started, but the prize smells delicious...</div>
								<div className="block">Sit tight - this is gonna get wild.</div>
							</div>
						</div>
					</div>
				</div>
				<div className={cn("w-full lg:w-[540px] h-full lg:h-[360px] lg:absolute right-0 bottom-0")}>
					<video
						autoPlay={true}
						className={cn("hidden dark:block object-cover w-full h-full")}
						loop={true}
						muted={true}
						playsInline={true}
						preload="none"
					>
						<source
							src="/videos/dark-banner.mp4"
							type="video/mp4"
						/>
					</video>
					<video
						autoPlay={true}
						className="block dark:hidden object-cover w-full h-full"
						loop={true}
						muted={true}
						playsInline={true}
						preload="none"
					>
						<source
							src="/videos/light-banner.mp4"
							type="video/mp4"
						/>
					</video>
				</div>
			</div>
			<div className="lg:block hidden">
				<video
					autoPlay={true}
					className="lg:w-[200px] h-[200px] absolute -right-6 block dark:hidden -top-0"
					loop={true}
					muted={true}
					playsInline={true}
					preload="none"
				>
					<source
						src="/videos/light-rose.mov"
						type="video/quicktime"
					/>
					<source
						src="/videos/light-rose.webm"
						type="video/webm"
					/>
				</video>
				<video
					autoPlay={true}
					className="lg:w-[200px] h-[200px] absolute -right-6 top-0 dark:block hidden"
					loop={true}
					muted={true}
					playsInline={true}
					preload="none"
				>
					<source
						src="/videos/dark-rose.mov"
						type="video/quicktime"
					/>
					<source
						src="/videos/dark-rose.webm"
						type="video/webm"
					/>
				</video>
			</div>
		</div>
	);
}

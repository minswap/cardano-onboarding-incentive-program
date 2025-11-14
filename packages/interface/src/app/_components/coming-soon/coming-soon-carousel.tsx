"use client";

import AutoScroll from "embla-carousel-auto-scroll";
import useEmblaCarousel from "embla-carousel-react";

const options = { loop: true };

const SLIDES = Array.from(Array(8).keys());

export function ComingSoonCarousel() {
	const [emblaRef] = useEmblaCarousel(options, [
		AutoScroll({
			speed: 1,
			stopOnInteraction: false,
			stopOnFocusIn: false,
			playOnInit: true,
		}),
	]);

	return (
		<div className="bg-brand-cool w-full rounded-3xl py-6 relative">
			<div className="absolute inset-0 z-40 rounded-3xl select-none" />
			<div
				className="overflow-hidden"
				ref={emblaRef}
			>
				<div className="flex">
					{SLIDES.map((value) => (
						<div
							className="flex items-center gap-6 mr-6 min-w-[183px]"
							key={value}
						>
							<span className="text-brand-deep text-label-xl-sec">·</span>
							<span className="text-brand-deep text-label-xl-pri line-clamp-1">Coming Soon</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

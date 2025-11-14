"use client";

import Lottie from "lottie-react";
import confetti from "@/lotties/confetti.json";

export function Confetti() {
	return (
		<Lottie
			animationData={confetti}
			autoPlay={true}
			className="pointer-events-none fixed inset-0 z-50"
			loop={false}
			rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
		></Lottie>
	);
}

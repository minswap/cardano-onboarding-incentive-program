import { cn } from "@/lib/utils";

type Props = {
	icon: React.ReactNode;
	onClick?: () => void;
	className?: string;
};

export function IconButton({ icon, onClick, className }: Props) {
	return (
		<button
			className={cn(
				"size-9 flex justify-center items-center bg-transparent rounded-full border border-bd-pri-df",
				"hover:border-sf-pri-hv hover:bg-sf-pri-hv",
				"active:border-sf-pri-pressed active:bg-sf-pri-pressed",
				"[&>svg]:size-5 text-itr-tent-sec-df",
				className,
			)}
			onClick={onClick}
			type="button"
		>
			{icon}
		</button>
	);
}
